'use client';

import { ChatComposer } from '@/components/custom/ChatComposer';
import { MarkdownMessage } from '@/components/custom/MarkdownMessage';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAIAgent } from '@/hooks/useAIAgent';
import { CheckCircle2, ChevronDown, ChevronUp, Copy, FileCode, Loader2, RefreshCcw, Sparkles, Wrench, XCircle, Zap, AlertTriangle, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

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

    // Auto-scroll to bottom when new messages arrive or streaming
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

    const formatTime = (value?: number) => {
        if (!value) return '';
        return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                    // Skip empty assistant messages (e.g. from auto-repair that have no content)
                    if (message.role === 'assistant' && !message.content?.trim()) return null;

                    // ── System message — full-width status banner ────────────────
                    if (message.role === 'system') {
                        // these are internal bookkeeping entries that shouldn't appear in the chat.
                        if (!message.content?.trim() && !message.metadata?.type) return null;

                        const mtype = message.metadata?.type as string | undefined;
                        const isRepairStart    = mtype === 'repair-start';
                        const isRepairProgress = mtype === 'repair-progress';
                        const isRepairSuccess  = mtype === 'repair-success';
                        const isRepairError    = mtype === 'repair-error';
                        const isRepair = isRepairStart || isRepairProgress || isRepairSuccess || isRepairError;

                        if (isRepair) {
                            const attempt = message.metadata?.repairAttempt as number | undefined;
                            const maxAttempts = message.metadata?.repairMaxAttempts as number | undefined;
                            const attemptLabel = attempt && maxAttempts ? ` ${attempt}/${maxAttempts}` : attempt ? ` ${attempt}` : '';

                            const cfg = isRepairSuccess
                                ? { bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: <CheckCheck className="w-3.5 h-3.5 shrink-0" /> }
                                : isRepairError
                                ? { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: <XCircle className="w-3.5 h-3.5 shrink-0" /> }
                                : { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: <Wrench className="w-3.5 h-3.5 shrink-0 animate-pulse" /> };

                            return (
                                <div key={message._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-medium ml-2 mr-2 ${cfg.bg} ${cfg.text}`}>
                                    {cfg.icon}
                                    <span>
                                        {isRepairStart && `Auto-repair started${attemptLabel}`}
                                        {isRepairProgress && `Repairing${attemptLabel}… ${message.metadata?.phase ?? ''}`}
                                        {isRepairSuccess && `Repaired successfully${message.metadata?.fixAttempts ? ` (${message.metadata.fixAttempts} attempt${(message.metadata.fixAttempts as number) > 1 ? 's' : ''})` : ''}`}
                                        {isRepairError && `Auto-repair failed — ${message.content}`}
                                        {!isRepairStart && !isRepairProgress && !isRepairSuccess && !isRepairError && message.content}
                                    </span>
                                </div>
                            );
                        }

                        // Generic system message — gray italic centered
                        return (
                            <div key={message._id} className="text-center text-[10px] text-gray-400 italic py-1 px-4">
                                {message.content}
                            </div>
                        );
                    }

                    // ── User / assistant bubble ──────────────────────────────────
                    return (
                        <div
                        key={message._id}
                        className={`group flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        aria-label={message.role === 'user' ? 'User message' : 'Assistant message'}
                    >
                        {message.role === 'assistant' && (
                            <div className="w-7 h-7 bg-linear-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                        )}
                        <div
                            className={`max-w-[88%] rounded-2xl px-3 py-2.5 border ${
                                message.role === 'user' ? 'bg-black text-white border-black' : 'bg-white text-gray-900 border-gray-200 shadow-xs'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className={`text-[10px] uppercase tracking-wide ${message.role === 'user' ? 'text-gray-300' : 'text-gray-500'}`}>
                                    {message.role === 'user' ? 'You' : 'Mocky'}
                                </span>
                                <span className={`text-[10px] ${message.role === 'user' ? 'text-gray-300' : 'text-gray-500'}`}>{formatTime(message.createdAt)}</span>
                            </div>
                            {message.role === 'assistant' ? (
                                <>
                                    <MarkdownMessage content={message.content} />

                                    {/* Auto-fixed badge */}
                                    {message.metadata?.autoFixed && (
                                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 w-fit">
                                            <Wrench className="w-3 h-3" />
                                            <span>Auto-fixed{message.metadata.fixAttempts ? ` (${message.metadata.fixAttempts} attempt${message.metadata.fixAttempts > 1 ? 's' : ''})` : ''}</span>
                                        </div>
                                    )}

                                    {/* Sandbox result */}
                                    {message.metadata?.sandboxResult && (
                                        <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] rounded-lg px-2 py-1 w-fit border ${
                                            message.metadata.sandboxResult.success
                                                ? 'text-green-700 bg-green-50 border-green-200'
                                                : 'text-red-700 bg-red-50 border-red-200'
                                        }`}>
                                            {message.metadata.sandboxResult.success
                                                ? <CheckCircle2 className="w-3 h-3" />
                                                : <XCircle className="w-3 h-3" />
                                            }
                                            <span>
                                                {message.metadata.sandboxResult.success ? 'Validated' : 'Validation failed'}
                                                {message.metadata.sandboxResult.durationMs > 0 && ` · ${(message.metadata.sandboxResult.durationMs / 1000).toFixed(1)}s`}
                                            </span>
                                        </div>
                                    )}

                                    {/* Generated files list (collapsible) */}
                                    {message.metadata?.filesGenerated && message.metadata.filesGenerated.length > 0 && (
                                        <div className="mt-1.5">
                                            <button
                                                onClick={() => setExpandedFilesId(expandedFilesId === message._id ? null : message._id)}
                                                className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-700 transition-colors"
                                                aria-expanded={expandedFilesId === message._id}
                                            >
                                                <FileCode className="w-3 h-3" />
                                                <span>{message.metadata.filesGenerated.length} file{message.metadata.filesGenerated.length !== 1 ? 's' : ''} generated</span>
                                                {expandedFilesId === message._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </button>
                                            {expandedFilesId === message._id && (
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {message.metadata.filesGenerated.map((f) => (
                                                        <span key={f} className="text-[9px] font-mono bg-gray-100 text-gray-600 border border-gray-200 rounded px-1.5 py-0.5">
                                                            {f}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Token usage */}
                                    {message.metadata?.usage?.totalTokens && message.metadata.usage.totalTokens > 0 && (
                                        <p className="mt-1.5 text-[9px] text-gray-400">
                                            {message.metadata.usage.promptTokens?.toLocaleString()} in · {message.metadata.usage.completionTokens?.toLocaleString()} out · {message.metadata.usage.totalTokens?.toLocaleString()} total tokens
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className={`${isMobile ? 'text-[13px]' : 'text-sm'} leading-relaxed whitespace-pre-wrap`}>{message.content}</p>
                            )}

                            <div className="mt-2 flex items-center justify-end gap-1.5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className={`h-8 px-2 text-[11px] ${message.role === 'user' ? 'text-gray-200 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                                    onClick={() => copyMessage(message._id, message.content)}
                                    aria-label={`Copy ${message.role} message`}
                                >
                                    <Copy className="w-3 h-3 mr-1" />
                                    {copiedMessageId === message._id ? 'Copied' : 'Copy'}
                                </Button>

                                {message.role === 'user' && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-[11px] text-gray-200 hover:text-white hover:bg-white/10"
                                        onClick={() => retryMessage(message._id)}
                                        disabled={retryingMessageId === message._id || isLoading || isStreaming}
                                        aria-label="Retry from this message"
                                    >
                                        {retryingMessageId === message._id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCcw className="w-3 h-3 mr-1" />}
                                        Retry
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                );
                })}

                {isRepairing && (
                    <div className="flex items-center gap-2 px-3 py-1.5 mx-2 rounded-lg border bg-amber-50 border-amber-200 text-amber-700 text-[11px] font-medium" role="status">
                        <Wrench className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                        <span>Auto-repairing server{repairAttemptLabel ? ` (attempt ${repairAttemptLabel})` : ''}…</span>
                    </div>
                )}

                {showTypingIndicator && (
                    <div className="flex gap-2" role="status" aria-live="polite" aria-label="Assistant is composing a response">
                        <div className="w-7 h-7 bg-linear-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-xs min-w-[160px]">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.2s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.1s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" />
                                {pipelineStage && <span className="text-xs text-gray-600 ml-1">{pipelineStage}</span>}
                            </div>
                            {pipelineProgress > 0 && (
                                <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                                    <div
                                        className="bg-violet-500 h-1 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${pipelineProgress}%` }}
                                        role="progressbar"
                                        aria-valuenow={pipelineProgress}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {pipelineStage === 'Files saved' && !isStreaming && !isLoading && (
                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2" role="status">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Files updated — file tree refreshed</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && (
                <div className="px-3 pb-3 border-t pt-3 border-gray-200 bg-white">
                    <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wide font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Quick actions
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {suggestedPrompts.map((prompt, index) => (
                            <button
                                key={index}
                                onClick={() => setInput(prompt)}
                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg border border-gray-200 transition-colors text-left"
                                aria-label={`Use quick action: ${prompt}`}
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <ChatComposer value={input} onChange={setInput} onSubmit={handleFormSubmit} isLoading={isLoading} isStreaming={isStreaming} onStopGenerating={stopStream} placeholder="Ask Mocky..." />
        </div>
    );
}
