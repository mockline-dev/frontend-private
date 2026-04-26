'use client';

import { ChatComposer } from '@/components/custom/ChatComposer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAIAgent } from '@/hooks/useAIAgent';
import { CheckCircle2, Loader2, Wrench } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { MessageBubble } from './components/MessageBubble';
import { QuickActions } from './components/QuickActions';
import { SystemMessageBanner } from './components/SystemMessageBanner';
import { TypingBubble } from './components/TypingBubble';

interface AIAgentProps {
    projectId?: string;
    onFilesChanged?: () => void;
}

const suggestedPrompts = [
    'Help me add JWT authentication',
    'Optimize my database queries',
    'Add rate limiting to endpoints',
    'Review my API structure',
    'Add Docker configuration',
];

export function AiAgent({ projectId, onFilesChanged }: AIAgentProps) {
    const { messages, hasOlderMessages, isLoadingOlderMessages, input, setInput, isLoading, isStreaming, pipelineStage, pipelineProgress, retryingMessageId, handleSubmit, retryMessage, loadOlderMessages, stopStream, isRepairing, repairAttemptLabel } =
        useAIAgent({ ...(projectId ? { projectId } : {}), ...(onFilesChanged ? { onFilesChanged } : {}) });

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [expandedFilesId, setExpandedFilesId] = useState<string | null>(null);
    const isMobile = useIsMobile();

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNearBottom || isStreaming) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, isStreaming, messages[messages.length - 1]?.content]);

    const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMessagesScroll = () => {
        const container = messagesContainerRef.current;
        if (!container || !hasOlderMessages || isLoadingOlderMessages) return;

        if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
        scrollDebounceRef.current = setTimeout(async () => {
            if (!container || container.scrollTop > 80 || !hasOlderMessages || isLoadingOlderMessages) return;
            const previousHeight = container.scrollHeight;
            const previousTop = container.scrollTop;
            await loadOlderMessages();
            requestAnimationFrame(() => {
                const nextHeight = container.scrollHeight;
                container.scrollTop = nextHeight - previousHeight + previousTop;
            });
        }, 150);
    };

    const copyMessage = async (messageId: string, content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedMessageId(messageId);
            toast.success('Message copied');
            window.setTimeout(() => setCopiedMessageId((prev) => (prev === messageId ? null : prev)), 1200);
        } catch {
            toast.error('Failed to copy message');
        }
    };

    const showTypingIndicator = isLoading || isStreaming;

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void handleSubmit();
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-linear-to-b from-white to-gray-50"
                role="log"
                aria-live="polite"
                aria-relevant="additions text"
                aria-label="AI assistant conversation"
            >
                {isLoadingOlderMessages && (
                    <div className="flex items-center justify-center py-2" role="status">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-xs text-gray-500 ml-2">Loading older messages...</span>
                    </div>
                )}

                {!isLoadingOlderMessages && hasOlderMessages && (
                    <div className="flex items-center justify-center py-1">
                        <span className="text-[10px] text-gray-400">Scroll up to load older messages</span>
                    </div>
                )}

                {messages.map((message) => {
                    if (message.role === 'assistant' && !message.content?.trim() && message.metadata?.type !== 'repair-assistant') return null;

                    if (message.role === 'system') {
                        return <SystemMessageBanner key={message._id} message={message} />;
                    }

                    return (
                        <MessageBubble
                            key={message._id}
                            message={message}
                            isMobile={isMobile}
                            copiedMessageId={copiedMessageId}
                            expandedFilesId={expandedFilesId}
                            retryingMessageId={retryingMessageId}
                            isLoading={isLoading}
                            isStreaming={isStreaming}
                            onCopy={copyMessage}
                            onRetry={retryMessage}
                            onToggleFiles={(id) => setExpandedFilesId(expandedFilesId === id ? null : id)}
                        />
                    );
                })}

                {isRepairing && (
                    <div className="flex items-center gap-2 px-3 py-1.5 mx-2 rounded-lg border bg-amber-50 border-amber-200 text-amber-700 text-[11px] font-medium" role="status">
                        <Wrench className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                        <span>Auto-repairing server{repairAttemptLabel ? ` (attempt ${repairAttemptLabel})` : ''}…</span>
                    </div>
                )}

                {showTypingIndicator && <TypingBubble pipelineStage={pipelineStage} pipelineProgress={pipelineProgress} />}

                {pipelineStage === 'Files saved' && !isStreaming && !isLoading && (
                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2" role="status">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Files updated — file tree refreshed</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && (
                <QuickActions prompts={suggestedPrompts} onSelect={setInput} />
            )}

            <ChatComposer value={input} onChange={setInput} onSubmit={handleFormSubmit} isLoading={isLoading} isStreaming={isStreaming} onStopGenerating={stopStream} placeholder="Ask Mocky..." />
        </div>
    );
}
