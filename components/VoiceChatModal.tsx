import React, { useEffect, useRef } from 'react';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { CloseIcon, MicrophoneIcon, UserIcon, AiIcon } from './icons';

interface VoiceChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
}

const VoiceChatModal: React.FC<VoiceChatModalProps> = ({ isOpen, onClose, apiKey }) => {
  const { status, transcript, startChat, stopChat } = useVoiceChat(apiKey);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      startChat();
    } else {
      stopChat();
    }
  }, [isOpen]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);


  if (!isOpen) return null;

  const getStatusIndicator = () => {
    let color = 'text-slate-500';
    let text = 'Disconnected';
    let pulse = false;

    switch (status) {
      case 'connecting':
        color = 'text-amber-500 dark:text-amber-400';
        text = 'جاري الاتصال...';
        pulse = true;
        break;
      case 'connected':
        color = 'text-green-500 dark:text-green-400';
        text = 'متصل. ابدأ بالتحدث.';
        pulse = true;
        break;
      case 'error':
        color = 'text-red-500 dark:text-red-400';
        text = 'حدث خطأ. الرجاء المحاولة مرة أخرى.';
        break;
      case 'invalid_key':
        color = 'text-red-500 dark:text-red-400';
        text = 'مفتاح API غير صالح';
        break;
      case 'denied':
        color = 'text-red-500 dark:text-red-400';
        text = 'تم رفض الوصول إلى الميكروفون.';
        break;
      default:
        text = 'غير متصل';
        break;
    }

    return (
      <div className="flex items-center justify-center gap-2">
        {pulse && <span className={`relative flex h-3 w-3 ${status === 'connected' ? 'mr-1' : ''}`}><span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status === 'connected' ? 'bg-green-400' : 'bg-amber-400'} opacity-75`}></span><span className={`relative inline-flex rounded-full h-3 w-3 ${status === 'connected' ? 'bg-green-500' : 'bg-amber-500'}`}></span></span>}
        <span className={color}>{text}</span>
      </div>
    );
  };
  

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <MicrophoneIcon />
            <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-300">مساعد الذكاء الاصطناعي الصوتي</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </header>
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-800/50">
          {transcript.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.speaker === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                  <AiIcon className="w-5 h-5 text-sky-600 dark:text-sky-300" />
                </div>
              )}
              <div className={`max-w-md p-3 rounded-lg ${msg.speaker === 'user' ? 'bg-indigo-500 text-white dark:bg-indigo-600/40 dark:text-indigo-100 rounded-br-none' : 'bg-slate-200 text-slate-800 dark:bg-slate-700/60 dark:text-slate-200 rounded-bl-none'}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
               {msg.speaker === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5 text-slate-600 dark:text-slate-300"/>
                </div>
              )}
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
        <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 text-center">
            {status === 'invalid_key' ? (
                <div className="text-red-600 dark:text-red-400 text-sm">
                    <p className="font-bold mb-1">فشل الاتصال: مفتاح API غير صالح</p>
                    <p>يرجى إغلاق هذه النافذة وتحديث مفتاحك النشط في مدير مفاتيح API.</p>
                </div>
            ) : getStatusIndicator()}
        </footer>
      </div>
    </div>
  );
};

export default VoiceChatModal;