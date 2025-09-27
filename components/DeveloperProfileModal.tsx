import React, { useState } from 'react';
import { CloseIcon, IdIcon } from './icons';
import { DeveloperProfile } from '../types';

interface DeveloperProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SaveStatus = 'idle' | 'loading' | 'success' | 'error';

const DeveloperProfileModal: React.FC<DeveloperProfileModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [github, setGithub] = useState('');
  const [gofileToken, setGofileToken] = useState('');

  const [status, setStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successUrl, setSuccessUrl] = useState('');

  const handleSave = async () => {
    if (!name.trim() || !gofileToken.trim()) {
        setErrorMessage('الاسم ورمز GoFile مطلوبان.');
        setStatus('error');
        return;
    }

    setStatus('loading');
    setErrorMessage('');
    setSuccessUrl('');

    try {
        // Step 1: Get the best server
        const serverResponse = await fetch('https://api.gofile.io/getServer');
        if (!serverResponse.ok) throw new Error('لا يمكن الاتصال بخوادم GoFile.');
        const serverData = await serverResponse.json();
        if (serverData.status !== 'ok') throw new Error('فشل الحصول على خادم GoFile.');
        const serverName = serverData.data.server;

        // Step 2: Prepare the profile data
        const profile: DeveloperProfile = { name, bio, website, github };
        const profileJson = JSON.stringify(profile, null, 2);
        const profileBlob = new Blob([profileJson], { type: 'application/json' });

        // Step 3: Prepare FormData for upload
        const formData = new FormData();
        formData.append('file', profileBlob, 'developer-profile.json');
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
        className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <IdIcon />
            <h2 className="text-xl font-bold text-sky-300">حفظ ملف المطور</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </header>
        <div className="p-6 overflow-y-auto space-y-4">
            <p className="text-slate-400 text-sm mb-4">
                املأ معلوماتك وأدخل رمز GoFile API الخاص بك لحفظ ملفك الشخصي كملف JSON.
                يمكنك الحصول على رمزك من <a href="https://gofile.io/myprofile" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">صفحة ملفك الشخصي في GoFile</a>.
            </p>

            <div className="flex flex-col gap-1">
                <label htmlFor="dev-name" className="text-slate-300 font-semibold">الاسم</label>
                <input id="dev-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="اسمك الكامل" className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-300 focus:ring-2 focus:ring-sky-500 transition-all placeholder-slate-500" />
            </div>
            <div className="flex flex-col gap-1">
                <label htmlFor="dev-bio" className="text-slate-300 font-semibold">نبذة تعريفية</label>
                <textarea id="dev-bio" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="مطور برامج متخصص في..." className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-300 focus:ring-2 focus:ring-sky-500 transition-all placeholder-slate-500" />
            </div>
            <div className="flex flex-col gap-1">
                <label htmlFor="dev-website" className="text-slate-300 font-semibold">الموقع الإلكتروني (اختياري)</label>
                <input id="dev-website" type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-300 focus:ring-2 focus:ring-sky-500 transition-all placeholder-slate-500" />
            </div>
            <div className="flex flex-col gap-1">
                <label htmlFor="dev-github" className="text-slate-300 font-semibold">ملف GitHub (اختياري)</label>
                <input id="dev-github" type="url" value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/username" className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-300 focus:ring-2 focus:ring-sky-500 transition-all placeholder-slate-500" />
            </div>
            
            <hr className="border-slate-700" />
            
            <div className="flex flex-col gap-1">
                <label htmlFor="gofile-token" className="text-slate-300 font-semibold">رمز GoFile API</label>
                <input id="gofile-token" type="password" value={gofileToken} onChange={e => setGofileToken(e.target.value)} placeholder="أدخل رمزك هنا" className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-300 focus:ring-2 focus:ring-sky-500 transition-all placeholder-slate-500" />
            </div>
        </div>

        <footer className="p-4 border-t border-slate-700 flex-shrink-0 flex flex-col items-center gap-3">
            <button
              onClick={handleSave}
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg transition-all"
            >
              {status === 'loading' ? (
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'حفظ ونشر الملف'}
            </button>
             {status === 'success' && (
                <div className="text-center text-sm text-green-400">
                    تم الحفظ بنجاح! الرابط: <a href={successUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline">{successUrl}</a>
                </div>
            )}
            {status === 'error' && (
                <div className="text-center text-sm text-red-400">
                    خطأ: {errorMessage}
                </div>
            )}
        </footer>
      </div>
    </div>
  );
};

export default DeveloperProfileModal;
