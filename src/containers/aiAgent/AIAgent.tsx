'use client';

import { fetchFileContent } from '@/api/files/fetchFileContent';
import { Button } from '@/components/ui/button';
import { FileUpdatePreview } from '@/containers/workspace/components/FileUpdatePreview';
import { useAIAgent } from '@/hooks/useAIAgent';
import { type File as FileType } from '@/services/api/files';
import { Loader2, Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface AIAgentProps {
    projectId?: string;
    files?: FileType[];
    selectedFile?: string;
    selectedFileContent?: string;
    onFileApplied?: (event: { action: 'create' | 'modify' | 'delete'; filename: string; content?: string }) => void;
}

const suggestedPrompts = [
    'Help me add JWT authentication',
    'Optimize my database queries',
    'Add rate limiting to endpoints',
    'Review my API structure',
    'Add Docker configuration'
];

export function AiAgent({ projectId, files = [], selectedFile, selectedFileContent, onFileApplied }: AIAgentProps) {
    const {
        messages,
        hasOlderMessages,
        isLoadingOlderMessages,
        input,
        setInput,
        isLoading,
        isStreaming,
        isApplyingUpdates,
        applyingUpdateKeys,
        fileUpdates,
        handleSubmit,
        loadOlderMessages,
        handleAcceptUpdate,
        handleRejectUpdate,
        handleAcceptAllUpdates
    } = useAIAgent(projectId, files, selectedFile, selectedFileContent, onFileApplied);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const previousMessageCountRef = useRef(0);
    const [currentFileContents, setCurrentFileContents] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const wasNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
        const messageCountIncreased = messages.length > previousMessageCountRef.current;

        if ((messageCountIncreased && wasNearBottom) || isStreaming) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }

        previousMessageCountRef.current = messages.length;
    }, [messages, fileUpdates, isStreaming]);

    const handleMessagesScroll = async () => {
        const container = messagesContainerRef.current;
        if (!container) return;

        if (container.scrollTop > 30 || !hasOlderMessages || isLoadingOlderMessages) return;

        const previousHeight = container.scrollHeight;
        const previousTop = container.scrollTop;

        await loadOlderMessages();

        requestAnimationFrame(() => {
            const nextHeight = container.scrollHeight;
            container.scrollTop = nextHeight - previousHeight + previousTop;
        });
    };

    useEffect(() => {
        let isCancelled = false;

        const loadCurrentContents = async () => {
            const next = new Map<string, string>();

            if (selectedFile && selectedFileContent !== undefined) {
                next.set(selectedFile, selectedFileContent);
            }

            const candidates = fileUpdates.filter((update) => update.action !== 'create');

            await Promise.all(
                candidates.map(async (update) => {
                    const matched = files.find((file) => file.name === update.filename);
                    if (!matched) {
                        return;
                    }

                    try {
                        const result = await fetchFileContent({ fileId: matched._id });
                        if (result.success) {
                            next.set(update.filename, result.content);
                        }
                    } catch {
                        // Preview should still render even if content fetch fails.
                    }
                })
            );

            if (!isCancelled) {
                setCurrentFileContents(next);
            }
        };

        loadCurrentContents();

        return () => {
            isCancelled = true;
        };
    }, [fileUpdates, files, selectedFile, selectedFileContent]);

    const previewContents = useMemo(() => currentFileContents, [currentFileContents]);

    const showTypingIndicator = isLoading || isStreaming;

    return (
        <div className="h-full flex flex-col bg-white">
            <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
                {isLoadingOlderMessages && (
                    <div className="flex items-center justify-center py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-xs text-gray-500 ml-2">Loading older messages...</span>
                    </div>
                )}

                {!isLoadingOlderMessages && hasOlderMessages && (
                    <div className="flex items-center justify-center py-1">
                        <span className="text-[10px] text-gray-400">Scroll up to load older messages</span>
                    </div>
                )}

                {messages.map((message) => (
                    <div key={message._id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.role === 'assistant' && (
                            <div className="w-6 h-6 bg-linear-to-br from-violet-500 to-purple-600 rounded-md flex items-center justify-center shrink-0">
                                <span className="text-white text-xs font-bold">M</span>
                            </div>
                        )}
                        <div className={`max-w-[85%] rounded-lg px-3 py-2 ${message.role === 'user' ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'}`}>
                            <p className="text-xs leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        </div>
                    </div>
                ))}

                {showTypingIndicator && (
                    <div className="flex gap-2">
                        <div className="w-6 h-6 bg-linear-to-br from-violet-500 to-purple-600 rounded-md flex items-center justify-center">
                            <span className="text-white text-xs font-bold">M</span>
                        </div>
                        <div className="bg-gray-100 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.2s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.1s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" />
                                <span className="text-xs text-gray-600 ml-1">Mocky is typing...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {fileUpdates.length > 0 && (
                <FileUpdatePreview
                    updates={fileUpdates}
                    currentFiles={previewContents}
                    applyingUpdateKeys={applyingUpdateKeys}
                    isApplying={isApplyingUpdates}
                    onAccept={handleAcceptUpdate}
                    onReject={handleRejectUpdate}
                    onAcceptAll={handleAcceptAllUpdates}
                />
            )}

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
