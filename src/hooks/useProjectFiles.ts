'use client'

import { fetchFileContent } from '@/api/files/fetchFileContent'
import { apiServices } from '@/api/services'
import { File, filesService } from '@/services/api/files'
import feathersClient from '@/services/featherClient'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

// Backward compatibility - keep old type name as alias
export type AIFile = File

export interface FileNode {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  path: string              // Keep for display purposes
  fileId?: string
  key?: string              // Changed from 'r2Key'
}

export interface UseProjectFilesReturn {
  files: File[]
  fileTree: FileNode[]
  loading: boolean
  error: string | null
  selectedFileContent: string | null
  loadingContent: boolean
  loadFileContent: (file: File) => Promise<void>
  refreshFiles: () => Promise<void>
}

/**
 * Hook to manage project files and file tree structure
 */
export function useProjectFiles(projectId?: string, initialFiles: File[] = []): UseProjectFilesReturn {
  const [files, setFiles] = useState<File[]>(initialFiles)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)
  
  // Use ref to track current projectId to prevent stale closures
  const currentProjectIdRef = useRef(projectId)
  const initialProjectIdRef = useRef(projectId)
  const loadingRef = useRef(false)

  const loadFiles = useCallback(async () => {
    const currentProjectId = currentProjectIdRef.current
    
    // Prevent multiple simultaneous calls
    if (!currentProjectId || loadingRef.current) return

    try {
      loadingRef.current = true
      setLoading(true)
      setError(null)
      
      const projectFiles = await filesService.find({
        projectId: currentProjectId
      })
      
      // Only update if we're still on the same project
      if (currentProjectIdRef.current === currentProjectId) {
        setFiles(projectFiles.data || [])
      }
    } catch (err) {
      // Only show error if we're still on the same project
      if (currentProjectIdRef.current === currentProjectId) {
        console.error('Failed to load project files:', err)
        setError('Failed to load project files')
        toast.error('Failed to load project files')
      }
    } finally {
      loadingRef.current = false
      if (currentProjectIdRef.current === currentProjectId) {
        setLoading(false)
      }
    }
  }, []) // No dependencies to prevent recreation

  // Update ref when projectId changes
  useEffect(() => {
    currentProjectIdRef.current = projectId
  }, [projectId])

  useEffect(() => {
    if (initialFiles.length > 0) {
      setFiles(initialFiles)
    }
  }, [initialFiles])

  // Load files when projectId changes
  useEffect(() => {
    if (projectId) {
      if (projectId !== initialProjectIdRef.current || initialFiles.length === 0) {
        loadFiles()
      }
    } else {
      setFiles([])
      setFileTree([])
      setSelectedFileContent(null)
      setError(null)
    }
  }, [projectId, initialFiles.length, loadFiles]) // Only depend on projectId and initial data

  // Convert flat file list to tree structure
  useEffect(() => {
    if (files.length > 0) {
      const tree = buildFileTree(files)
      setFileTree(tree)
    } else {
      setFileTree([])
    }
  }, [files])

  // Add real-time listeners for files service
  useEffect(() => {
    if (!projectId) return;

    const unsubscribeCreated = filesService.onCreated((newFile) => {
      if (newFile.projectId === projectId) {
        setFiles(prev => {
          // Avoid duplicates
          if (prev.find(f => f._id === newFile._id)) return prev;
          return [...prev, newFile];
        });
      }
    });

    return () => {
      if (typeof unsubscribeCreated === 'function') {
        unsubscribeCreated();
      }
    };
  }, [projectId])

  // Add real-time listeners for patched and removed events
  useEffect(() => {
    const socket = feathersClient.io;
    if (!socket) return;

    const setupListeners = async () => {
      try {
        await feathersClient.authenticate();
        const filesService = feathersClient.service(apiServices.files);

        const handlePatchedFile = (patchedFile: File) => {
          if (patchedFile.projectId === projectId) {
            setFiles((prev) => prev.map((f) => (f._id === patchedFile._id ? patchedFile : f)));
          }
        };

        const handleRemovedFile = (removedFile: File) => {
          if (removedFile.projectId === projectId) {
            setFiles((prev) => prev.filter((f) => f._id !== removedFile._id));
          }
        };

        filesService.on('patched', handlePatchedFile);
        filesService.on('removed', handleRemovedFile);

        return () => {
          filesService.removeListener('patched', handlePatchedFile);
          filesService.removeListener('removed', handleRemovedFile);
        };
      } catch (error) {
        console.error('Failed to setup socket listeners:', error);
      }
    };

    if (socket.connected) setupListeners();
    socket.on('connect', setupListeners);
    return () => {
      socket.off('connect', setupListeners);
    };
  }, [projectId])
  

  const loadFileContent = useCallback(async (file: File) => {
    try {
      setLoadingContent(true)
      setSelectedFileContent(null)
      
      // Get file content using direct API function
      const result = await fetchFileContent({ fileId: file._id });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setSelectedFileContent(result.content);
    } catch (err) {
      console.error('Failed to load file content:', err)
      toast.error('Failed to load file content')
      setSelectedFileContent('// Error loading file content')
    } finally {
      setLoadingContent(false)
    }
  }, [])

  const refreshFiles = useCallback(async () => {
    if (currentProjectIdRef.current) {
      await loadFiles()
    }
  }, [loadFiles])

  return {
    files,
    fileTree,
    loading,
    error,
    selectedFileContent,
    loadingContent,
    loadFileContent,
    refreshFiles
  }
}

/**
 * Build a tree structure from flat file list
 */
function buildFileTree(files: File[]): FileNode[] {
  const tree: FileNode[] = []
  const pathMap = new Map<string, FileNode>()

  // Sort files by name to ensure parent folders are created first
  const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name))

  for (const file of sortedFiles) {
    const pathParts = file.name.split('/')
    let currentPath = ''
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      if (!part) {
        continue
      }
      const isLastPart = i === pathParts.length - 1
      currentPath = currentPath ? `${currentPath}/${part}` : part
      
      if (!pathMap.has(currentPath)) {
        const node: FileNode = isLastPart
          ? {
              name: part,
              type: 'file',
              path: currentPath,
              fileId: file._id,
              key: file.key
            }
          : {
              name: part,
              type: 'folder',
              path: currentPath,
              children: []
            }
        
        pathMap.set(currentPath, node)
        
        // Add to parent or root
        if (i === 0) {
          tree.push(node)
        } else {
          const parentPath = pathParts.slice(0, i).join('/')
          const parent = pathMap.get(parentPath)
          if (parent && parent.children) {
            parent.children.push(node)
          }
        }
      }
    }
  }

  return tree
}

/**
 * Find file by path in the files array
 */
export function findFileByPath(files: File[], path: string): File | undefined {
  return files.find(file => file.name === path)
}