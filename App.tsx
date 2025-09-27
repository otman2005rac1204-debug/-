import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CodeProject, ApiKey, CodeFile } from './types';
import { generateProjectCode, refineProjectCode, generateCiCdWorkflow } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import ProjectInputPanel from './components/ProjectInputPanel';
import ProjectDisplay from './components/ProjectDisplay';
import { HeaderIcon, ApiKeyIcon, KeyIcon, TrashIcon, PlusIcon, MicrophoneIcon, UploadIcon, GitHubIcon } from './components/icons';
import FreeApiModal from './components/FreeApiModal';
import VoiceChatModal from './components/VoiceChatModal';
import PublishProjectModal from './components/DeveloperProfileModal';
import ThemeToggle from './components/ThemeToggle';
import GitHubPublishModal from './components/GitHubPublishModal';


declare var JSZip: any;

const App: React.FC = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [projectType, setProjectType] = useState<string>('HTML/CSS/JS');
  const [currentProject, setCurrentProject] = useState<CodeProject | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedProjects, setSavedProjects] = useLocalStorage<CodeProject[]>('savedProjects_code', []);
  const [refinementInput, setRefinementInput] = useState<string>('');
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  
  const [apiKeys, setApiKeys] = useLocalStorage<ApiKey[]>('gemini_api_keys', []);
  const [activeApiKeyId, setActiveApiKeyId] = useLocalStorage<string | null>('gemini_active_api_key_id', null);
  const [isApiKeyManagerOpen, setIsApiKeyManagerOpen] = useState<boolean>(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeyInput, setNewApiKeyInput] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isGeneratingCiCd, setIsGeneratingCiCd] = useState<boolean>(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState<boolean>(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [isCurrentApiKeyInvalid, setIsCurrentApiKeyInvalid] = useState<boolean>(false);
  
  const apiKeyManagerRef = useRef<HTMLDivElement>(null);

  const activeApiKey = apiKeys.find(k => k.id === activeApiKeyId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (apiKeyManagerRef.current && !apiKeyManagerRef.current.contains(event.target as Node)) {
        setIsApiKeyManagerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!activeApiKey) {
      setError('الرجاء تحديد مفتاح API نشط أولاً.');
      setIsApiKeyManagerOpen(true);
      return;
    }
    if (!userInput.trim()) {
      setError('الرجاء إدخال فكرة المشروع أولاً.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentProject(null);
    setRefinementInput('');
    setIsCurrentApiKeyInvalid(false);

    try {
      const projectCode = await generateProjectCode(userInput, projectType, activeApiKey.key);
      setCurrentProject({ ...projectCode, id: Date.now().toString(), originalPrompt: userInput });
    } catch (e: any) {
      console.error(e);
      if (e.message === 'Invalid API Key') {
        setError('فشل الإنشاء بسبب مفتاح API غير صالح. يرجى تحديثه في مدير مفاتيح API.');
        setIsApiKeyManagerOpen(true);
        setIsCurrentApiKeyInvalid(true);
      } else {
        setError('حدث خطأ أثناء إنشاء كود المشروع. قد تكون الخدمة تواجه مشاكل حاليًا.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userInput, projectType, activeApiKey]);

  const handleOpenLocalProject = useCallback(async () => {
    if (!window.fsApi) {
      setError("File system access is not available in this environment.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const projectPath = await window.fsApi.openDirectory();
      if (projectPath) {
        const files = await window.fsApi.readDirectory(projectPath);
        if (files.length === 0) {
          setError("لم يتم العثور على ملفات نصية قابلة للتحرير في المجلد المحدد.");
          setCurrentProject(null);
          return;
        }
        
        const projectName = projectPath.split(/[/\\]/).pop() || 'Local Project';
        
        const newProject: CodeProject = {
          id: `local-${projectPath}`,
          projectName,
          description: `مشروع محلي تم تحميله من: ${projectPath}`,
          files,
          originalPrompt: '',
          language: 'Local', // Or try to detect
          localProjectPath: projectPath,
        };
        setCurrentProject(newProject);
        setRefinementInput('');
      }
    } catch (err: any) {
      console.error("Failed to open local project:", err);
      setError(`فشل في فتح المشروع المحلي: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleSaveProject = useCallback(async () => {
    if (!currentProject) return;

    // Handle saving local projects to disk
    if (currentProject.localProjectPath) {
      if (!window.fsApi) {
        setError("File system access is not available to save.");
        return;
      }
      try {
        await window.fsApi.saveFiles(currentProject.localProjectPath, currentProject.files);
        // Maybe add a temporary success message
      } catch (err: any) {
        setError(`فشل حفظ الملفات على القرص: ${err.message}`);
      }
      return;
    }

    // Handle saving generated projects to local storage
    if (!savedProjects.some(p => p.id === currentProject.id)) {
        setSavedProjects([currentProject, ...savedProjects]);
    } else {
        setSavedProjects(savedProjects.map(p => p.id === currentProject.id ? currentProject : p));
    }
  }, [currentProject, savedProjects, setSavedProjects]);

  const handleSelectProject = useCallback((project: CodeProject) => {
    setCurrentProject(project);
    setRefinementInput('');
  }, []);

  const handleDeleteProject = useCallback((projectId: string) => {
    setSavedProjects(savedProjects.filter(p => p.id !== projectId));
    if (currentProject?.id === projectId) {
        setCurrentProject(null);
    }
  }, [savedProjects, setSavedProjects, currentProject]);

  const handleCodeChange = useCallback((fileName: string, newCode: string) => {
    if (!currentProject) return;

    const updatedFiles = currentProject.files.map(file =>
      file.fileName === fileName ? { ...file, code: newCode } : file
    );

    setCurrentProject({ ...currentProject, files: updatedFiles });
  }, [currentProject]);

  const handleProjectMetaChange = useCallback((field: 'projectName' | 'description', value: string) => {
    if (!currentProject) return;
    setCurrentProject({
      ...currentProject,
      [field]: value
    });
  }, [currentProject]);

  const handleRefine = useCallback(async () => {
    if (!activeApiKey) {
        setError('الرجاء تحديد مفتاح API نشط أولاً.');
        setIsApiKeyManagerOpen(true);
        return;
    }
    if (!refinementInput.trim() || !currentProject) {
        setError('يرجى تقديم تعليمات التحسين.');
        return;
    }

    setIsRefining(true);
    setError(null);
    setIsCurrentApiKeyInvalid(false);

    try {
        const { id, originalPrompt, localProjectPath, ...projectData } = currentProject;
        const refinedProjectCode = await refineProjectCode(originalPrompt || `A local project: ${currentProject.projectName}`, projectData, refinementInput, currentProject.language, activeApiKey.key);
        
        setCurrentProject({ ...currentProject, ...refinedProjectCode });

    } catch (e: any) {
        console.error(e);
        if (e.message === 'Invalid API Key') {
            setError('فشل التحسين بسبب مفتاح API غير صالح. يرجى تحديثه في مدير مفاتيح API.');
            setIsApiKeyManagerOpen(true);
            setIsCurrentApiKeyInvalid(true);
        } else {
            setError('حدث خطأ أثناء تحسين المشروع. قد تكون الخدمة تواجه مشاكل حاليًا.');
        }
    } finally {
        setIsRefining(false);
        setRefinementInput('');
    }
  }, [refinementInput, currentProject, activeApiKey]);

  const handleDownloadZip = useCallback(async () => {
    if (!currentProject) return;
    
    const zip = new JSZip();
    currentProject.files.forEach(file => {
        zip.file(file.fileName, file.code);
    });

    const blob = await zip.generateAsync({ type: 'blob' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `${currentProject.projectName.toLowerCase().replace(/[\s/\\?%*:|"<>]/g, '-')}.zip`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentProject]);

  const handleAddApiKey = () => {
    if (!newApiKeyName.trim() || !newApiKeyInput.trim()) return;

    if (!newApiKeyInput.startsWith('AIza') || newApiKeyInput.length < 39) {
        setApiKeyError('صيغة المفتاح غير صالحة. يجب أن يبدأ بـ "AIza" ويكون طوله 39 حرفًا على الأقل.');
        return;
    }

    setApiKeyError(null);
    setIsCurrentApiKeyInvalid(false);
    const newKey: ApiKey = {
        id: Date.now().toString(),
        name: newApiKeyName,
        key: newApiKeyInput,
    };
    const updatedKeys = [newKey, ...apiKeys];
    setApiKeys(updatedKeys);
    setActiveApiKeyId(newKey.id);
    setNewApiKeyName('');
    setNewApiKeyInput('');
    setError(null);
  };

  const handleDeleteApiKey = (keyId: string) => {
    const updatedKeys = apiKeys.filter(k => k.id !== keyId);
    setApiKeys(updatedKeys);
    if (activeApiKeyId === keyId) {
        const nextActiveKey = updatedKeys[0];
        setActiveApiKeyId(nextActiveKey ? nextActiveKey.id : null);
    }
  };

  const handleGenerateCiCd = useCallback(async () => {
    if (!currentProject || !activeApiKey) {
      setError('Please select a project and ensure an API key is active.');
      return;
    }

    if (currentProject.files.some(f => f.fileName.includes('.github/workflows'))) {
        return;
    }

    setIsGeneratingCiCd(true);
    setError(null);
    setIsCurrentApiKeyInvalid(false);

    try {
        const workflowCode = await generateCiCdWorkflow(currentProject, activeApiKey.key);
        const workflowFile: CodeFile = {
            fileName: '.github/workflows/ci.yml',
            code: workflowCode,
        };
        
        setCurrentProject(prevProject => {
            if (!prevProject) return null;
            return {
                ...prevProject,
                files: [...prevProject.files, workflowFile],
            };
        });

    } catch (e: any) {
        console.error(e);
         if (e.message === 'Invalid API Key') {
            setError('فشل إنشاء CI/CD بسبب مفتاح API غير صالح. يرجى تحديثه في مدير مفاتيح API.');
            setIsApiKeyManagerOpen(true);
            setIsCurrentApiKeyInvalid(true);
        } else {
            setError('An error occurred while generating the CI/CD workflow.');
        }
    } finally {
        setIsGeneratingCiCd(false);
    }
  }, [currentProject, activeApiKey]);

  const handleOpenVoiceChat = () => {
    if (!activeApiKey) {
        setError('الرجاء تحديد مفتاح API نشط أولاً لاستخدام المساعد الصوتي.');
        setIsApiKeyManagerOpen(true);
        return;
    }
    setIsVoiceChatOpen(true);
  }
  
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <header className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-20">
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HeaderIcon />
              <h1 className="text-2xl font-bold text-sky-600 dark:text-sky-400">مولد المشاريع بالذكاء الاصطناعي</h1>
            </div>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                <button 
                  onClick={handleOpenVoiceChat}
                  className="flex items-center gap-2 text-sm bg-indigo-500 hover:bg-indigo-600 border border-indigo-500/80 text-white dark:bg-indigo-600/50 dark:hover:bg-indigo-600 dark:text-indigo-200 font-semibold py-2 px-4 rounded-lg transition-colors"
                  title="تحدث مع مساعد الذكاء الاصطناعي"
                >
                  <MicrophoneIcon />
                  <span className="hidden sm:inline">مساعد AI</span>
                </button>
                 <button 
                  onClick={() => setIsGitHubModalOpen(true)}
                  disabled={!currentProject}
                  className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-900 text-white dark:bg-[#24292e] dark:hover:bg-[#343a40] font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-800 disabled:text-slate-600 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                  title={!currentProject ? "قم بإنشاء مشروع أولاً" : "دفع المشروع إلى GitHub"}
                >
                  <GitHubIcon />
                  <span className="hidden sm:inline">دفع إلى GitHub</span>
                </button>
                <button 
                  onClick={() => setIsPublishModalOpen(true)}
                  disabled={!currentProject || !!currentProject.localProjectPath}
                  className="flex items-center gap-2 text-sm bg-slate-200 hover:bg-slate-300 border border-slate-300/80 text-slate-700 dark:bg-slate-700/50 dark:hover:bg-slate-700 dark:border-slate-600/80 dark:text-sky-300 font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:border-slate-300 dark:disabled:border-slate-700 disabled:text-slate-500 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                  title={!currentProject ? "قم بإنشاء مشروع أولاً" : (currentProject?.localProjectPath ? "لا يمكن نشر المشاريع المحلية" : "نشر المشروع على GoFile")}
                >
                  <UploadIcon />
                  <span className="hidden sm:inline">نشر المشروع</span>
                </button>
               <button 
                  onClick={() => setIsApiModalOpen(true)}
                  className="flex items-center gap-2 text-sm bg-slate-200 hover:bg-slate-300 border border-slate-300/80 text-slate-700 dark:bg-slate-700/50 dark:hover:bg-slate-700 dark:border-slate-600/80 dark:text-sky-300 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  <ApiKeyIcon />
                  <span className="hidden md:inline">APIs مجانية</span>
                </button>
                <div className="relative" ref={apiKeyManagerRef}>
                    <button 
                        onClick={() => setIsApiKeyManagerOpen(!isApiKeyManagerOpen)}
                        className={`flex items-center gap-2 text-sm border font-semibold py-2 px-4 rounded-lg transition-colors ${activeApiKey ? 'bg-green-100 hover:bg-green-200 border-green-500/80 text-green-700 dark:bg-green-600/20 dark:hover:bg-green-600/30 dark:border-green-600/80 dark:text-green-300' : 'bg-amber-100 hover:bg-amber-200 border-amber-500/80 text-amber-700 dark:bg-amber-600/20 dark:hover:bg-amber-600/30 dark:border-amber-600/80 dark:text-amber-300'}`}
                    >
                        <KeyIcon />
                        <span className="hidden md:inline">مفتاح API</span>
                    </button>
                    {isApiKeyManagerOpen && (
                        <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4 z-30 flex flex-col gap-4">
                            <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-300">إدارة مفاتيح API</h3>
                            
                            {isCurrentApiKeyInvalid && (
                                <div className="bg-red-50 dark:bg-red-900/40 border border-red-300 dark:border-red-600/50 text-red-800 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
                                    <p className="font-bold mb-1">مفتاح API النشط غير صالح</p>
                                    <p className="mb-2">يرجى تحديد مفتاح مختلف، أو إضافة واحد جديد. يتم حفظ المفاتيح في متصفحك فقط.</p>
                                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-semibold text-red-700 dark:text-red-200 underline hover:no-underline">
                                        الحصول على مفتاح Gemini API جديد &rarr;
                                    </a>
                                </div>
                            )}

                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
                                {apiKeys.length > 0 ? apiKeys.map(key => (
                                    <div key={key.id} className="flex items-center justify-between p-2 rounded-md bg-slate-100/50 dark:bg-slate-900/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors">
                                        <label htmlFor={`key-${key.id}`} className="flex items-center gap-3 cursor-pointer flex-1 truncate">
                                            <input
                                                type="radio"
                                                id={`key-${key.id}`}
                                                name="api-key-selection"
                                                checked={activeApiKeyId === key.id}
                                                onChange={() => {
                                                  setActiveApiKeyId(key.id);
                                                  setIsCurrentApiKeyInvalid(false);
                                                }}
                                                className="h-4 w-4 text-sky-600 bg-slate-200 border-slate-400 focus:ring-sky-600 dark:text-sky-500 dark:bg-slate-700 dark:border-slate-600 dark:focus:ring-sky-500"
                                            />
                                            <div className="truncate">
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{key.name}</span>
                                                <span className="text-xs text-slate-500 font-mono block truncate">{`••••••••${key.key.slice(-4)}`}</span>
                                            </div>
                                        </label>
                                        <button onClick={() => handleDeleteApiKey(key.id)} className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-full transition-colors flex-shrink-0" aria-label={`Delete key ${key.name}`}>
                                            <TrashIcon />
                                        </button>
                                    </div>
                                )) : (
                                    <p className="text-slate-500 text-center py-4">لا توجد مفاتيح محفوظة.</p>
                                )}
                            </div>
                            
                            <hr className="border-slate-200 dark:border-slate-700" />

                            <div className="flex flex-col gap-3">
                                <h4 className="font-semibold text-sky-600 dark:text-sky-300">إضافة مفتاح جديد</h4>
                                 <input
                                    type="text"
                                    value={newApiKeyName}
                                    onChange={(e) => setNewApiKeyName(e.target.value)}
                                    placeholder="اسم المفتاح (مثال: مفتاح العمل)"
                                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md p-2 text-slate-800 dark:text-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                                />
                                <div className="flex flex-col">
                                    <input
                                        type="password"
                                        value={newApiKeyInput}
                                        onChange={(e) => {
                                            setNewApiKeyInput(e.target.value);
                                            if (apiKeyError) setApiKeyError(null);
                                            setIsCurrentApiKeyInvalid(false);
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddApiKey()}
                                        placeholder="قيمة المفتاح (مثال: AIza...)"
                                        className={`w-full bg-slate-100 dark:bg-slate-900 border rounded-md p-2 text-slate-800 dark:text-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all placeholder-slate-400 dark:placeholder-slate-500 ${apiKeyError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                                    />
                                    {apiKeyError && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{apiKeyError}</p>}
                                </div>
                                 <button
                                    onClick={handleAddApiKey}
                                    disabled={!newApiKeyName.trim() || !newApiKeyInput.trim()}
                                    className="w-full flex justify-center items-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg transition-all"
                                >
                                    <PlusIcon/>
                                    إضافة وحفظ
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">يتم تخزين مفاتيحك بشكل آمن في التخزين المحلي للمتصفح.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ProjectInputPanel
              userInput={userInput}
              setUserInput={setUserInput}
              projectType={projectType}
              setProjectType={setProjectType}
              onGenerate={handleGenerate}
              isLoading={isLoading}
              savedProjects={savedProjects}
              onSelectProject={handleSelectProject}
              onDeleteProject={handleDeleteProject}
              currentProjectId={currentProject?.id}
              isApiKeySet={!!activeApiKey}
              onOpenLocalProject={handleOpenLocalProject}
            />
          </div>
          <div className="lg:col-span-2">
            <ProjectDisplay
              project={currentProject}
              isLoading={isLoading}
              error={error}
              onSave={handleSaveProject}
              isSaved={currentProject ? savedProjects.some(p => p.id === currentProject.id) : false}
              onDownloadZip={handleDownloadZip}
              onCodeChange={handleCodeChange}
              onRefine={handleRefine}
              isRefining={isRefining}
              refinementInput={refinementInput}
              setRefinementInput={setRefinementInput}
              onGenerateCiCd={handleGenerateCiCd}
              isGeneratingCiCd={isGeneratingCiCd}
              onProjectMetaChange={handleProjectMetaChange}
            />
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-slate-500 text-sm border-t border-slate-200 dark:border-slate-800 mt-8">
        <p>تم التطوير بواسطة مهندس React خبير وواجهات Gemini API</p>
      </footer>
      <FreeApiModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />
      {activeApiKey && <VoiceChatModal isOpen={isVoiceChatOpen} onClose={() => setIsVoiceChatOpen(false)} apiKey={activeApiKey.key} />}
      <PublishProjectModal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} project={currentProject} />
      <GitHubPublishModal isOpen={isGitHubModalOpen} onClose={() => setIsGitHubModalOpen(false)} project={currentProject} />
    </div>
  );
};

export default App;