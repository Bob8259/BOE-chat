export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
  | { type: 'file'; file: { filename: string; file_data: string } }
  | { type: 'file_id'; file_id: { id: string; name?: string; content?: string } };

export interface Message {
  role: 'user' | 'assistant';
  content: string | ContentPart[];
}

export interface CustomModel {
  id: string;
  name: string;
  capabilities: {
    websearch: boolean;
    images: boolean;
    files: boolean;
    video: boolean;
    stream: boolean;
  };
  parameters?: {
    temperature?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    max_tokens?: number;
  };
}

export interface UserSettings {
  baseUrl: string;
  apiKey: string;
  models: CustomModel[];
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  createdAt: number;
  usage?: Usage;
}

export const DEFAULT_MODELS: CustomModel[] = [
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    capabilities: { websearch: true, images: true, files: true, video: false, stream: true }
  },
  // {
  //   id: 'gemini-3-flash-preview-thinking-1229',
  //   name: 'Gemini 3 Flash Thinking (1229)',
  //   capabilities: { websearch: false, images: true, files: false, video: true, stream: true }
  // },
  // {
  //   id: 'gemini-3-flash-preview',
  //   name: 'Gemini 3 Flash',
  //   capabilities: { websearch: false, images: true, files: false, video: true, stream: true }
  // },
  {
    id: 'gemini-3-pro-preview-thinking-1229',
    name: 'Gemini 3 Pro Thinking (1229)',
    capabilities: { websearch: false, images: true, files: false, video: true, stream: true }
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    capabilities: { websearch: false, images: true, files: false, video: true, stream: true }
  },
];

export const STORAGE_KEY = 'boe-chat-sessions';
export const SETTINGS_KEY = 'boe-chat-settings';

