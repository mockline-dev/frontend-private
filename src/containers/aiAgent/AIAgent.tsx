'use client'

import { Button } from '@/components/ui/button';
import { defaultAiModel, getApiUrl } from '@/config/environment';
import { FileUpdate, FileUpdatePreview } from '@/containers/workspace/components/FileUpdatePreview';
import { filesService, type File as FileType } from '@/services/api/files';
import { Message, messagesService } from '@/services/api/messages';
import feathersClient from '@/services/featherClient';
import { PromptValidationResult, validatePrompt } from '@/utils/promptValidation';
import { Loader2, Send } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface AIAgentProps {
  projectId?: string;
  files?: FileType[];
  selectedFile?: string;
  selectedFileContent?: string;
}

interface StreamMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const suggestedPrompts = [
  "Help me add JWT authentication",
  "Optimize my database queries",
  "Add rate limiting to endpoints",
  "Review my API structure",
  "Add Docker configuration"
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function AiAgent({ projectId, files = [], selectedFile, selectedFileContent }: AIAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [fileUpdates, setFileUpdates] = useState<FileUpdate[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, fileUpdates]);

  // Parse FILE_UPDATE blocks from AI response
  const parseFileUpdates = useCallback((content: string): FileUpdate[] => {
    const updates: FileUpdate[] = [];
    const updatePattern = /FILE_UPDATE:\s*\n([\s\S]*?)(?=FILE_UPDATE:|$)/g;
    
    let match;
    while ((match = updatePattern.exec(content)) !== null) {
      if (!match[1]) continue;
      
      const updateText = match[1].trim();
      const lines = updateText.split('\n');
      
      let filename = '';
      let action: 'create' | 'modify' | 'delete' = 'modify';
      let description = '';
      let content = '';
      let language = 'plaintext';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        
        if (line.startsWith('filename:')) {
          filename = line.replace('filename:', '').trim();
          // Detect language from extension
          const ext = filename.split('.').pop()?.toLowerCase();
          if (ext === 'js' || ext === 'jsx' || ext === 'ts' || ext === 'tsx') {
            language = 'javascript';
          } else if (ext === 'py') {
            language = 'python';
          } else if (ext === 'json') {
            language = 'json';
          } else if (ext === 'md') {
            language = 'markdown';
          } else if (ext === 'css') {
            language = 'css';
          } else if (ext === 'html') {
            language = 'html';
          }
        } else if (line.startsWith('action:')) {
          const actionText = line.replace('action:', '').trim().toLowerCase();
          if (actionText === 'create' || actionText === 'modify' || actionText === 'delete') {
            action = actionText;
          }
        } else if (line.startsWith('description:')) {
          description = line.replace('description:', '').trim();
        } else if (line === '---' || line === '```') {
          // Start of content block
          content = lines.slice(i + 1).join('\n');
          break;
        }
      }
      
      if (filename && (action === 'delete' || content)) {
        updates.push({ filename, action, description, content, language });
      }
    }
    
    return updates;
  }, []);

  // Handle accepting a file update
  const handleAcceptUpdate = useCallback(async (update: FileUpdate) => {
    if (!projectId) return;

    try {
      if (update.action === 'delete') {
        // Find the file and delete it
        const file = files.find(f => f.name === update.filename);
        if (file) {
          await filesService.remove(file._id);
          toast.success(`Deleted: ${update.filename}`);
        }
      } else {
        // Upload the new/updated file content
        const key = `${projectId}/${update.filename}`;
        
        // Validate file size before upload
        const contentSize = new TextEncoder().encode(update.content).length;
        if (contentSize > MAX_FILE_SIZE) {
          toast.error(`File size exceeds 10MB limit. Current size: ${(contentSize / (1024 * 1024)).toFixed(2)}MB`);
          return;
        }
        
        await feathersClient.service('uploads').create({
          key,
          content: update.content,
          contentType: 'text/plain',
          projectId
        });

        // Find existing file or create new metadata
        const existingFile = files.find(f => f.name === update.filename);
        
        if (existingFile) {
          // Update existing file
          await filesService.patch(existingFile._id, {
            size: new TextEncoder().encode(update.content).length,
            currentVersion: (existingFile.currentVersion || 1) + 1
          });
          toast.success(`Updated: ${update.filename} (v${(existingFile.currentVersion || 1) + 1})`);
        } else {
          // Create new file metadata
          await filesService.create({
            projectId,
            name: update.filename,
            key,
            fileType: update.filename.split('.').pop() || 'text',
            size: new TextEncoder().encode(update.content).length,
            currentVersion: 1
          });
          toast.success(`Created: ${update.filename}`);
        }
      }

      // Remove the update from the list
      setFileUpdates(prev => prev.filter(u => u.filename !== update.filename));
    } catch (error) {
      console.error('Failed to accept file update:', error);
      toast.error('Failed to update file');
    }
  }, [projectId, files]);

  // Handle rejecting a file update
  const handleRejectUpdate = useCallback((update: FileUpdate) => {
    // Remove the update from the list
    setFileUpdates(prev => prev.filter(u => u.filename !== update.filename));
    
    // Optional: Send feedback to conversation
    // This could be added as a system message or user message
  }, []);

  // Handle accepting all file updates
  const handleAcceptAllUpdates = useCallback(async () => {
    const results = await Promise.allSettled(
      fileUpdates.map(update => handleAcceptUpdate(update))
    );
    
    const failedUpdates = results.filter(result => result.status === 'rejected');
    if (failedUpdates.length > 0) {
      toast.error(`${failedUpdates.length} update(s) failed. Please try again.`);
    }
  }, [fileUpdates, handleAcceptUpdate]);

  // Load messages for the project on mount
  useEffect(() => {
    const loadMessages = async () => {
      if (!projectId) return;
      try {
        const result = await messagesService.find({ projectId });
        setMessages(result.data);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, [projectId]);

  // Listen for real-time message updates
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = messagesService.onCreated((message) => {
      if (message.projectId === projectId) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [projectId]);

  // Validate prompt with AI service
  const validatePromptWithAI = async (prompt: string): Promise<PromptValidationResult> => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(getApiUrl('/api/validate-prompt'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Validation attempt ${attempt} failed:`, error);

        // If it's the last attempt, fall back to client-side validation
        if (attempt === maxRetries) {
          console.warn('All validation attempts failed, falling back to client-side validation');
          return validatePrompt(prompt);
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but TypeScript needs it
    return validatePrompt(prompt);
  };

  // Stream AI response
  const streamAIResponse = async (messages: StreamMessage[], currentProjectId: string) => {
    let aiMessage: Message | null = null;

    try {
      setIsStreaming(true);

      // Build project context
      const projectContext = {
        files: files.map(f => f.name),
        selectedFile: selectedFile || null,
        selectedFileContent: selectedFileContent || null
      };

      const response = await fetch(getApiUrl('/api/stream'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model: defaultAiModel,
          context: projectContext
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to stream response: ${response.status} ${errorText}`);
      }

      // Create initial AI message
      aiMessage = await messagesService.create({
        projectId: currentProjectId,
        role: 'assistant',
        content: ''
      });

      let fullContent = '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                if (data.message?.content) {
                  fullContent += data.message.content;

                  // Update message in real-time
                  await messagesService.patch(aiMessage._id, {
                    content: fullContent
                  });

                  // Parse file updates from the streaming content
                  const updates = parseFileUpdates(fullContent);
                  if (updates.length > 0) {
                    setFileUpdates(updates);
                  }
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming AI response:', error);

      // Update the AI message with error information if it was created
      if (aiMessage) {
        try {
          await messagesService.patch(aiMessage._id, {
            content: `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
          });
        } catch (patchError) {
          console.error('Failed to update error message:', patchError);
        }
      }

      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response';
      toast.error(errorMessage, {
        description: 'Please check your connection and try again.'
      });

      throw error;
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isStreaming || !projectId) return;

    const messageContent = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Create user message
      const userMessage = await messagesService.create({
        projectId,
        role: 'user',
        content: messageContent
      });

      // Add user message to local state (real-time listener will also add it, but this is for immediate UI update)
      setMessages(prev => {
        if (prev.find(m => m._id === userMessage._id)) return prev;
        return [...prev, userMessage];
      });

      // Validate prompt first
      const validation = await validatePromptWithAI(messageContent);

      if (!validation.isValid) {
        // Handle invalid prompts with follow-up questions
        const followUpMessage = validation.suggestedQuestions
          ? validation.suggestedQuestions.join('\n\n')
          : "I couldn't understand your request. Could you provide more details about what you want to build?";

        await messagesService.create({
          projectId,
          role: 'assistant',
          content: followUpMessage
        });

        setIsLoading(false);
        return;
      }

      // For valid prompts, stream AI response
      const conversationMessages: StreamMessage[] = [
        {
          role: 'system',
          content: 'You are an expert backend developer assistant. Help users build and improve their backend applications with detailed, practical advice.'
        },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: messageContent
        }
      ];

      await streamAIResponse(conversationMessages, projectId);

    } catch (error) {
      console.error('Failed to send message:', error);

      // Show detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response';
      toast.error('Failed to send message', {
        description: errorMessage,
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };


  return (
    <div className="h-full flex flex-col bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex gap-2 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-md flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">M</span>
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-xs leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}
        {(isLoading || isStreaming) && (
          <div className="flex gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-gray-600 animate-spin" />
                <span className="text-xs text-gray-600">
                  {isStreaming ? 'Mocky is thinking...' : 'Processing...'}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Updates Preview */}
      {fileUpdates.length > 0 && (
        <FileUpdatePreview
          updates={fileUpdates}
          currentFiles={new Map(files.map(f => [f.name, '']))}
          onAccept={handleAcceptUpdate}
          onReject={handleRejectUpdate}
          onAcceptAll={handleAcceptAllUpdates}
        />
      )}

      {/* Suggested Prompts */}
      {messages.length <= 1 && (
        <div className="px-3 pb-2 border-t pt-2 border-gray-200">
          <p className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wide font-medium">Quick Actions</p>
          <div className="flex flex-col gap-1.5">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedPrompt(prompt)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded border border-gray-200 transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-2.5">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Mocky..."
            className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            disabled={isLoading || isStreaming}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading || isStreaming}
            size="icon"
            className="bg-black hover:bg-gray-800 text-white h-7 w-7"
          >
            {(isLoading || isStreaming) ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
