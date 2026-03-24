'use client';

import { fetchFileContent } from '@/api/files/fetchFileContent';
import { ChatComposer } from '@/components/custom/ChatComposer';
import { MarkdownMessage } from '@/components/custom/MarkdownMessage';
import { Button } from '@/components/ui/button';
import { FileUpdatePreview } from '@/containers/workspace/components/FileUpdatePreview';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAIAgent } from '@/hooks/useAIAgent';
import { type File as FileType } from '@/services/api/files';
import { type AIAgentStepEvent } from '@/types/feathers';
import { Activity, Brain, CheckCircle2, Copy, Loader2, RefreshCcw, Sparkles, Wrench } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

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

function getStepIcon(stepType: AIAgentStepEvent['type']) {
    switch (stepType) {
        case 'thinking':
            return <Brain className="w-3.5 h-3.5 text-violet-600" />;
        case 'tool_call':
        case 'tool_result':
            return <Wrench className="w-3.5 h-3.5 text-blue-600" />;
        case 'status':
        default:
            return <Activity className="w-3.5 h-3.5 text-gray-600" />;
    }
}

function getStepTypeLabel(stepType: AIAgentStepEvent['type']): string {
    switch (stepType) {
        case 'thinking':
            return 'Thinking';
        case 'tool_call':
            return 'Tool Call';
        case 'tool_result':
            return 'Tool Result';
        case 'status':
        default:
            return 'Status';
    }
}

export function AiAgent({ projectId, files = [], selectedFile, selectedFileContent, onFileApplied }: AIAgentProps) {
    const {
        messages,
        hasOlderMessages,
        isLoadingOlderMessages,
        input,
        setInput,
        isLoading,
        isStreaming,
        agentSteps,
        isApplyingUpdates,
        applyingUpdateKeys,
        fileUpdates,
        retryingMessageId,
        handleSubmit,
        retryMessage,
        loadOlderMessages,
        handleAcceptUpdate,
        handleRejectUpdate,
        handleAcceptAllUpdates,
        stopStream
    } = useAIAgent(projectId, files, selectedFile, selectedFileContent, onFileApplied);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const previousMessageCountRef = useRef(0);
    const [currentFileContents, setCurrentFileContents] = useState<Map<string, string>>(new Map());
    const [showAllSteps, setShowAllSteps] = useState(false);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const isMobile = useIsMobile();

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
    const visibleSteps = useMemo(() => (showAllSteps ? agentSteps : agentSteps.slice(-3)), [agentSteps, showAllSteps]);
    const currentStep = agentSteps[agentSteps.length - 1];

    const showTypingIndicator = isLoading || isStreaming;

    const stepStatusLabel = currentStep?.title || 'Thinking through your request';

    const formatTime = (value?: number) => {
        if (!value) return '';
        return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const copyMessage = async (messageId: string, content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedMessageId(messageId);
            toast.success('Message copied');
            window.setTimeout(() => {
                setCopiedMessageId((prev) => (prev === messageId ? null : prev));
            }, 1200);
        } catch {
            toast.error('Failed to copy message');
        }
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
                    <div className="flex items-center justify-center py-2" role="status" aria-live="polite" aria-label="Loading older chat messages">
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
                                <MarkdownMessage content={message.content} />
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
                ))}

                {showTypingIndicator && (
                    <div className="flex gap-2" role="status" aria-live="polite" aria-label="Assistant is composing a response">
                        <div className="w-7 h-7 bg-linear-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-xs">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.2s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.1s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" />
                                <span className="text-xs text-gray-700 ml-1">{stepStatusLabel}</span>
                            </div>
                        </div>
                    </div>
                )}

                {agentSteps.length > 0 && (
                    <div className="border border-gray-200 rounded-xl bg-white p-3 mt-2 shadow-xs" role="status" aria-live="polite" aria-label="Agent activity timeline">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                {isStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-600" /> : <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                                <span className="text-xs font-medium text-gray-900">Agent activity</span>
                            </div>
                            {agentSteps.length > 3 && (
                                <button
                                    onClick={() => setShowAllSteps((prev) => !prev)}
                                    className="text-[11px] text-gray-600 hover:text-gray-900 underline-offset-2 hover:underline"
                                    type="button"
                                    aria-expanded={showAllSteps}
                                    aria-label={showAllSteps ? 'Show recent agent steps' : `Show all ${agentSteps.length} agent steps`}
                                >
                                    {showAllSteps ? 'Show recent' : `Show all (${agentSteps.length})`}
                                </button>
                            )}
                        </div>

                        {currentStep && (
                            <p className="text-[11px] text-gray-600 mt-1.5">
                                Current: <span className="text-gray-900 font-medium">{currentStep.title}</span>
                            </p>
                        )}

                        <div className="mt-2 space-y-1.5" role="list" aria-label="Agent steps">
                            {visibleSteps.map((step) => (
                                <div
                                    key={`${step.createdAt}-${step.type}-${step.title}`}
                                    className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2"
                                    role="listitem"
                                >
                                    <div className="mt-0.5">{getStepIcon(step.type)}</div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-900">{step.title}</span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">{getStepTypeLabel(step.type)}</span>
                                            <span className="text-[10px] text-gray-400">{formatTime(step.createdAt)}</span>
                                        </div>
                                        {step.detail && <p className="text-[11px] text-gray-600 mt-0.5">{step.detail}</p>}
                                    </div>
                                </div>
                            ))}
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
                <div className="px-3 pb-3 border-t pt-3 border-gray-200 bg-white">
                    <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wide font-medium">Quick actions</p>
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

            <ChatComposer
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                isStreaming={isStreaming}
                onStopGenerating={stopStream}
                placeholder="Ask Mocky..."
            />
        </div>
    );
}
