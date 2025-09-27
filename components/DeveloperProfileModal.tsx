import React, { useState } from 'react';
import { CloseIcon, UploadIcon } from './icons';
import { CodeProject } from '../types';

declare var JSZip: any;

interface PublishProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CodeProject | null;
}

type PublishStatus = 'idle' | 'loading' | 'success' | 'error';

const PublishProjectModal: React.FC<PublishProjectModalProps> = ({ isOpen, onClose, project }) => {
  const [gofileToken, setGofileToken] = useState('');
  const [status, setStatus] = useState<PublishStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successUrl, setSuccessUrl] = useState('');

  const handlePublish = async () => {
    if (!project || !gofileToken.trim()) {
        setErrorMessage('رمز GoFile مطلوب.');
        setStatus('error');
        return;
    }

    setStatus('loading');
    setErrorMessage('');
    setSuccessUrl('');

    try {
        // Step 1: Zip the project files
        const zip = new JSZip();
        project.files.forEach(file => {
            zip.file(file.fileName, file.code);
        });
        const blob = await zip.generateAsync({ type: 'blob' });
        const filename = `${project.projectName.toLowerCase().replace(/[\s/\\?%*:|"<>]/g, '-')}.zip`;
        const projectFile = new File([blob], filename, { type: 'application/zip' });


        // Step 2: Get the best server
        const serverResponse = await fetch('https://api.gofile.io/getServer');
        if (!serverResponse.ok) throw new Error('لا يمكن الاتصال بخوادم GoFile.');
        const serverData = await serverResponse.json();
        if (serverData.status !== 'ok') throw new Error('فشل الحصول على خادم GoFile.');
        const serverName = serverData.data.server;

        // Step 3: Prepare FormData for upload
        const formData = new FormData();
        formData.append('file', projectFile);
        formData.append('token', gofileToken);

        // Step 4: Upload the file
        const uploadResponse = await fetch(`https://${serverName}.gofile.io/uploadFile`, {
            method: 'POST',
            body: formData,
        });

        if (!uploadResponse.ok) throw new Error('فشل تحميل الملف.');
        const uploadData = await uploadResponse.json();
        if (uploadData.status !== 'ok') {
            throw new Error(uploadData.data?.message || 'حدث خطأ غير معروف أثناء التحميل.');
        }

        setSuccessUrl(uploadData.data.downloadPage);
        setStatus('success');

    } catch (e: any) {
        setErrorMessage(e.message || 'حدث خطأ غير متوقع.');
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
            <UploadIcon />
            <h2 className="text-xl font-bold text-sky-600 dark:text-sky-300">نشر المشروع على GoFile</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </header>
        <div className="p-6 overflow-y-auto space-y-4">
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                سيتم ضغط مشروعك الحالي ("{project?.projectName || 'المشروع'}") في ملف ZIP وتحميله إلى حساب GoFile الخاص بك.
                يمكنك الحصول على رمزك من <a href="https://gofile.io/myprofile" target="_blank" rel="noopener noreferrer" className="text-indigo-500 dark:text-indigo-400 hover:underline">صفحة ملفك الشخصي في GoFile</a>.
            </p>
            
            <div className="flex flex-col gap-1">
                <label htmlFor="gofile-token" className="text-slate-700 dark:text-slate-300 font-semibold">رمز GoFile API</label>
                <input id="gofile-token" type="password" value={gofileToken} onChange={e => setGofileToken(e.target.value)} placeholder="أدخل رمزك هنا" className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md p-2 text-slate-800 dark:text-slate-300 focus:ring-2 focus:ring-sky-500 transition-all placeholder-slate-400 dark:placeholder-slate-500" />
            </div>
        </div>

        <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 flex flex-col items-center gap-3">
            <button
              onClick={handlePublish}
              disabled={status === 'loading' || !project}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg transition-all"
            >
              {status === 'loading' ? (
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'تحميل ونشر المشروع'}
            </button>
             {status === 'success' && (
                <div className="text-center text-sm text-green-600 dark:text-green-400 break-all">
                    تم التحميل بنجاح! الرابط: <a href={successUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline">{successUrl}</a>
                </div>
            )}
            {status === 'error' && (
                <div className="text-center text-sm text-red-600 dark:text-red-400">
                    خطأ: {errorMessage}
                </div>
            )}
        </footer>
      </div>
    </div>
  );
};

export default PublishProjectModal;