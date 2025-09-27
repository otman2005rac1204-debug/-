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

export interface DeveloperProfile {
  name: string;
  bio: string;
  website?: string;
  github?: string;
}
