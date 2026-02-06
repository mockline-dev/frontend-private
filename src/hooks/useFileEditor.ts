'use client'

import type { AIFile } from '@/services/api/files'
import { r2Service } from '@/services/api/files'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export interface UseFileEditorReturn {
  content: string
  setContent: (content: string) => void
  hasUnsavedChanges: boolean
  isSaving: boolean
  saveFile: () => Promise<void>
  createFile: (path: string, content: string, language: string) => Promise<void>
  deleteFile: (file: AIFile) => Promise<void>
}

/**
 * Hook to manage file editing with Monaco Editor
 */
export function useFileEditor(
  projectId: string | undefined,
  file: AIFile | null,
  onFileSaved?: () => void,
  onFileDeleted?: () => void
): UseFileEditorReturn {
  const [content, setContent] = useState<string>('')
  const [originalContent, setOriginalContent] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const editorRef = useRef<any>(null)

  // Update content when file changes
  useEffect(() => {
    if (file && file.path !== selectedFileRef.current) {
      setContent('')
      setOriginalContent('')
      setHasUnsavedChanges(false)
      selectedFileRef.current = file.path
    }
  }, [file?.path])

  // Track unsaved changes
  useEffect(() => {
    const isChanged = content !== originalContent
    setHasUnsavedChanges(isChanged)
  }, [content, originalContent])

  // Auto-save on file change
  useEffect(() => {
    if (hasUnsavedChanges && autoSaveRef.current) {
      const timer = setTimeout(() => {
        if (editorRef.current && projectId && file) {
          saveFile()
        }
      }, autoSaveDelay)
      return () => clearTimeout(timer)
    }
  }, [hasUnsavedChanges, projectId, file])

  const selectedFileRef = useRef<string>('')
  const autoSaveRef = useRef(true)
  const autoSaveDelay = 2000 // 2 seconds

  const saveFile = useCallback(async () => {
    if (!projectId || !file || !editorRef.current) {
      return
    }

    setIsSaving(true)
    try {
      // Get current content from editor
      const currentContent = editorRef.current?.getValue() || content

      // Upload to R2
      await r2Service.uploadFile(file.r2Key, currentContent, 'text/plain')

      // Update file metadata in ai-files
      // Note: This would require a backend endpoint to update file size
      // For now, we'll just show success message

      setOriginalContent(currentContent)
      setHasUnsavedChanges(false)
      toast.success(`File saved: ${file.path}`)
      onFileSaved?.()
    } catch (error) {
      console.error('Failed to save file:', error)
      toast.error('Failed to save file')
    } finally {
      setIsSaving(false)
    }
  }, [projectId, file, content, onFileSaved])

  const createFile = useCallback(async (path: string, fileContent: string, language: string) => {
    if (!projectId) {
      toast.error('No project selected')
      return
    }

    try {
      setIsSaving(true)

      // Generate R2 key
      const r2Key = `${projectId}/${path}`

      // Upload to R2
      await r2Service.uploadFile(r2Key, fileContent, 'text/plain')

      // Note: Creating ai-files record would require backend endpoint
      // For now, we'll just show success message

      toast.success(`File created: ${path}`)
      onFileSaved?.()
    } catch (error) {
      console.error('Failed to create file:', error)
      toast.error('Failed to create file')
    } finally {
      setIsSaving(false)
    }
  }, [projectId, onFileSaved])

  const deleteFile = useCallback(async (fileToDelete: AIFile) => {
    if (!projectId) {
      toast.error('No project selected')
      return
    }

    try {
      setIsSaving(true)

      // Delete from R2
      await r2Service.deleteFile(fileToDelete.r2Key)

      // Note: Deleting ai-files record would require backend endpoint
      // For now, we'll just show success message

      toast.success(`File deleted: ${fileToDelete.path}`)
      onFileDeleted?.()
    } catch (error) {
      console.error('Failed to delete file:', error)
      toast.error('Failed to delete file')
    } finally {
      setIsSaving(false)
    }
  }, [projectId, onFileDeleted])

  return {
    content,
    setContent,
    hasUnsavedChanges,
    isSaving,
    saveFile,
    createFile,
    deleteFile
  }
}
