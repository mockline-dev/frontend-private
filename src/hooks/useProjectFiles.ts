'use client'

import { useState, useEffect } from 'react'
import { aiFilesService, AIFile } from '@/services/api/files'
import { toast } from 'sonner'

export interface FileNode {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  path: string
  fileId?: string
  r2Key?: string
}

export interface UseProjectFilesReturn {
  files: AIFile[]
  fileTree: FileNode[]
  loading: boolean
  error: string | null
  selectedFileContent: string | null
  loadingContent: boolean
  loadFileContent: (file: AIFile) => Promise<void>
  refreshFiles: () => Promise<void>
}

/**
 * Hook to manage project files and file tree structure
 */
export function useProjectFiles(projectId?: string): UseProjectFilesReturn {
  const [files, setFiles] = useState<AIFile[]>([])
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)

  // Load files when projectId changes
  useEffect(() => {
    if (projectId) {
      loadFiles()
    } else {
      setFiles([])
      setFileTree([])
    }
  }, [projectId])

  // Convert flat file list to tree structure
  useEffect(() => {
    if (files.length > 0) {
      const tree = buildFileTree(files)
      setFileTree(tree)
    } else {
      setFileTree([])
    }
  }, [files])

  const loadFiles = async () => {
    if (!projectId) return

    try {
      setLoading(true)
      setError(null)
      
      const projectFiles = await aiFilesService.find({
        query: { projectId }
      })
      
      setFiles(projectFiles.data || [])
    } catch (err) {
      console.error('Failed to load project files:', err)
      setError('Failed to load project files')
      toast.error('Failed to load project files')
    } finally {
      setLoading(false)
    }
  }

  const loadFileContent = async (file: AIFile) => {
    try {
      setLoadingContent(true)
      setSelectedFileContent(null)
      
      // Get file content from R2 storage
      const response = await fetch(`/api/files/${file._id}/content`)
      
      if (!response.ok) {
        throw new Error('Failed to load file content')
      }
      
      const content = await response.text()
      setSelectedFileContent(content)
    } catch (err) {
      console.error('Failed to load file content:', err)
      toast.error('Failed to load file content')
      setSelectedFileContent('// Error loading file content')
    } finally {
      setLoadingContent(false)
    }
  }

  const refreshFiles = async () => {
    await loadFiles()
  }

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
function buildFileTree(files: AIFile[]): FileNode[] {
  const tree: FileNode[] = []
  const pathMap = new Map<string, FileNode>()

  // Sort files by path to ensure parent folders are created first
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path))

  for (const file of sortedFiles) {
    const pathParts = file.path.split('/')
    let currentPath = ''
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      const isLastPart = i === pathParts.length - 1
      currentPath = currentPath ? `${currentPath}/${part}` : part
      
      if (!pathMap.has(currentPath)) {
        const node: FileNode = {
          name: part,
          type: isLastPart ? 'file' : 'folder',
          path: currentPath,
          children: isLastPart ? undefined : [],
          fileId: isLastPart ? file._id : undefined,
          r2Key: isLastPart ? file.r2Key : undefined
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
export function findFileByPath(files: AIFile[], path: string): AIFile | undefined {
  return files.find(file => file.path === path)
}