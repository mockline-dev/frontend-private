'use client';

import { Check, Copy } from 'lucide-react';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github-dark.css';
import type { Components } from 'react-markdown';

interface MarkdownMessageProps {
    content: string;
    className?: string;
}

/**
 * Recursively extract plain text from React children (needed because rehype-highlight
 * wraps code content in <span> elements before our custom `code` component receives them).
 */
function extractTextContent(node: React.ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractTextContent).join('');
    if (React.isValidElement(node)) {
        const el = node as React.ReactElement<{ children?: React.ReactNode }>;
        return extractTextContent(el.props.children);
    }
    return '';
}

function CodeBlock({ language, children }: { language: string; children: React.ReactNode }) {
    const [copied, setCopied] = useState(false);
    const plainText = extractTextContent(children);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(plainText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // ignore
        }
    };

    return (
        <div className="rounded-lg overflow-hidden my-3 border border-zinc-700">
            <div className="flex items-center justify-between bg-zinc-800 px-3 py-1.5 border-b border-zinc-700">
                <span className="text-[11px] text-zinc-400 font-mono">{language || 'code'}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
                    aria-label="Copy code"
                >
                    {copied ? (
                        <>
                            <Check className="w-3 h-3 text-green-400" />
                            <span className="text-green-400">Copied</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <div className="bg-zinc-900 overflow-x-auto">
                <pre className="p-3 text-xs leading-relaxed">
                    <code className={language ? `language-${language}` : ''}>{children}</code>
                </pre>
            </div>
        </div>
    );
}

const components: Components = {
    code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        const isInline = !match;

        if (isInline) {
            return (
                <code className="bg-zinc-100 text-violet-700 rounded px-1 py-0.5 text-[0.875em] font-mono" {...props}>
                    {children}
                </code>
            );
        }

        return <CodeBlock language={match[1] ?? ''}>{children}</CodeBlock>;
    },
    a({ href, children }) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 hover:underline"
            >
                {children}
            </a>
        );
    },
    table({ children }) {
        return (
            <div className="overflow-x-auto my-3">
                <table className="w-full text-xs border-collapse border border-zinc-200">{children}</table>
            </div>
        );
    },
    th({ children }) {
        return (
            <th className="border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-left font-medium text-zinc-900">
                {children}
            </th>
        );
    },
    td({ children }) {
        return <td className="border border-zinc-200 px-3 py-1.5 text-zinc-700">{children}</td>;
    },
    ul({ children }) {
        return <ul className="list-disc list-inside space-y-0.5 my-2 text-sm">{children}</ul>;
    },
    ol({ children }) {
        return <ol className="list-decimal list-inside space-y-0.5 my-2 text-sm">{children}</ol>;
    },
    blockquote({ children }) {
        return (
            <blockquote className="border-l-2 border-violet-300 pl-3 text-zinc-500 italic my-2">
                {children}
            </blockquote>
        );
    },
    h1({ children }) {
        return <h1 className="text-base font-semibold text-zinc-900 mt-3 mb-1">{children}</h1>;
    },
    h2({ children }) {
        return <h2 className="text-sm font-semibold text-zinc-900 mt-3 mb-1">{children}</h2>;
    },
    h3({ children }) {
        return <h3 className="text-sm font-medium text-zinc-900 mt-2 mb-1">{children}</h3>;
    },
    p({ children }) {
        return <p className="text-sm leading-relaxed my-1">{children}</p>;
    }
};

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
    return (
        <div className={className}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>
                {content}
            </ReactMarkdown>
        </div>
    );
}
