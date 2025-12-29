'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { UserSettings, CustomModel, DEFAULT_MODELS, SETTINGS_KEY } from '@/app/components/types';

export default function SettingsPage() {
  const router = useRouter();
  const [showApiKey, setShowApiKey] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    models: DEFAULT_MODELS,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const editingModel = settings.models.find(m => m.id === editingModelId);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsed,
          models: Array.isArray(parsed.models) && parsed.models.length > 0 
            ? parsed.models 
            : prev.models
        }));
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  }, [settings, isLoaded]);

  const addModel = () => {
    const newModel: CustomModel = {
      id: 'new-model-' + Date.now(),
      name: 'New Model',
      capabilities: { websearch: false, images: false, files: false, video: false, stream: true }
    };
    setSettings({ ...settings, models: [newModel, ...settings.models] });
  };

  const removeModel = async (id: string) => {
    const model = settings.models.find(m => m.id === id);
    if (!model) return;

    const result = await Swal.fire({
      title: 'Remove Model?',
      text: `Are you sure you want to remove "${model.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#18181b',
      confirmButtonText: 'Yes, remove it!',
      background: document.documentElement.classList.contains('dark') ? '#09090b' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
    });

    if (result.isConfirmed) {
      setSettings({ ...settings, models: settings.models.filter(m => m.id !== id) });
    }
  };

  const updateModel = (id: string, updates: Partial<CustomModel>) => {
    setSettings({
      ...settings,
      models: settings.models.map(m => m.id === id ? { ...m, ...updates } : m)
    });
  };

  const filteredModels = settings.models.filter(m => 
    m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) || 
    m.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            {!settings.apiKey && (
              <p className="text-sm text-red-500 mt-1">Please enter an API Key to start chatting</p>
            )}
          </div>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors font-medium"
          >
            Back to Chat
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Provider Config */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">API Provider</h3>
            <div className="space-y-2">
              <label className="text-sm block">Base URL</label>
              <input
                type="text"
                value={settings.baseUrl || ''}
                onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm block">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={settings.apiKey || ''}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {showApiKey ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-fit">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">Quick Help</h3>
            <ul className="text-sm space-y-2 text-zinc-600 dark:text-zinc-400">
              <li>• Base URL: Your OpenAI-compatible API endpoint.</li>
              <li>• API Key: Your secret key for authentication.</li>
              <li>• Models: Add and configure the models you want to use.</li>
            </ul>
          </div>
        </div>

        {/* Models Config */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
            <h3 className="text-lg font-bold">Model Configurations</h3>
            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  value={modelSearchQuery || ''}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  placeholder="Search models..."
                  className="w-full p-2.5 pl-9 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
              </div>
              <button
                onClick={addModel}
                className="px-4 py-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black rounded-xl font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                + Add Model
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModels.map((model) => (
              <div key={model.id} className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col gap-4 relative group">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-500">Name</label>
                      <input
                        type="text"
                        value={model.name || ''}
                        onChange={(e) => updateModel(model.id, { name: e.target.value })}
                        className="w-full p-1 text-sm bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-500">ID</label>
                      <input
                        type="text"
                        value={model.id || ''}
                        onChange={(e) => updateModel(model.id, { id: e.target.value })}
                        className="w-full p-1 text-sm bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => removeModel(model.id)}
                      className="text-zinc-400 hover:text-red-500 p-1 transition-colors"
                      title="Remove Model"
                    >
                      ×
                    </button>
                    <button
                      onClick={() => setEditingModelId(model.id)}
                      className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1 transition-colors"
                      title="Model Settings"
                    >
                      ⚙️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredModels.length === 0 && (
            <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-zinc-500">No models found matching "{modelSearchQuery}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Model Settings Modal */}
      {editingModel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 sticky top-0 z-10">
              <h3 className="text-xl font-bold truncate pr-4">Settings: {editingModel.name}</h3>
              <button onClick={() => setEditingModelId(null)} className="text-2xl hover:text-zinc-500 transition-colors">×</button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Capabilities */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Capabilities</h4>
                <div className="grid grid-cols-2 gap-3">
                  <CapabilityCheckbox 
                    label="Web Search" 
                    checked={editingModel.capabilities?.websearch} 
                    onChange={(checked) => updateModel(editingModel.id, { capabilities: { ...editingModel.capabilities, websearch: checked } })} 
                  />
                  <CapabilityCheckbox 
                    label="Images" 
                    checked={editingModel.capabilities?.images} 
                    onChange={(checked) => updateModel(editingModel.id, { capabilities: { ...editingModel.capabilities, images: checked } })} 
                  />
                  <CapabilityCheckbox 
                    label="Files" 
                    checked={editingModel.capabilities?.files} 
                    onChange={(checked) => updateModel(editingModel.id, { capabilities: { ...editingModel.capabilities, files: checked } })} 
                  />
                  <CapabilityCheckbox 
                    label="Video" 
                    checked={editingModel.capabilities?.video} 
                    onChange={(checked) => updateModel(editingModel.id, { capabilities: { ...editingModel.capabilities, video: checked } })} 
                  />
                  <CapabilityCheckbox 
                    label="Stream" 
                    checked={editingModel.capabilities?.stream} 
                    onChange={(checked) => updateModel(editingModel.id, { capabilities: { ...editingModel.capabilities, stream: checked } })} 
                  />
                </div>
              </div>

              {/* Parameters */}
              <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Parameters</h4>
                <div className="space-y-4">
                  <ParameterInput
                    label="Temperature"
                    value={editingModel.parameters?.temperature}
                    onChange={(val) => updateModel(editingModel.id, { parameters: { ...editingModel.parameters, temperature: val } })}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                  <ParameterInput
                    label="Top P"
                    value={editingModel.parameters?.top_p}
                    onChange={(val) => updateModel(editingModel.id, { parameters: { ...editingModel.parameters, top_p: val } })}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                  <ParameterInput
                    label="Frequency Penalty"
                    value={editingModel.parameters?.frequency_penalty}
                    onChange={(val) => updateModel(editingModel.id, { parameters: { ...editingModel.parameters, frequency_penalty: val } })}
                    min={-2}
                    max={2}
                    step={0.1}
                  />
                  <ParameterInput
                    label="Presence Penalty"
                    value={editingModel.parameters?.presence_penalty}
                    onChange={(val) => updateModel(editingModel.id, { parameters: { ...editingModel.parameters, presence_penalty: val } })}
                    min={-2}
                    max={2}
                    step={0.1}
                  />
                  <ParameterInput
                    label="Max Tokens"
                    value={editingModel.parameters?.max_tokens}
                    onChange={(val) => updateModel(editingModel.id, { parameters: { ...editingModel.parameters, max_tokens: val } })}
                    min={1}
                    max={128000}
                    step={1}
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end bg-white dark:bg-zinc-900 sticky bottom-0 z-10">
              <button
                onClick={() => setEditingModelId(null)}
                className="px-6 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ParameterInput({ label, value, onChange, min, max, step }: { 
  label: string, 
  value?: number, 
  onChange: (val?: number) => void,
  min: number,
  max: number,
  step: number
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded min-w-[3rem] text-center">
          {value === undefined ? 'N/A' : value}
        </span>
      </div>
      <div className="flex gap-4 items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? min}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100 transition-opacity ${value === undefined ? 'opacity-30' : 'opacity-100'}`}
        />
        <button 
          onClick={() => onChange(value === undefined ? (min + max) / 2 : undefined)}
          className={`text-[10px] px-2 py-1 rounded transition-colors whitespace-nowrap ${
            value === undefined 
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          {value === undefined ? 'Set' : 'Reset'}
        </button>
      </div>
    </div>
  );
}

function CapabilityCheckbox({ label, checked, onChange }: { label: string, checked: boolean, onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
      <input
        type="checkbox"
        checked={checked || false}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-500"
      />
      <span className="text-xs group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">{label}</span>
    </label>
  );
}

