'use client';

import { MonacoEditor } from '@/components/custom/MonacoEditor';

interface ResponseBodyViewerProps {
    body: string;
    contentType?: string;
}

function getLanguage(ct: string): string {
    if (ct.includes('json')) return 'json';
    if (ct.includes('xml') || ct.includes('html')) return 'xml';
    return 'plaintext';
}

export function ResponseBodyViewer({ body, contentType = '' }: ResponseBodyViewerProps) {
    return (
        <MonacoEditor
            value={body}
            onChange={() => void 0}
            language={getLanguage(contentType)}
            readOnly={true}
            height="100%"
        />
    );
}
