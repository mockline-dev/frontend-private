'use client';

import { fetchFileContent } from '@/api/files/fetchFileContent';
import { getDisplayPath } from '@/containers/workspace/utils/fileTree';
import type { ProjectFile } from '@/types/feathers';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UseWorkspaceFilesParams {
    files: ProjectFile[];
    setCurrentFile: (file: ProjectFile) => void;
    openTab: (tab: { id: string; filePath: string; fileName: string }) => void;
}

export function useWorkspaceFiles({ files, setCurrentFile, openTab }: UseWorkspaceFilesParams) {
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [selectedFileContent, setSelectedFileContent] = useState<string>('');
    const [loadingContent, setLoadingContent] = useState(false);
    const [recentFiles, setRecentFiles] = useState<string[]>([]);
    const [quickOpenOpen, setQuickOpenOpen] = useState(false);

    const handleFileSelect = useCallback(
        async (filePath: string) => {
            setSelectedFile(filePath);
            const fileName = filePath.split('/').pop() ?? filePath;
            openTab({ id: filePath, filePath, fileName });
            setRecentFiles((prev) => [filePath, ...prev.filter((p) => p !== filePath)].slice(0, 5));

            const file = files.find((f) => getDisplayPath(f) === filePath || f.name === filePath);
            if (file) {
                setCurrentFile(file);
                setLoadingContent(true);
                try {
                    const result = await fetchFileContent({ fileId: file._id });
                    if (!result.success) throw new Error(result.error);
                    setSelectedFileContent(result.content);
                } catch (error) {
                    console.error('Failed to load file content:', error);
                    toast.error('Failed to load file content');
                } finally {
                    setLoadingContent(false);
                }
            }
        },
        [files, setCurrentFile, openTab]
    );

    return {
        selectedFile,
        setSelectedFile,
        selectedFileContent,
        setSelectedFileContent,
        loadingContent,
        recentFiles,
        quickOpenOpen,
        setQuickOpenOpen,
        handleFileSelect,
    };
}
