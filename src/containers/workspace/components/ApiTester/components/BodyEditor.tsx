'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MonacoEditor } from '@/components/custom/MonacoEditor';
import { DEFAULT_CONTENT_TYPES } from '../constants';

interface BodyEditorProps {
    body: string;
    contentType: string;
    onBodyChange: (body: string) => void;
    onContentTypeChange: (ct: string) => void;
}

function getLanguageFromContentType(ct: string): string {
    if (ct.includes('json')) return 'json';
    if (ct.includes('xml')) return 'xml';
    if (ct.includes('html')) return 'html';
    return 'plaintext';
}

export function BodyEditor({ body, contentType, onBodyChange, onContentTypeChange }: BodyEditorProps) {
    return (
        <div className="flex flex-col h-full gap-2">
            <div className="flex items-center gap-2 px-3 pt-2">
                <span className="text-xs text-zinc-500">Content-Type</span>
                <Select value={contentType} onValueChange={onContentTypeChange}>
                    <SelectTrigger className="h-6 text-xs w-56 border-zinc-200">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {DEFAULT_CONTENT_TYPES.map((ct) => (
                            <SelectItem key={ct} value={ct} className="text-xs">
                                {ct}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex-1 overflow-hidden">
                <MonacoEditor
                    value={body}
                    onChange={(v) => onBodyChange(v ?? '')}
                    language={getLanguageFromContentType(contentType)}
                    readOnly={false}
                    height="100%"
                />
            </div>
        </div>
    );
}
