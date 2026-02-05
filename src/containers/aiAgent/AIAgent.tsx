'use client'

import { Button } from '@/components/ui/button';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { conversationsService, messagesService, Message, Conversation } from '@/services/api/conversations';
import { toast } from 'sonner';
import { validatePrompt, PromptValidationResult } from '@/utils/promptValidation';
import { getApiUrl, defaultAiModel } from '@/config/environment';

interface AIAgentProps {
  projectId?: string;
}

const suggestedPrompts = [
  "Add authentication middleware",
  "Create a new API endpoint",
  "Add database connection",
  "Implement error handling",
  "Add input validation"
];

export function AiAgent({ projectId }: AIAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation
  useEffect(() => {
    const initializeConversation = async () => {
      try {
        setIsInitializing(true);
        
        // Create a new conversation
        const newConversation = await conversationsService.create({
          title: 'AI Assistant Chat',
          aiModelId: defaultAiModel,
          projectId
        });
        
        setConversation(newConversation);
        
        // Add welcome message
        const welcomeMessage = await messagesService.create({
          conversationId: newConversation._id,
          role: 'assistant',
          content: "Hi! I can help you build and improve your backend. What would you like to create?"
        });
        
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
        toast.error('Failed to initialize AI chat');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeConversation();
  }, [projectId]);

  // Listen for real-time message updates
  useEffect(() => {
    if (!conversation) return;

    const unsubscribe = messagesService.onCreated((message) => {
      if (message.conversationId === conversation._id) {
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
  }, [conversation]);

  // Validate prompt with AI service
  const validatePromptWithAI = async (prompt: string): Promise<PromptValidationResult> => {
    try {
      const response = await fetch(getApiUrl('/api/validate-prompt'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate prompt');
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating prompt:', error);
      // Fallback to client-side validation
      return validatePrompt(prompt);
    }
  };

  // Stream AI response
  const streamAIResponse = async (messages: any[], conversationId: string) => {
    try {
      setIsStreaming(true);
      
      const response = await fetch(getApiUrl('/api/stream'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model: defaultAiModel
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to stream response');
      }

      // Create initial AI message
      const aiMessage = await messagesService.create({
        conversationId,
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
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming AI response:', error);
      throw error;
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isStreaming || !conversation) return;

    const messageContent = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Create user message
      const userMessage = await messagesService.create({
        conversationId: conversation._id,
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

        const aiMessage = await messagesService.create({
          conversationId: conversation._id,
          role: 'assistant',
          content: followUpMessage
        });
        
        setIsLoading(false);
        return;
      }

      // For valid prompts, stream AI response
      const conversationMessages = [
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

      await streamAIResponse(conversationMessages, conversation._id);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  if (isInitializing) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-600" />
          <p className="text-sm text-gray-600">Initializing AI chat...</p>
        </div>
      </div>
    );
  }

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
              <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 text-white" />
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
            <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-gray-600 animate-spin" />
                <span className="text-xs text-gray-600">
                  {isStreaming ? 'Generating response...' : 'Processing...'}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

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
            placeholder="Ask me anything..."
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
