import React from 'react';
import { CodeProject } from '../types';
import { GenerateIcon, ProjectIcon, TrashIcon } from './icons';

interface ProjectInputPanelProps {
  userInput: string;
  setUserInput: (value: string) => void;
  projectType: string;
  setProjectType: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  savedProjects: CodeProject[];
  onSelectProject: (project: CodeProject) => void;
  onDeleteProject: (projectId: string) => void;
  currentProjectId?: string | null;
  isApiKeySet: boolean;
}

const PROJECT_TYPES = [
    "HTML/CSS/JS",
    "React (Vite)",
    "Vue.js (Vite)",
    "Python",
    "Node.js (Express)",
    "React + Node.js (Express)",
    "Vue + Node.js (Express)",
];

const ProjectInputPanel: React.FC<ProjectInputPanelProps> = ({
  userInput,
  setUserInput,
  projectType,
  setProjectType,
  onGenerate,
  isLoading,
  savedProjects,
  onSelectProject,
  onDeleteProject,
  currentProjectId,
  isApiKeySet,
}) => {
  const isGenerateDisabled = isLoading || !userInput.trim() || !isApiKeySet;

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg flex flex-col gap-6 h-full sticky top-24">
      <div>
        <label htmlFor="project-idea" className="block text-lg font-semibold mb-2 text-sky-300">
          صف فكرة مشروعك
        </label>
        <textarea
          id="project-idea"
          rows={5}
          className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all placeholder-slate-500"
          placeholder="مثال: تطبيق قائمة مهام بسيط"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="language-select" className="block text-lg font-semibold mb-2 text-sky-300">
          اختر نوع المشروع
        </label>
        <select
          id="language-select"
          value={projectType}
          onChange={(e) => setProjectType(e.target.value)}
          disabled={isLoading}
          className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
        >
          {PROJECT_TYPES.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>
      <div className="relative">
        <button
          onClick={onGenerate}
          disabled={isGenerateDisabled}
          title={!isApiKeySet ? 'الرجاء إضافة وتحديد مفتاح API نشط أولاً' : ''}
          className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              جاري الإنشاء...
            </>
          ) : (
            <>
              <GenerateIcon />
              إنشاء كود المشروع
            </>
          )}
        </button>
        {!isApiKeySet && !isLoading && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-amber-800/80 text-amber-200 text-xs rounded-md">
                مطلوب مفتاح API نشط
            </div>
        )}
      </div>


      <div className="border-t border-slate-700 pt-4 mt-2">
        <h3 className="text-lg font-semibold text-sky-300 mb-3">المشاريع المحفوظة</h3>
        {savedProjects.length > 0 ? (
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {savedProjects.map((project) => (
              <li key={project.id}>
                <div
                  className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-all ${
                    currentProjectId === project.id
                      ? 'bg-sky-800/50 ring-2 ring-sky-500'
                      : 'bg-slate-700/50 hover:bg-slate-700'
                  }`}
                >
                  <button onClick={() => onSelectProject(project)} className="flex items-center gap-3 text-right flex-1 truncate">
                    <ProjectIcon />
                    <span className="truncate">{project.projectName}</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                    className="p-1 text-slate-400 hover:text-red-400 rounded-full transition-colors"
                    aria-label="Delete project"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-center py-4">لا توجد مشاريع محفوظة بعد.</p>
        )}
      </div>
    </div>
  );
};

export default ProjectInputPanel;
