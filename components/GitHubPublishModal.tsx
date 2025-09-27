import React, { useState, useEffect } from 'react';
import { CloseIcon, GitHubIcon } from './icons';
import { CodeProject } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { publishToGitHub } from '../services/githubService';

interface GitHubPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CodeProject | null;
}

type PublishStatus = 'idle' | 'loading' | 'success' | 'error';

const GitHubPublishModal: React.FC<GitHubPublishModalProps> = ({ isOpen, onClose, project }) => {
  const [githubToken, setGithubToken] = useLocalStorage<string>('github_pat', '');
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [commitMessage, setCommitMessage] = useState('Initial commit from AI Project Generator');
  const [createNew, setCreateNew] = useState(true);
  const [isPrivate, setIsPrivate] = useState(true);

  const [status, setStatus] = useState<PublishStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [successUrl, setSuccessUrl] = useState('');

  useEffect(() => {
    if (project) {
        setRepoName(project.projectName.toLowerCase().replace(/[\s/\\?%*:|"<>]/g, '-'));
    }
    if (!isOpen) {
        // Reset state on close
        setStatus('idle');
        setStatusMessage('');
        setSuccessUrl('');
    }
  }, [project, isOpen]);


  const handlePublish = async () => {
    if (!project || !githubToken.trim() || !repoOwner.trim() || !repoName.trim()) {
        setStatusMessage('يرجى ملء جميع الحقول المطلوبة.');
        setStatus('error');
        return;
    }

    setStatus('loading');
    setStatusMessage('جاري النشر إلى GitHub...');
    setSuccessUrl('');

    try {
      const url = await publishToGitHub({
        project,
        token: githubToken,
        owner: repoOwner,
        repo: repoName,
        commitMessage: commitMessage || 'Initial commit',
        createNew,
        isPrivate
      });
      setSuccessUrl(url);
      setStatusMessage('تم النشر بنجاح!');
      setStatus('success');
    } catch (e: any) {
        setStatusMessage(e.message || 'حدث خطأ غير متوقع.');
        setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <GitHubIcon />
            <h2 className="text-xl font-bold text-sky-600 dark:text-sky-300">النشر على GitHub</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </header>
        <div className="p-6 overflow-y-auto space-y-4">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
                سيؤدي هذا إلى تهيئة مستودع Git ودفع مشروعك "{project?.projectName || 'المشروع'}" إلى GitHub.
                ستحتاج إلى <a href="https://github.com/settings/tokens/new?scopes=repo&description=AI%20Project%20Generator" target="_blank" rel="noopener noreferrer" className="text-indigo-500 dark:text-indigo-400 hover:underline">رمز وصول شخصي (PAT)</a> مع صلاحية `repo`.
            </p>
            
            <div className="flex flex-col gap-1">
                <label htmlFor="github-token" className="text-slate-700 dark:text-slate-300 font-semibold">رمز الوصول الشخصي (PAT)</label>
                <input id="github-token" type="password" value={githubToken} onChange={e => setGithubToken(e.target.value)} placeholder="ghp_..." className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md p-2 text-slate-800 dark:text-slate-300 focus:ring-2 focus:ring-sky-500 transition-all placeholder-slate-400 dark:placeholder-slate-500" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <label htmlFor="repo-owner" className="text-slate-700 dark:text-slate-300 font-semibold">المالك (اسم المستخدم)</label>
                    <input id="repo-owner" type="text" value={repoOwner} onChange={e => setRepoOwner(e.target.value)} placeholder="YourGitHubUsername" className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md p-2 text-slate-800 dark:text-slate-300 focus:ring-2 focus:ring-sky-500 transition-all placeholder-slate-400 dark:placeholder-slate-500" />
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor="repo-name" className="text-slate-700 dark:text-slate-300 font-semibold">اسم المستودع</label>
                    <input id="repo-name" type="text" value={repoName} onChange={e => setRepoName(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md p-2 text-slate-800 dark:text-slate-300 focus:ring-2 focus:ring-sky-500 transition-all" />
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="commit-message" className="text-slate-700 dark:text-slate-300 font-semibold">رسالة الـ Commit</label>
                <input id="commit-message" type="text" value={commitMessage} onChange={e => setCommitMessage(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md p-2 text-slate-800 dark:text-slate-300 focus:ring-2 focus:ring-sky-500 transition-all" />
            </div>

            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg">
                <label htmlFor="create-new-repo" className="flex items-center gap-3 cursor-pointer">
                    <input id="create-new-repo" type="checkbox" checked={createNew} onChange={e => setCreateNew(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                    <span className="text-slate-700 dark:text-slate-300">إنشاء مستودع جديد</span>
                </label>
                 {createNew && (
                     <label htmlFor="is-private" className="flex items-center gap-3 cursor-pointer">
                        <input id="is-private" type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                        <span className="text-slate-700 dark:text-slate-300">خاص (Private)</span>
                     </label>
                )}
            </div>
             <p className="text-xs text-slate-500">
                إذا لم تقم بتحديد "إنشاء مستودع جديد"، سيتم الدفع إلى مستودع موجود بنفس الاسم. إذا قمت بتحديده، فسيتم إنشاء مستودع جديد.
            </p>

        </div>

        <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 flex flex-col items-center gap-3">
            <button
              onClick={handlePublish}
              disabled={status === 'loading' || !project}
              className="w-full flex items-center justify-center gap-2 bg-[#24292e] hover:bg-[#343a40] dark:bg-slate-600 dark:hover:bg-slate-500 disabled:bg-slate-500 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg transition-all"
            >
              {status === 'loading' ? (
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : ( <GitHubIcon/> )}
               {status === 'loading' ? statusMessage : 'نشر المشروع'}
            </button>
             {status === 'success' && (
                <div className="text-center text-sm text-green-600 dark:text-green-400 break-all">
                    {statusMessage} الرابط: <a href={successUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline">{successUrl}</a>
                </div>
            )}
            {status === 'error' && (
                <div className="text-center text-sm text-red-600 dark:text-red-400">
                    خطأ: {statusMessage}
                </div>
            )}
        </footer>
      </div>
    </div>
  );
};

export default GitHubPublishModal;
