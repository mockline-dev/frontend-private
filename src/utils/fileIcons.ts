import {
    File,
    FileArchive,
    FileCode,
    FileCog,
    FileImage,
    FileJson,
    FileLock,
    FileSpreadsheet,
    FileTerminal,
    FileText,
    type LucideIcon
} from 'lucide-react';

export function getFileIcon(fileName: string): LucideIcon {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.ts') || fileName.endsWith('.jsx') || fileName.endsWith('.js') || fileName.endsWith('.py')) {
        return FileCode;
    }
    if (fileName.endsWith('.sh') || fileName.endsWith('.bash') || fileName.endsWith('.zsh')) {
        return FileTerminal;
    }
    if (fileName.endsWith('.json')) {
        return FileJson;
    }
    if (fileName.endsWith('.yaml') || fileName.endsWith('.yml') || fileName.endsWith('.toml') || fileName.endsWith('.ini') || fileName.endsWith('.env')) {
        return FileCog;
    }
    if (fileName.endsWith('.lock')) {
        return FileLock;
    }
    if (fileName.endsWith('.csv')) {
        return FileSpreadsheet;
    }
    if (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.svg') || fileName.endsWith('.gif')) {
        return FileImage;
    }
    if (fileName.endsWith('.zip') || fileName.endsWith('.tar') || fileName.endsWith('.gz')) {
        return FileArchive;
    }
    if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
        return FileText;
    }
    return File;
}

export function getLanguageFromFileName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    const languageMap: Record<string, string> = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        py: 'python',
        java: 'java',
        c: 'c',
        cpp: 'cpp',
        cs: 'csharp',
        go: 'go',
        rs: 'rust',
        rb: 'ruby',
        php: 'php',
        swift: 'swift',
        kt: 'kotlin',
        scala: 'scala',
        html: 'html',
        css: 'css',
        scss: 'scss',
        json: 'json',
        xml: 'xml',
        yaml: 'yaml',
        yml: 'yaml',
        md: 'markdown',
        sql: 'sql',
        sh: 'shell',
        bash: 'shell',
        zsh: 'shell',
        fish: 'shell',
        ps1: 'powershell',
        dockerfile: 'dockerfile',
        docker: 'dockerfile',
        tf: 'terraform',
        hcl: 'terraform',
        vue: 'vue',
        svelte: 'svelte'
    };

    return languageMap[ext] || 'plaintext';
}
