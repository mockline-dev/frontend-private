'use client';

import { Button } from '@/components/ui/button';
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
    content: string;
    language: string;
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

    return (
        <div className="border-t border-gray-200 bg-gray-50">
            {/* Header */}
            <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                        🤖 Mocky suggests {updates.length} file change{updates.length > 1 ? 's' : ''}
                    </span>
                </div>
                <Button onClick={onAcceptAll} disabled={isApplying} size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700">
                    {isApplying ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                    {isApplying ? 'Applying...' : 'Accept All'}
                </Button>
            </div>

            {/* Updates List */}
            <div className="max-h-96 overflow-y-auto">
                {updates.map((update) => {
                    const isExpanded = expandedUpdates.has(update.filename);
                    const isApplyingUpdate = applyingUpdateKeys.includes(getUpdateKey(update));
                    const currentContent = currentFiles.get(update.filename) || '';

                    return (
                        <div key={update.filename} className="border-b border-gray-200 bg-white">
                            {/* Update Header */}
                            <button
                                onClick={() => toggleExpand(update.filename)}
                                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-2 flex-1">
                                    {getActionIcon(update.action)}
                                    <span className="text-sm font-medium text-gray-900">{update.filename}</span>
                                    <span className="text-xs text-gray-500">— {getActionLabel(update.action)}</span>
                                    <span className="text-xs text-gray-400 ml-2">&ldquo;{update.description}&rdquo;</span>
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
                                        className="h-6 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                    >
                                        {isApplyingUpdate ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    </Button>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onReject(update);
                                        }}
                                        disabled={isApplyingUpdate || isApplying}
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            </button>

                            {/* Diff Preview */}
                            {isExpanded && update.action !== 'delete' && (
                                <div className="px-4 pb-3">
                                    <div className="border border-gray-200 rounded-md overflow-hidden">
                                        <DiffEditor
                                            original={currentContent}
                                            modified={update.content}
                                            language={update.language}
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
