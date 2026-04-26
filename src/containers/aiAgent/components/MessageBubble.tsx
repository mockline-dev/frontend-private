'use client';

import { MarkdownMessage } from '@/components/custom/MarkdownMessage';
import { Button } from '@/components/ui/button';
import type { Message } from '@/types/feathers';
import { CheckCircle2, ChevronDown, ChevronUp, Copy, FileCode, Loader2, RefreshCcw, Sparkles, Wrench, XCircle } from 'lucide-react';

function FileChangeRow({ path, type }: { path: string; type: 'modified' | 'created' }) {
    const parts = path.split('/');
    const basename = parts[parts.length - 1] ?? path;
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';

    return (
        <div className="flex items-center gap-2 py-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${type === 'created' ? 'bg-green-500' : 'bg-orange-400'}`} />
            <span className="font-mono text-[11px] flex-1 truncate">
                <span className="text-muted-foreground/60">{dir}</span>
                <span className="font-semibold">{basename}</span>
            </span>
            <span className={`text-[10px] font-medium shrink-0 ${type === 'created' ? 'text-green-600' : 'text-orange-500'}`}>{type}</span>
        </div>
    );
}

function formatTime(value?: number): string {
    if (!value) return '';
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface MessageBubbleProps {
    message: Message;
    isMobile: boolean;
    copiedMessageId: string | null;
    expandedFilesId: string | null;
    retryingMessageId: string | null;
    isLoading: boolean;
    isStreaming: boolean;
    onCopy: (messageId: string, content: string) => void;
    onRetry: (messageId: string) => void;
    onToggleFiles: (messageId: string) => void;
}

export function MessageBubble({ message, isMobile, copiedMessageId, expandedFilesId, retryingMessageId, isLoading, isStreaming, onCopy, onRetry, onToggleFiles }: MessageBubbleProps) {
    return (
        <div
            className={`group flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            aria-label={message.role === 'user' ? 'User message' : 'Assistant message'}
        >
            {message.role === 'assistant' && (
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0 shadow-sm">
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

                        {message.metadata?.autoFixed && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 w-fit">
                                <Wrench className="w-3 h-3" />
                                <span>Auto-fixed{message.metadata.fixAttempts ? ` (${message.metadata.fixAttempts} attempt${message.metadata.fixAttempts > 1 ? 's' : ''})` : ''}</span>
                            </div>
                        )}

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

                        {message.metadata?.filesGenerated && message.metadata.filesGenerated.length > 0 && (
                            <div className="mt-1.5">
                                <button
                                    onClick={() => onToggleFiles(message._id)}
                                    className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-700 transition-colors"
                                    aria-expanded={expandedFilesId === message._id}
                                >
                                    <FileCode className="w-3 h-3" />
                                    <span>
                                        {message.metadata.filesGenerated.length} file{message.metadata.filesGenerated.length !== 1 ? 's' : ''} generated
                                    </span>
                                    {expandedFilesId === message._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                                {expandedFilesId === message._id && (
                                    <div className="mt-1 border border-gray-100 rounded-lg px-2 py-1 divide-y divide-gray-100">
                                        {(message.metadata.filesGenerated as string[]).map((f) => (
                                            <FileChangeRow key={f} path={f} type="created" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

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
                        onClick={() => onCopy(message._id, message.content)}
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
                            onClick={() => onRetry(message._id)}
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
}
