import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CodeProject, ApiKey, CodeFile } from './types';
import { generateProjectCode, refineProjectCode, generateCiCdWorkflow } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import ProjectInputPanel from './components/ProjectInputPanel';
import ProjectDisplay from './components/ProjectDisplay';
import { HeaderIcon, ApiKeyIcon, KeyIcon, TrashIcon, PlusIcon, MicrophoneIcon, IdIcon } from './components/icons';
import FreeApiModal from './components/FreeApiModal';
import VoiceChatModal from './components/VoiceChatModal';
import DeveloperProfileModal from './components/DeveloperProfileModal';


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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  
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

    try {
      const projectCode = await generateProjectCode(userInput, projectType, activeApiKey.key);
      setCurrentProject({ ...projectCode, id: Date.now().toString(), originalPrompt: userInput });
    } catch (e) {
      console.error(e);
      setError('حدث خطأ أثناء إنشاء كود المشروع. قد يكون مفتاح API غير صالح أو أن الخدمة تواجه مشاكل.');
    } finally {
      setIsLoading(false);
    }
  }, [userInput, projectType, activeApiKey]);
  
  const handleSaveProject = useCallback(() => {
    if (!currentProject) return;

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

    try {
        const { id, originalPrompt, ...projectData } = currentProject;
        const refinedProjectCode = await refineProjectCode(originalPrompt, projectData, refinementInput, currentProject.language, activeApiKey.key);
        
        setCurrentProject({ ...currentProject, ...refinedProjectCode });

    } catch (e) {
        console.error(e);
        setError('حدث خطأ أثناء تحسين المشروع. قد يكون مفتاح API غير صالح أو أن الخدمة تواجه مشاكل.');
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

    } catch (e) {
        console.error(e);
        setError('An error occurred while generating the CI/CD workflow.');
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
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <header className="bg-slate-900/70 backdrop-blur-lg border-b border-slate-700 p-4 sticky top-0 z-20">
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HeaderIcon />
              <h1 className="text-2xl font-bold text-sky-400">مولد المشاريع بالذكاء الاصطناعي</h1>
            </div>
            <div className="flex items-center gap-2">
                <button 
                  onClick={handleOpenVoiceChat}
                  className="flex items-center gap-2 text-sm bg-indigo-600/50 hover:bg-indigo-600 border border-indigo-500/80 text-indigo-200 font-semibold py-2 px-4 rounded-lg transition-colors"
                  title="تحدث مع مساعد الذكاء الاصطناعي"
                >
                  <MicrophoneIcon />
                  <span>مساعد AI</span>
                </button>
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2 text-sm bg-slate-700/50 hover:bg-slate-700 border border-slate-600/80 text-sky-300 font-semibold py-2 px-4 rounded-lg transition-colors"
                  title="حفظ ملف المطور"
                >
                  <IdIcon />
                  <span>ملف المطور</span>
                </button>
               <button 
                  onClick={() => setIsApiModalOpen(true)}
                  className="flex items-center gap-2 text-sm bg-slate-700/50 hover:bg-slate-700 border border-slate-600/80 text-sky-300 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  <ApiKeyIcon />
                  <span>APIs مجانية</span>
                </button>
                <div className="relative" ref={apiKeyManagerRef}>
                    <button 
                        onClick={() => setIsApiKeyManagerOpen(!isApiKeyManagerOpen)}
                        className={`flex items-center gap-2 text-sm border font-semibold py-2 px-4 rounded-lg transition-colors ${activeApiKey ? 'bg-green-600/20 hover:bg-green-600/30 border-green-600/80 text-green-300' : 'bg-amber-600/20 hover:bg-amber-600/30 border-amber-600/80 text-amber-300'}`}
                    >
                        <KeyIcon />
                        <span>مفتاح API</span>
                    </button>
                    {isApiKeyManagerOpen && (
                        <div className="absolute top-full right-0 mt-2 w-96 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 z-30 flex flex-col gap-4">
                            <h3 className="text-lg font-semibold text-sky-300">إدارة مفاتيح API</h3>
                            
                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
                                {apiKeys.length > 0 ? apiKeys.map(key => (
                                    <div key={key.id} className="flex items-center justify-between p-2 rounded-md bg-slate-900/50 hover:bg-slate-700/50 transition-colors">
                                        <label htmlFor={`key-${key.id}`} className="flex items-center gap-3 cursor-pointer flex-1 truncate">
                                            <input
                                                type="radio"
                                                id={`key-${key.id}`}
                                                name="api-key-selection"
                                                checked={activeApiKeyId === key.id}
                                                onChange={() => setActiveApiKeyId(key.id)}
                                                className="h-4 w-4 text-sky-500 bg-slate-700 border-slate-600 focus:ring-sky-500"
                                            />
                                            <div className="truncate">
                                                <span className="font-semibold text-slate-200 block truncate">{key.name}</span>
                                                <span className="text-xs text-slate-500 font-mono block truncate">{`••••••••${key.key.slice(-4)}`}</span>
                                            </div>
                                        </label>
                                        <button onClick={() => handleDeleteApiKey(key.id)} className="p-1 text-slate-400 hover:text-red-400 rounded-full transition-colors flex-shrink-0" aria-label={`Delete key ${key.name}`}>
                                            <TrashIcon />
                                        </button>
                                    </div>
                                )) : (
                                    <p className="text-slate-500 text-center py-4">لا توجد مفاتيح محفوظة.</p>
                                )}
                            </div>
                            
                            <hr className="border-slate-700" />

                            <div className="flex flex-col gap-3">
                                <h4 className="font-semibold text-sky-300">إضافة مفتاح جديد</h4>
                                 <input
                                    type="text"
                                    value={newApiKeyName}
                                    onChange={(e) => setNewApiKeyName(e.target.value)}
                                    placeholder="اسم المفتاح (مثال: مفتاح العمل)"
                                    className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all placeholder-slate-500"
                                />
                                <div className="flex flex-col">
                                    <input
                                        type="password"
                                        value={newApiKeyInput}
                                        onChange={(e) => {
                                            setNewApiKeyInput(e.target.value);
                                            if (apiKeyError) setApiKeyError(null);
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddApiKey()}
                                        placeholder="قيمة المفتاح (مثال: AIza...)"
                                        className={`w-full bg-slate-900 border rounded-md p-2 text-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all placeholder-slate-500 ${apiKeyError ? 'border-red-500' : 'border-slate-600'}`}
                                    />
                                    {apiKeyError && <p className="text-xs text-red-400 mt-1">{apiKeyError}</p>}
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
            />
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-slate-500 text-sm border-t border-slate-800 mt-8">
        <p>تم التطوير بواسطة مهندس React خبير وواجهات Gemini API</p>
      </footer>
      <FreeApiModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />
      {activeApiKey && <VoiceChatModal isOpen={isVoiceChatOpen} onClose={() => setIsVoiceChatOpen(false)} apiKey={activeApiKey.key} />}
      <DeveloperProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
};

export default App;