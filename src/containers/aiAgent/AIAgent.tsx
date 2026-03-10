'use client';

import { Button } from '@/components/ui/button';
import { FileUpdatePreview } from '@/containers/workspace/components/FileUpdatePreview';
import { useAIAgent } from '@/hooks/useAIAgent';
import { type File as FileType } from '@/services/api/files';
import { Loader2, Send } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface AIAgentProps {
    projectId?: string;
    files?: FileType[];
    selectedFile?: string;
    selectedFileContent?: string;
}

const suggestedPrompts = [
    'Help me add JWT authentication',
    'Optimize my database queries',
    'Add rate limiting to endpoints',
    'Review my API structure',
    'Add Docker configuration'
];

export function AiAgent({ projectId, files = [], selectedFile, selectedFileContent }: AIAgentProps) {
    const { messages, input, setInput, isLoading, isStreaming, fileUpdates, handleSubmit, handleAcceptUpdate, handleRejectUpdate, handleAcceptAllUpdates } = useAIAgent(
        projectId,
        files,
        selectedFile,
        selectedFileContent
    );

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, fileUpdates]);

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
                {messages.map((message) => (
                    <div key={message._id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.role === 'assistant' && (
                            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-md flex items-center justify-center shrink-0">
                                <span className="text-white text-xs font-bold">M</span>
                            </div>
                        )}
                        <div className={`max-w-[85%] rounded-lg px-3 py-2 ${message.role === 'user' ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'}`}>
                            <p className="text-xs leading-relaxed whitespace-pre-wrap">{message.content}</p>
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
                                <span className="text-xs text-gray-600">{isStreaming ? 'Mocky is thinking...' : 'Processing...'}</span>
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
                    currentFiles={new Map(files.map((f) => [f.name, '']))}
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
                                onClick={() => setInput(prompt)}
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
                    <Button type="submit" disabled={!input.trim() || isLoading || isStreaming} size="icon" className="bg-black hover:bg-gray-800 text-white h-7 w-7">
                        {isLoading || isStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </Button>
                </div>
            </form>
        </div>
    );
}
