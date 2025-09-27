export interface CodeFile {
  fileName: string;
  code: string;
}

export interface CodeProject {
  id: string;
  projectName: string;
  description: string;
  files: CodeFile[];
  originalPrompt: string;
  language: string;
  localProjectPath?: string; // Path on disk for local projects
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
}

export interface ChatMessage {
  speaker: 'user' | 'ai';
  text: string;
}

// Types for the Electron IPC API exposed on the window object
export interface FsApi {
  openDirectory: () => Promise<string | undefined>;
  readDirectory: (path: string) => Promise<CodeFile[]>;
  saveFiles: (projectPath: string, files: CodeFile[]) => Promise<void>;
}

declare global {
  interface Window {
    fsApi: FsApi;
  }
}
