export interface BotModel {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or color
  color: string; // brand color for the bot
  capabilities: {
    images: boolean;
    files: boolean;
    stream: boolean;
  };
}

export const MODELS: BotModel[] = [
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    description: 'OpenAI 最新旗舰模型，擅长复杂推理和创作',
    icon: '🟢',
    color: '#10A37F',
    capabilities: { images: true, files: true, stream: true },
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    description: '快速且经济的模型，适合日常对话',
    icon: '🟡',
    color: '#F5A623',
    capabilities: { images: true, files: true, stream: true },
  },
  {
    id: 'gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    description: '最快的模型，适合简单任务',
    icon: '⚡',
    color: '#FF6B35',
    capabilities: { images: false, files: false, stream: true },
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: 'Anthropic 的平衡模型，擅长分析和写作',
    icon: '🟠',
    color: '#D97706',
    capabilities: { images: true, files: true, stream: true },
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    description: 'Anthropic 最强模型，深度推理能力',
    icon: '🔴',
    color: '#DC2626',
    capabilities: { images: true, files: true, stream: true },
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Google 最新模型，多模态能力强',
    icon: '🔵',
    color: '#4285F4',
    capabilities: { images: true, files: true, stream: true },
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Google 快速模型，性价比高',
    icon: '💎',
    color: '#34A853',
    capabilities: { images: true, files: false, stream: true },
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    description: '深度思考模型，擅长数学和编程',
    icon: '🧠',
    color: '#7C3AED',
    capabilities: { images: false, files: false, stream: true },
  },
];

export function getModelById(id: string): BotModel | undefined {
  return MODELS.find(m => m.id === id);
}
