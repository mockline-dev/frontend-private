'use client';

import { MarkdownMessage } from './MarkdownMessage';
import { Button } from '@/components/ui/button';
import type { Message } from '@/types/feathers';
import { CheckCircle2, ChevronDown, ChevronUp, Copy, FileCode, Loader2, RefreshCcw, Wrench, XCircle } from 'lucide-react';
import Image from 'next/image';
import { FileDiff } from './FileDiff';

function FileChangeRow({ path, type }: { path: string; type: 'modified' | 'created' }) {
    const parts = path.split('/');
    const basename = parts[parts.length - 1] ?? path;
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';

    return (
        <div className="flex items-center gap-2 py-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${type === 'created' ? 'bg-green-500' : 'bg-orange-400'}`} />
            <span className="font-mono text-[11px] flex-1 truncate">
                <span className="text-zinc-400">{dir}</span>
                <span className="text-zinc-700 font-medium">{basename}</span>
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
    const isUser = message.role === 'user';

    return (
        <div
            className={`group flex gap-2 ${isUser ? 'justify-end' : 'justify-start'} px-1`}
            aria-label={isUser ? 'User message' : 'Assistant message'}
        >
            {!isUser && (
                <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center shrink-0 mt-0.5 border border-zinc-200">
                    <Image src="/logo.png" alt="Mockline" width={12} height={12} className="rounded-sm" />
                </div>
            )}

            <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {/* Message body */}
                <div
                    className={`rounded-2xl px-3 py-2.5 ${
                        isUser
                            ? 'bg-zinc-900 text-white rounded-br-sm'
                            : 'text-zinc-800 rounded-bl-sm'
                    }`}
                >
                    {isUser ? (
                        <p className={`${isMobile ? 'text-[13px]' : 'text-sm'} leading-relaxed whitespace-pre-wrap`}>{message.content}</p>
                    ) : (
                        <>
                            <MarkdownMessage content={message.content} />

                            {message.metadata?.autoFixed && (
                                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 w-fit">
                                    <Wrench className="w-3 h-3" />
                                    <span>Auto-fixed{message.metadata.fixAttempts ? ` · ${message.metadata.fixAttempts} attempt${message.metadata.fixAttempts > 1 ? 's' : ''}` : ''}</span>
                                </div>
                            )}

                            {message.metadata?.sandboxResult && (
                                <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] rounded-md px-2 py-1 w-fit border ${
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
                                <div className="mt-2">
                                    <button
                                        onClick={() => onToggleFiles(message._id)}
                                        className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
                                        aria-expanded={expandedFilesId === message._id}
                                    >
                                        <FileCode className="w-3 h-3" />
                                        <span>{message.metadata.filesGenerated.length} file{message.metadata.filesGenerated.length !== 1 ? 's' : ''} generated</span>
                                        {expandedFilesId === message._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>
                                    {expandedFilesId === message._id && (
                                        <div className="mt-1.5 border border-zinc-100 rounded-lg px-2 py-1 divide-y divide-zinc-100">
                                            {(message.metadata.filesGenerated as string[]).map((f) => (
                                                <FileChangeRow key={f} path={f} type="created" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {message.metadata?.type === 'repair-assistant' && (() => {
                                const modified = (message.metadata.modifiedFiles ?? []) as string[];
                                const created = (message.metadata.newFiles ?? []) as string[];
                                const diffs = message.metadata.fileDiffs;
                                const total = modified.length + created.length;
                                if (total === 0) return null;
                                return (
                                    <div className="mt-2">
                                        <button
                                            onClick={() => onToggleFiles(message._id)}
                                            className="flex items-center gap-1.5 text-[11px] text-amber-600 hover:text-amber-700 transition-colors"
                                            aria-expanded={expandedFilesId === message._id}
                                        >
                                            <Wrench className="w-3 h-3" />
                                            <span>{total} file{total !== 1 ? 's' : ''} repaired</span>
                                            {expandedFilesId === message._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>
                                        {expandedFilesId === message._id && (
                                            <div className="mt-1.5 space-y-1">
                                                {diffs && diffs.length > 0
                                                    ? diffs.map(d => <FileDiff key={d.path} diff={d} />)
                                                    : (
                                                        <div className="border border-zinc-100 rounded-lg px-2 py-1 divide-y divide-zinc-100">
                                                            {modified.map(f => <FileChangeRow key={f} path={f} type="modified" />)}
                                                            {created.map(f => <FileChangeRow key={f} path={f} type="created" />)}
                                                        </div>
                                                    )
                                                }
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {message.metadata?.usage?.totalTokens && message.metadata.usage.totalTokens > 0 && (
                                <p className="mt-2 text-[10px] text-zinc-300">
                                    {message.metadata.usage.promptTokens?.toLocaleString()} in · {message.metadata.usage.completionTokens?.toLocaleString()} out
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Actions row — visible on hover */}
                <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-zinc-400 px-1">{formatTime(message.createdAt)}</span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                        onClick={() => onCopy(message._id, message.content)}
                        aria-label={`Copy ${message.role} message`}
                    >
                        <Copy className="w-3 h-3 mr-1" />
                        {copiedMessageId === message._id ? 'Copied' : 'Copy'}
                    </Button>

                    {isUser && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
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
