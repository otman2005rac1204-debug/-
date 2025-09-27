import React, { useState, useEffect, useRef } from 'react';
import { CodeProject } from '../types';
import { SaveIcon, DownloadIcon, FileCodeIcon, CopyIcon, PreviewIcon, RefineIcon, CiCdIcon, BackArrowIcon } from './icons';

declare var hljs: any;

const hideScrollbarStyle = `
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

interface ProjectDisplayProps {
  project: CodeProject | null;
  isLoading: boolean;
  error: string | null;
  onSave: () => void;
  isSaved: boolean;
  onDownloadZip: () => void;
  onCodeChange: (fileName: string, newCode: string) => void;
  onRefine: () => void;
  isRefining: boolean;
  refinementInput: string;
  setRefinementInput: (value: string) => void;
  onGenerateCiCd: () => void;
  isGeneratingCiCd: boolean;
  onProjectMetaChange: (field: 'projectName' | 'description', value: string) => void;
}

const ProjectDisplay: React.FC<ProjectDisplayProps> = ({ 
  project, isLoading, error, onSave, isSaved, onDownloadZip, onCodeChange,
  onRefine, isRefining, refinementInput, setRefinementInput,
  onGenerateCiCd, isGeneratingCiCd, onProjectMetaChange
}) => {
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [previewSrcDoc, setPreviewSrcDoc] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  
  useEffect(() => {
    if (project && project.files.length > 0) {
      if (!activeFileName || !project.files.some(f => f.fileName === activeFileName)) {
        setActiveFileName(project.files[0].fileName);
      }
    } else {
      setActiveFileName(null);
    }
  }, [project, activeFileName]);
  
  useEffect(() => {
      setIsPreviewMode(false);
  }, [project]);

  useEffect(() => {
    if (!project || project.language !== 'HTML/CSS/JS') {
        setPreviewSrcDoc('');
        return;
    };

    const htmlFile = project.files.find(f => f.fileName.endsWith('.html'));
    const cssFile = project.files.find(f => f.fileName.endsWith('.css'));
    const jsFile = project.files.find(f => f.fileName.endsWith('.js'));

    if (!htmlFile) {
        setPreviewSrcDoc('<html><body style="font-family: sans-serif; color: #555; display: flex; align-items: center; justify-content: center; height: 100vh;"><h1>No HTML file found to preview.</h1></body></html>');
        return;
    }

    let html = htmlFile.code;

    if (cssFile) {
        html = html.replace('</head>', `<style>${cssFile.code}</style></head>`);
    }
    if (jsFile) {
        html = html.replace('</body>', `<script defer>${jsFile.code}</script></body>`);
    }

    const timeout = setTimeout(() => {
        setPreviewSrcDoc(html);
    }, 250);

    return () => clearTimeout(timeout);
  }, [project]);

  const handleCopy = () => {
    const activeFile = project?.files.find(f => f.fileName === activeFileName);
    if (activeFile?.code) {
        navigator.clipboard.writeText(activeFile.code).then(() => {
            setCopySuccess('تم النسخ!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('فشل النسخ');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    }
  };
  
  const getLanguage = (fileName: string | undefined) => {
    if (!fileName) return 'plaintext';
    const ext = fileName.split('.').pop();
    if (ext === 'js' || ext === 'jsx' || ext === 'ts' || ext === 'tsx') return 'javascript';
    if (ext === 'css') return 'css';
    if (ext === 'html' || ext === 'vue') return 'xml';
    if (ext === 'py') return 'python';
    if (ext === 'json') return 'json';
    if (ext === 'yml' || ext === 'yaml') return 'yaml';
    return 'plaintext';
  };

  const getWelcomeMessage = () => (
    <div className="text-center p-10 bg-white dark:bg-slate-800/50 rounded-lg">
      <h2 className="text-2xl font-bold text-sky-600 dark:text-sky-400 mb-2">مرحباً بك في مولد المشاريع</h2>
      <p className="text-slate-600 dark:text-slate-400">
        اكتب فكرة مشروعك في اللوحة الجانبية، وسيقوم الذكاء الاصطناعي بإنشاء الكود الكامل لك.
      </p>
    </div>
  );
  
  const getLoadingState = () => (
     <div className="text-center p-10 bg-white dark:bg-slate-800/50 rounded-lg animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mx-auto mb-4"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mx-auto mb-6"></div>
        <div className="flex gap-4 mt-8">
            <div className="w-1/4 space-y-3">
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
            <div className="w-3/4 h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
    </div>
  );
  
  const getErrorState = () => (
    <div className="text-center p-10 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">حدث خطأ</h2>
        <p className="text-red-700 dark:text-red-300">{error}</p>
    </div>
  );

  if (isLoading) return getLoadingState();
  if (error) return getErrorState();
  if (!project) return getWelcomeMessage();

  const activeFile = project.files.find(f => f.fileName === activeFileName);
  const files = project.files || [];
  
  const showPreviewButton = project.language === 'HTML/CSS/JS';
  const ciCdFileExists = project.files.some(f => f.fileName.includes('.github/workflows/'));
  const isLocalProject = !!project.localProjectPath;

  const lineCount = activeFile ? activeFile.code.split('\n').length : 0;
  const highlightedCode = activeFile ? hljs.highlight(activeFile.code, { language: getLanguage(activeFile.fileName), ignoreIllegals: true }).value : '';


  return (
    <div className="bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-lg shadow-lg">
      <style>{hideScrollbarStyle}</style>
      <div className="flex flex-wrap gap-4 justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          {isLocalProject ? (
            <input
              type="text"
              value={project.projectName}
              onChange={(e) => onProjectMetaChange('projectName', e.target.value)}
              className="w-full text-3xl font-extrabold text-sky-600 dark:text-sky-400 bg-transparent focus:bg-white dark:focus:bg-slate-900/50 focus:ring-2 focus:ring-sky-500 rounded-md p-1 -m-1 transition-all border-none outline-none"
              placeholder="Project Name"
            />
          ) : (
            <h2 className="text-3xl font-extrabold text-sky-600 dark:text-sky-400">{project.projectName}</h2>
          )}
          <div className="flex items-start gap-2 mt-2">
            {isLocalProject ? (
              <textarea
                value={project.description}
                onChange={(e) => onProjectMetaChange('description', e.target.value)}
                rows={2}
                className="flex-1 text-slate-600 dark:text-slate-400 max-w-2xl bg-transparent focus:bg-white dark:focus:bg-slate-900/50 focus:ring-2 focus:ring-sky-500 rounded-md p-1 -m-1 transition-all border-none outline-none resize-y"
                placeholder="Project Description"
              />
            ) : (
              <p className="flex-1 text-slate-600 dark:text-slate-400 max-w-2xl">{project.description}</p>
            )}
            <span className="font-semibold text-xs bg-slate-200 text-sky-800 dark:bg-slate-700 dark:text-sky-300 px-2 py-1 rounded-full">{project.language}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onSave}
            disabled={isLocalProject ? false : isSaved}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all shadow-md"
          >
            <SaveIcon />
            {isLocalProject ? 'حفظ التغييرات' : (isSaved ? 'تم الحفظ' : 'حفظ المشروع')}
          </button>
          <button
            onClick={onGenerateCiCd}
            disabled={isGeneratingCiCd || ciCdFileExists}
            className="flex items-center gap-2 bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:bg-slate-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all shadow-md"
            title={ciCdFileExists ? 'ملف CI/CD موجود بالفعل' : 'إنشاء سير عمل GitHub Actions'}
          >
            {isGeneratingCiCd ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <CiCdIcon />
            )}
            {ciCdFileExists ? 'تم الإنشاء' : 'إنشاء CI/CD'}
          </button>
          {showPreviewButton && (
            <button
              onClick={() => setIsPreviewMode(true)}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded-lg transition-all shadow-md"
            >
              <PreviewIcon />
              معاينة مباشرة
            </button>
          )}
          {!isLocalProject && (
            <button
              onClick={onDownloadZip}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-all shadow-md"
            >
              <DownloadIcon />
              تنزيل ZIP
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <label htmlFor="refine-project" className="block text-md font-semibold mb-2 text-indigo-600 dark:text-indigo-300 flex items-center gap-2">
          <RefineIcon/>
          تحسين المشروع
        </label>
        <div className="flex gap-2">
          <input
            id="refine-project"
            type="text"
            className="flex-grow bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md p-2 text-slate-900 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-500"
            placeholder="مثال: اجعل الألوان داكنة أكثر"
            value={refinementInput}
            onChange={(e) => setRefinementInput(e.target.value)}
            disabled={isRefining}
            onKeyDown={(e) => e.key === 'Enter' && !isRefining && refinementInput.trim() && onRefine()}
          />
          <button
            onClick={onRefine}
            disabled={isRefining || !refinementInput.trim()}
            className="w-32 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all"
          >
            {isRefining ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : 'تحسين'}
          </button>
        </div>
      </div>
      
       {isPreviewMode ? (
        <div className="relative rounded-lg border border-slate-200 dark:border-slate-800" style={{ height: '60vh' }}>
          <div className="flex items-center justify-between bg-slate-200 dark:bg-slate-800 p-2 border-b border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <PreviewIcon />
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">معاينة مباشرة</span>
              </div>
              <button onClick={() => setIsPreviewMode(false)} className="flex items-center gap-2 text-sm bg-slate-300 hover:bg-slate-400 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 py-1 px-3 rounded-md transition-colors">
                  <BackArrowIcon />
                  العودة للمحرر
              </button>
          </div>
          <iframe
              srcDoc={previewSrcDoc}
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full bg-white"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: '55vh' }}>
          <aside className="lg:col-span-1 bg-slate-100 dark:bg-slate-900/50 rounded-lg p-3 flex flex-col">
            <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-300 mb-3 px-2">ملفات المشروع</h3>
            <ul className="space-y-1 overflow-y-auto">
              {files.map((file) => (
                <li key={file.fileName}>
                  <button
                    onClick={() => setActiveFileName(file.fileName)}
                    className={`w-full text-right flex items-center gap-3 p-2 rounded-md transition-colors text-sm ${
                      activeFileName === file.fileName ? 'bg-sky-200/60 text-sky-800 dark:bg-sky-800/60 dark:text-white' : 'hover:bg-slate-200/50 text-slate-700 dark:hover:bg-slate-700/50 dark:text-slate-300'
                    }`}
                  >
                    <FileCodeIcon />
                    <span className="truncate">{file.fileName}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <main className="lg:col-span-2 grid grid-cols-1 gap-4 h-full">
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg overflow-hidden flex flex-col h-full border border-slate-200 dark:border-slate-800">
                {activeFile ? (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-center bg-slate-200 dark:bg-slate-800 p-2 border-b border-slate-300 dark:border-slate-700 flex-shrink-0">
                            <span className="text-sm font-mono text-slate-600 dark:text-slate-400">{activeFile.fileName}</span>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 text-sm bg-slate-300 hover:bg-slate-400 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 py-1 px-3 rounded-md transition-colors"
                            >
                                {copySuccess ? <>{copySuccess}</> : <><CopyIcon /> نسخ</>}
                            </button>
                        </div>
                        <div className="flex-1 flex flex-row overflow-hidden code-editor">
                            <div
                                ref={lineNumbersRef}
                                className="py-4 pl-4 pr-3 font-mono text-sm text-slate-400 dark:text-slate-600 text-right select-none hide-scrollbar overflow-y-auto"
                                aria-hidden="true"
                            >
                                {Array.from({ length: lineCount }, (_, i) => (
                                    <div key={i} className="leading-relaxed h-[1.625rem]">{i + 1}</div>
                                ))}
                            </div>
                            <div className="relative flex-1">
                                <textarea
                                  ref={codeEditorRef}
                                  value={activeFile.code}
                                  onChange={(e) => onCodeChange(activeFile.fileName, e.target.value)}
                                  className="absolute inset-0 w-full h-full py-4 pr-4 pl-2 bg-transparent text-transparent caret-slate-800 dark:caret-white font-mono text-sm resize-none border-0 focus:ring-0 z-10 leading-relaxed"
                                  spellCheck="false"
                                  onScroll={(e) => {
                                      const target = e.currentTarget;
                                      if (preRef.current) {
                                          preRef.current.scrollTop = target.scrollTop;
                                          preRef.current.scrollLeft = target.scrollLeft;
                                      }
                                      if (lineNumbersRef.current) {
                                          lineNumbersRef.current.scrollTop = target.scrollTop;
                                      }
                                  }}
                                />
                                <pre
                                    ref={preRef}
                                    className="absolute inset-0 w-full h-full py-4 pr-4 pl-2 m-0 overflow-auto font-mono text-sm pointer-events-none leading-relaxed"
                                    aria-hidden="true"
                                >
                                    <code className={`hljs language-${getLanguage(activeFile.fileName)}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                                </pre>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        <p>الرجاء تحديد ملف لعرض محتواه.</p>
                    </div>
                )}
              </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default ProjectDisplay;