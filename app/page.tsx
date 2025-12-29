'use client';

import { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import axios from 'axios';
import Link from 'next/link';
import { 
  Message, 
  ContentPart,
  CustomModel, 
  UserSettings, 
  Session, 
  DEFAULT_MODELS, 
  STORAGE_KEY, 
  SETTINGS_KEY 
} from '@/app/components/types';
import { Markdown } from '@/app/components/Markdown';

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; data: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const genericFileInputRef = useRef<HTMLInputElement>(null);
  const [globalModelId, setGlobalModelId] = useState<string>('');
  const [settings, setSettings] = useState<UserSettings>({
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    models: DEFAULT_MODELS,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStreamEnabled, setIsStreamEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const uploadMenuRef = useRef<HTMLDivElement>(null);

  // Close upload menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
        setShowUploadMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load sessions and settings from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse sessions:', e);
      }
    }

    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsed,
          // Ensure models is always an array and not empty
          models: Array.isArray(parsed.models) && parsed.models.length > 0 
            ? parsed.models 
            : prev.models
        }));
        
        // Load the last used model or the first from settings
        const lastModelId = localStorage.getItem('boe-chat-last-model');
        if (lastModelId) {
          setGlobalModelId(lastModelId);
        } else if (parsed.models?.length > 0) {
          setGlobalModelId(parsed.models[0].id);
        }
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save sessions to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions, isLoaded]);

  // Save last used model
  useEffect(() => {
    if (globalModelId) {
      localStorage.setItem('boe-chat-last-model', globalModelId);
    }
  }, [globalModelId]);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];
  const selectedModel = currentSession?.modelId || globalModelId || settings?.models?.[0]?.id || '';
  const currentModel = settings?.models?.find(m => m.id === selectedModel);
  const supportsImages = currentModel?.capabilities?.images;
  const supportsFiles = currentModel?.capabilities?.files;

  const createNewSession = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      modelId: selectedModel,
      createdAt: Date.now(),
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter(s => s.id !== id);
    setSessions(updatedSessions);
    if (currentSessionId === id) {
      setCurrentSessionId(updatedSessions.length > 0 ? updatedSessions[0].id : null);
    }
  };

  const clearAllSessions = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete all your chat history and cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#18181b', // matching dark gray
      cancelButtonColor: '#ef4444', // red
      confirmButtonText: 'Yes, clear all!',
      background: document.documentElement.classList.contains('dark') ? '#09090b' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
    });

    if (result.isConfirmed) {
      setSessions([]);
      setCurrentSessionId(null);
      localStorage.removeItem(STORAGE_KEY);
      Swal.fire({
        title: 'Cleared!',
        text: 'All sessions have been deleted.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: document.documentElement.classList.contains('dark') ? '#09090b' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
      });
    }
  };

  const updateSessionModel = (modelId: string) => {
    setGlobalModelId(modelId);
    if (!currentSessionId) return;
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId ? { ...s, modelId } : s
    ));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        title: 'Error',
        text: 'Please upload an image file.',
        icon: 'error',
        confirmButtonColor: '#18181b',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    // Reset file input so the same file can be selected again
    e.target.value = '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Data = base64.split(',')[1];
        
        setSelectedFile({
          name: file.name,
          data: base64Data
        });
        setIsUploadingFile(false);
      };
      reader.onerror = () => {
        setIsUploadingFile(false);
        Swal.fire({
          title: 'Error',
          text: 'Failed to read file.',
          icon: 'error',
          confirmButtonColor: '#18181b',
        });
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('File reading error:', error);
      setIsUploadingFile(false);
      Swal.fire({
        title: 'Error',
        text: 'Failed to read file.',
        icon: 'error',
        confirmButtonColor: '#18181b',
      });
    } finally {
      e.target.value = '';
    }
  };

  const updateSessionMessages = (sessionId: string, newMessages: Message[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        // Update title based on first message if it's "New Chat"
        let title = s.title;
        if (title === 'New Chat' && newMessages.length > 0) {
          const firstMsg = newMessages[0];
          let contentText = '';
          if (typeof firstMsg.content === 'string') {
            contentText = firstMsg.content;
          } else {
            const textPart = firstMsg.content.find(p => p.type === 'text');
            if (textPart && 'text' in textPart) {
              contentText = textPart.text;
            }
          }
          title = contentText.slice(0, 30) + (contentText.length > 30 ? '...' : '');
        }
        return { ...s, messages: newMessages, title };
      }
      return s;
    }));
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage && !selectedFile) || isLoading) return;

    let targetSessionId = currentSessionId;
    let targetMessages = messages;
    let targetModelId = selectedModel;

    let userMessageContent: string | ContentPart[] = input;
    if (selectedImage || selectedFile) {
      const parts: ContentPart[] = [];
      if (input.trim()) {
        parts.push({ type: 'text', text: input });
      } else if (selectedImage && !input.trim()) {
        parts.push({ type: 'text', text: 'What is in this image?' });
      } else if (selectedFile && !input.trim()) {
        parts.push({ type: 'text', text: 'Please analyze this file.' });
      }

      if (selectedImage) {
        parts.push({ type: 'image_url', image_url: { url: selectedImage } });
      }
      if (selectedFile) {
        parts.push({ 
          type: 'file', 
          file: { 
            filename: selectedFile.name, 
            file_data: selectedFile.data
          } 
        });
      }
      userMessageContent = parts;
    }

    const userMessage: Message = { role: 'user', content: userMessageContent };

    // Create a new session if none exists
    if (!targetSessionId) {
      const newSessionId = Date.now().toString();
      let titleText = 'New Chat';
      if (typeof userMessageContent === 'string') {
        titleText = userMessageContent;
      } else {
        const textPart = userMessageContent.find(p => p.type === 'text');
        if (textPart && 'text' in textPart) {
          titleText = textPart.text;
        } else if (selectedImage) {
          titleText = 'Image Chat';
        } else if (selectedFile) {
          titleText = `File: ${selectedFile.name}`;
        }
      }
        
      const newSession: Session = {
        id: newSessionId,
        title: titleText.slice(0, 30) + (titleText.length > 30 ? '...' : ''),
        messages: [userMessage],
        modelId: selectedModel,
        createdAt: Date.now(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSessionId);
      targetSessionId = newSessionId;
      targetMessages = [userMessage];
      targetModelId = newSession.modelId;
    } else {
      targetMessages = [...messages, userMessage];
      updateSessionMessages(targetSessionId, targetMessages);
    }
    
    setInput('');
    setSelectedImage(null);
    setSelectedFile(null);
    setIsLoading(true);

    try {
      const modelConfig = settings.models.find(m => m.id === targetModelId);
      const isStream = isStreamEnabled && modelConfig?.capabilities?.stream === true;
      
      const response = await axios.post('/api/chat', {
        messages: targetMessages,
        model: targetModelId,
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey,
        parameters: modelConfig?.parameters,
        stream: isStream,
      }, {
        responseType: isStream ? 'stream' : 'json',
        adapter: 'fetch'
      });

      if (isStream) {
        const reader = response.data?.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = '';

        // Add placeholder for assistant message only if we have a reader
        if (reader) {
          setSessions(prev => prev.map(s => 
            s.id === targetSessionId 
              ? { ...s, messages: [...s.messages, { role: 'assistant', content: '' }] } 
              : s
          ));
        } else {
          throw new Error('Failed to get response reader');
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data.trim() === '[DONE]') break;
              
                try {
                const parsed = JSON.parse(data);
                
                // Handle usage data in stream
                if (parsed.usage) {
                  const usage = parsed.usage;
                  setSessions(prev => prev.map(s => 
                    s.id === targetSessionId 
                      ? { ...s, usage: usage } 
                      : s
                  ));
                }

                const content = parsed.choices[0]?.delta?.content || '';
                if (content) {
                  assistantMessage += content;
                  
                  setSessions(prev => prev.map(s => {
                    if (s.id === targetSessionId) {
                      const newMsgs = [...s.messages];
                      if (newMsgs.length > 0) {
                        newMsgs[newMsgs.length - 1] = { 
                          ...newMsgs[newMsgs.length - 1], 
                          content: assistantMessage 
                        };
                      }
                      return { ...s, messages: newMsgs };
                    }
                    return s;
                  }));
                }
              } catch (e) {
                console.error('Error parsing stream:', e);
              }
            }
          }
        }
      } else {
        // Handle non-streaming response
        const assistantMessage = response.data?.choices?.[0]?.message?.content || '';
        const usage = response.data?.usage;
        setSessions(prev => prev.map(s => 
          s.id === targetSessionId 
            ? { 
                ...s, 
                messages: [...s.messages, { role: 'assistant', content: assistantMessage }],
                usage: usage || s.usage
              } 
            : s
        ));
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      let errorMessage = error.message || 'Something went wrong. Please check your settings.';
      
      if (axios.isAxiosError(error) && error.response?.data) {
        // If responseType is 'stream', the error data might be a Blob or ReadableStream
        if (error.response.data instanceof ReadableStream || error.response.data instanceof Blob) {
          try {
            // Try to parse error from stream if possible, but usually it's easier to just use the status text
            errorMessage = `Request failed with status ${error.response.status}: ${error.response.statusText}`;
          } catch (e) {
            errorMessage = error.message;
          }
        } else {
          const errorData = error.response.data;
          if (typeof errorData === 'object' && errorData.error) {
            errorMessage = errorData.error;
          }
        }
      }

      // Show error warning as a toast/alert
      Swal.fire({
        title: 'Chat Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#18181b',
        background: document.documentElement.classList.contains('dark') ? '#09090b' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
      });

      const errorMsg: Message = { role: 'assistant', content: `Error: ${errorMessage}` };
      setSessions(prev => prev.map(s => {
        if (s.id === targetSessionId) {
          const newMsgs = [...s.messages];
          // If the last message is an empty assistant message (from the placeholder), replace it
          if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === 'assistant' && newMsgs[newMsgs.length - 1].content === '') {
            newMsgs[newMsgs.length - 1] = errorMsg;
          } else {
            newMsgs.push(errorMsg);
          }
          return { ...s, messages: newMsgs };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-black text-black dark:text-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-zinc-800 flex flex-col hidden md:flex">
        <div className="p-4">
          <button
            onClick={createNewSession}
            className="w-full p-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-medium"
          >
            <span>+</span> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setCurrentSessionId(s.id)}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                currentSessionId === s.id
                  ? 'bg-zinc-100 dark:bg-zinc-800'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              <div className="flex flex-col truncate flex-1 mr-2">
                <span className="truncate text-sm font-medium">{s.title}</span>
                {s.usage && (
                  <span className="text-[10px] text-zinc-500 truncate">
                    {s.usage.total_tokens.toLocaleString()} tokens
                  </span>
                )}
              </div>
              <button
                onClick={(e) => deleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all flex-shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800 space-y-2">
          <Link
            href="/settings"
            className="w-full p-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            ⚙️ Settings
          </Link>
          {sessions.length > 0 && (
            <button
              onClick={clearAllSessions}
              className="w-full p-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Clear All Sessions
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <header className="py-4 px-6 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-2xl">☰</button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold">BOE Chat</h1>
              {currentSession?.usage && (
                <span className="text-[10px] text-zinc-500 font-medium">
                  Usage: {currentSession.usage.prompt_tokens.toLocaleString()}p + {currentSession.usage.completion_tokens.toLocaleString()}c = {currentSession.usage.total_tokens.toLocaleString()} tokens
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedModel}
              onChange={(e) => updateSessionModel(e.target.value)}
              className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              disabled={isLoading}
            >
              {(settings?.models || []).map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4 max-w-3xl mx-auto w-full custom-scrollbar" 
          ref={scrollRef}
        >
          {(!currentSessionId || messages.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2 text-center">
              <p className="text-lg">Start a conversation!</p>
              {!settings.apiKey && (
                <div className="text-sm text-amber-600 dark:text-amber-500 flex flex-col items-center gap-2">
                  <p>You need to set your API Key in Settings before you can chat.</p>
                  <Link 
                    href="/settings"
                    className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors font-medium"
                  >
                    Go to Settings
                  </Link>
                </div>
              )}
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl ${
                  m.role === 'user'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black rounded-tr-none'
                    : 'bg-zinc-100 text-black dark:bg-zinc-800 dark:text-white rounded-tl-none'
                }`}
              >
                <div className="break-words">
                  {typeof m.content === 'string' ? (
                    <Markdown content={m.content} role={m.role as 'user' | 'assistant'} />
                  ) : (
                    <div className="space-y-2">
                      {m.content.map((part, index) => {
                        if (part.type === 'text') {
                          return <Markdown key={index} content={part.text} role={m.role as 'user' | 'assistant'} />;
                        } else if (part.type === 'image_url') {
                          return (
                            <img 
                              key={index} 
                              src={part.image_url.url} 
                              alt="Uploaded" 
                              className="max-w-full rounded-lg border border-zinc-700 dark:border-zinc-300" 
                            />
                          );
                        } else if (part.type === 'file') {
                          return (
                            <div key={index} className="flex items-center gap-2 p-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg text-sm">
                              <span>📄</span>
                              <div className="flex flex-col">
                                <span className="font-medium">{part.file.filename}</span>
                                <span className="text-[10px] opacity-70">Base64 encoded</span>
                              </div>
                            </div>
                          );
                        } else if (part.type === 'file_id') {
                          return (
                            <div key={index} className="flex items-center gap-2 p-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg text-sm">
                              <span>📄</span>
                              <div className="flex flex-col">
                                {part.file_id.name && <span className="font-medium">{part.file_id.name}</span>}
                                <span className="font-mono text-[10px] opacity-70">{part.file_id.id}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                  {m.role === 'assistant' && m.content === '' && isLoading && (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm text-zinc-500 animate-pulse">Thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex justify-start">
              <div className="max-w-[85%] p-4 rounded-2xl bg-zinc-100 text-black dark:bg-zinc-800 dark:text-white rounded-tl-none">
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm text-zinc-500 animate-pulse">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-2">
            {currentModel?.capabilities?.stream && (
              <button
                type="button"
                onClick={() => setIsStreamEnabled(!isStreamEnabled)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isStreamEnabled 
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' 
                    : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
                title={isStreamEnabled ? "Disable Streaming" : "Enable Streaming"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isStreamEnabled ? "text-green-500" : ""}>
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                Stream: {isStreamEnabled ? 'On' : 'Off'}
              </button>
            )}
          </div>
          {selectedImage && (
            <div className="mb-2 relative inline-block">
              <img 
                src={selectedImage} 
                alt="Selected" 
                className="h-20 w-20 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800" 
              />
              <button
                onClick={removeSelectedImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          )}
          {selectedFile && (
            <div className="mb-2 relative inline-block">
              <div className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-xl">📄</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate max-w-[150px]">{selectedFile.name}</span>
                  <span className="text-[10px] text-zinc-500">Ready to send</span>
                </div>
                <button
                  onClick={removeSelectedFile}
                  className="ml-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {isUploadingFile && (
            <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500">
              <svg className="animate-spin h-4 w-4 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="animate-pulse">Uploading file...</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
            {(supportsImages || supportsFiles) && (
              <div className="relative" ref={uploadMenuRef}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={genericFileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (supportsImages && !supportsFiles) {
                      fileInputRef.current?.click();
                    } else if (!supportsImages && supportsFiles) {
                      genericFileInputRef.current?.click();
                    } else {
                      setShowUploadMenu(!showUploadMenu);
                    }
                  }}
                  className={`p-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors ${showUploadMenu ? 'text-zinc-900 dark:text-zinc-100' : ''}`}
                  title="Upload"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>

                {showUploadMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {supportsImages && (
                      <button
                        type="button"
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowUploadMenu(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        Upload Image
                      </button>
                    )}
                    {supportsFiles && (
                      <button
                        type="button"
                        onClick={() => {
                          genericFileInputRef.current?.click();
                          setShowUploadMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 p-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${supportsImages ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>
                        Upload File
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  supportsImages && supportsFiles 
                    ? "Send a message or upload..." 
                    : supportsImages 
                      ? "Send a message or upload image..." 
                      : supportsFiles 
                        ? "Send a message or upload file..." 
                        : "Send a message..."
                }
                className="w-full p-4 pr-16 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-500 bg-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || isUploadingFile || (!input.trim() && !selectedImage && !selectedFile)}
                className="absolute right-2 top-2 bottom-2 px-4 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
