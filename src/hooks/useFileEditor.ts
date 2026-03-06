'use client'

import { deleteFile as deleteFileApi } from '@/api/files/deleteFile'
import { UserData } from '@/containers/auth/types'
import type { File } from '@/services/api/files'
import { filesService } from '@/services/api/files'
import { projectsService } from '@/services/api/projects'
import feathersClient from '@/services/featherClient'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export interface UseFileEditorReturn {
  content: string
  setContent: (content: string) => void
  hasUnsavedChanges: boolean
  isSaving: boolean
  saveFile: () => Promise<void>
  createFile: (name: string, fileContent: string, fileType: string) => Promise<void>
  deleteFile: (file: File) => Promise<void>
}

export function useFileEditor(
  projectId: string | undefined,
  file: File | null,
  currentUser: UserData,
  onFileSaved?: () => void,
  onFileDeleted?: () => void,
): UseFileEditorReturn {
  const [content, setContent] = useState<string>('')
  const [originalContent, setOriginalContent] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const selectedFileRef = useRef<string>('')

  useEffect(() => {
    if (file && file.name !== selectedFileRef.current) {
      setContent('')
      setOriginalContent('')
      setHasUnsavedChanges(false)
      selectedFileRef.current = file.name
    }
  }, [file?.name])

  useEffect(() => {
    setHasUnsavedChanges(content !== originalContent && content.length > 0)
  }, [content, originalContent])

  const saveFile = useCallback(async () => {
    if (!projectId || !file) return

    setIsSaving(true)
    try {

      if (!currentUser) {
        throw new Error('You must be authenticated to save files')
      }

      const project = await projectsService.get(projectId)
      if (project.userId !== currentUser.feathersId) {
        throw new Error('You do not have permission to modify/delete this project')
      }

      await feathersClient.service('uploads').create({
        key: file.key,
        content,
        contentType: 'text/plain',
        projectId
      })

      await filesService.patch(file._id, {
        size: new TextEncoder().encode(content).length,
        currentVersion: (file.currentVersion || 1) + 1
      })

      setOriginalContent(content)
      setHasUnsavedChanges(false)
      toast.success(`Saved: ${file.name}`)
      onFileSaved?.()
    } catch (error) {
      console.error('Failed to save file:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to save "${file.name}". ${errorMessage}. Please try again.`)
    } finally {
      setIsSaving(false)
    }
  }, [projectId, file, content, onFileSaved])

  const createFile = useCallback(async (name: string, fileContent: string, fileType: string) => {
    if (!projectId) {
      toast.error('No project selected')
      return
    }

    setIsSaving(true)
    try {
      const key = `${projectId}/${name}`

      await feathersClient.service('uploads').create({
        key,
        content: fileContent,
        contentType: 'text/plain',
        projectId
      })

      await filesService.create({
        projectId,
        name,
        key,
        fileType,
        size: new TextEncoder().encode(fileContent).length
      })

      toast.success(`Created: ${name}`)
      onFileSaved?.()
    } catch (error) {
      console.error('Failed to create file:', error)
      toast.error('Failed to create file')
    } finally {
      setIsSaving(false)
    }
  }, [projectId, onFileSaved])

  const deleteFile = useCallback(async (fileToDelete: File) => {
    if (!projectId) {
      toast.error('No project selected')
      return
    }

    setIsSaving(true)
    try {

      if (!currentUser) {
        throw new Error('You must be authenticated to delete files')
      }

      const project = await projectsService.get(projectId)
      if (project.userId !== currentUser.feathersId) {
        throw new Error('You do not have permission to modify/delete this project')
      }

      await deleteFileApi({ id: fileToDelete._id })

      toast.success(`Deleted: ${fileToDelete.name}`)
      onFileDeleted?.()
    } catch (error) {
      console.error('Failed to delete file:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to delete "${fileToDelete.name}". ${errorMessage}. Please try again.`)
    } finally {
      setIsSaving(false)
    }
  }, [projectId, onFileDeleted, currentUser])

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
