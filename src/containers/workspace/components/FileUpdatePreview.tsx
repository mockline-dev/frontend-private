'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DiffEditor } from '@monaco-editor/react';
import { Check, FileEdit, FilePlus, Loader2, Trash2, X } from 'lucide-react';
import { useState } from 'react';

// Helper function to escape HTML entities to prevent XSS
function escapeHtml(unsafe: string): string {
    return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export interface FileUpdate {
    filename: string;
    action: 'create' | 'modify' | 'delete';
    description: string;
    /** For create/modify: the new (resolved) content. For delete: may be empty. */
    content: string;
    /** Original content for diff view — provided by the backend on file-diff events. */
    oldContent?: string;
    language: string;
    /** Backend update ID used for server-side accept/reject patch calls. */
    updateId?: string;
}

export interface FileUpdatePreviewProps {
    updates: FileUpdate[];
    currentFiles: Map<string, string>; // filename → current content
    applyingUpdateKeys?: string[];
    isApplying?: boolean;
    onAccept: (update: FileUpdate) => void;
    onReject: (update: FileUpdate) => void;
    onAcceptAll: () => void;
}

export function FileUpdatePreview({ updates, currentFiles, applyingUpdateKeys = [], isApplying = false, onAccept, onReject, onAcceptAll }: FileUpdatePreviewProps) {
    const [expandedUpdates, setExpandedUpdates] = useState<Set<string>>(new Set());

    const getUpdateKey = (update: FileUpdate) => `${update.action}:${update.filename.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '').trim()}`;

    const toggleExpand = (filename: string) => {
        setExpandedUpdates((prev) => {
            const next = new Set(prev);
            if (next.has(filename)) {
                next.delete(filename);
            } else {
                next.add(filename);
            }
            return next;
        });
    };

    const getActionIcon = (action: FileUpdate['action']) => {
        switch (action) {
            case 'create':
                return <FilePlus className="w-4 h-4 text-green-600" />;
            case 'modify':
                return <FileEdit className="w-4 h-4 text-blue-600" />;
            case 'delete':
                return <Trash2 className="w-4 h-4 text-red-600" />;
        }
    };

    const getActionLabel = (action: FileUpdate['action']) => {
        switch (action) {
            case 'create':
                return 'create';
            case 'modify':
                return 'modify';
            case 'delete':
                return 'delete';
        }
    };

    if (updates.length === 0) {
        return null;
    }

    const pendingCount = updates.length;
    const applyingCount = applyingUpdateKeys.length;

    return (
        <div className="border-t border-gray-200 bg-gray-50" role="region" aria-label="AI file update review">
            {/* Header */}
            <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center text-sm">🤖</div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            Mocky suggests {pendingCount} file change{pendingCount > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-500">{applyingCount > 0 ? `${applyingCount} applying` : `${pendingCount} pending review`}</p>
                    </div>
                </div>
                <Button
                    onClick={onAcceptAll}
                    disabled={isApplying}
                    size="sm"
                    className="h-8 text-xs bg-green-600 hover:bg-green-700"
                    aria-label={`Accept all ${pendingCount} suggested file changes`}
                >
                    {isApplying ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                    {isApplying ? 'Applying...' : 'Accept All'}
                </Button>
            </div>

            {/* Updates List */}
            <div className="max-h-96 overflow-y-auto" role="list" aria-label="Suggested file changes">
                {updates.map((update) => {
                    const isExpanded = expandedUpdates.has(update.filename);
                    const isApplyingUpdate = applyingUpdateKeys.includes(getUpdateKey(update));
                    const currentContent = update.oldContent ?? (currentFiles.get(update.filename) || '');
                    const missingCurrentContent = update.action === 'modify' && !update.oldContent && !currentFiles.has(update.filename);

                    return (
                        <div key={`${update.action}:${update.filename}`} className="border-b border-gray-200 bg-white" role="listitem">
                            {/* Update Header */}
                            <button
                                onClick={() => toggleExpand(update.filename)}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                aria-expanded={isExpanded}
                                aria-label={`Toggle preview for ${update.filename}`}
                            >
                                <div className="flex items-center gap-2 flex-1">
                                    {getActionIcon(update.action)}
                                    <div className="flex flex-col items-start">
                                        <span className="text-sm font-medium text-gray-900 text-left">{update.filename}</span>
                                        <span className="text-xs text-gray-500 text-left">{update.description}</span>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wide ml-1">
                                        {getActionLabel(update.action)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAccept(update);
                                        }}
                                        disabled={isApplyingUpdate || isApplying}
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                        aria-label={`Accept change for ${update.filename}`}
                                    >
                                        {isApplyingUpdate ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                                        Accept
                                    </Button>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onReject(update);
                                        }}
                                        disabled={isApplyingUpdate || isApplying}
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                        aria-label={`Reject change for ${update.filename}`}
                                    >
                                        <X className="w-3 h-3 mr-1" />
                                        Reject
                                    </Button>
                                </div>
                            </button>

                            {isExpanded && missingCurrentContent && (
                                <div className="px-4 pb-2">
                                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                                        Current file content is unavailable; showing proposed content only.
                                    </p>
                                </div>
                            )}

                            {/* Diff Preview */}
                            {isExpanded && update.action !== 'delete' && (
                                <div className="px-4 pb-3">
                                    <div className="border border-gray-200 rounded-md overflow-hidden">
                                        <DiffEditor
                                            original={currentContent}
                                            modified={update.content}
                                            language={update.language}
                                            loading={<Skeleton className="h-75 w-full rounded-none" />}
                                            options={{
                                                readOnly: true,
                                                renderSideBySide: true,
                                                enableSplitViewResizing: false,
                                                renderOverviewRuler: false,
                                                minimap: { enabled: false },
                                                scrollBeyondLastLine: false,
                                                fontSize: 12,
                                                lineNumbers: 'on',
                                                padding: { top: 8, bottom: 8 }
                                            }}
                                            height="300px"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Delete Preview */}
                            {isExpanded && update.action === 'delete' && (
                                <div className="px-4 pb-3">
                                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                        <p className="text-sm text-red-800">This file will be deleted. The following content will be removed:</p>
                                        <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap overflow-x-auto">
                                            {escapeHtml(currentContent) || '(empty file)'}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
