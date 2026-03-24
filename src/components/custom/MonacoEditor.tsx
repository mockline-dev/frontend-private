'use client'

import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useEffect, useRef } from 'react'

interface MonacoEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  language?: string
  fileName?: string
  readOnly?: boolean
  height?: string | number
  onCursorPositionChange?: (pos: { line: number; col: number }) => void
}

function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'rb': 'ruby',
    'php': 'php',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'fish': 'shell',
    'ps1': 'powershell',
    'dockerfile': 'dockerfile',
    'docker': 'dockerfile',
    'tf': 'terraform',
    'hcl': 'terraform',
    'vue': 'vue',
    'svelte': 'svelte',
  }

  return languageMap[ext] || 'plaintext'
}

export function MonacoEditor({
  value,
  onChange,
  language,
  fileName,
  readOnly = false,
  height = '100%',
  onCursorPositionChange
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const detectedLanguage = language || (fileName ? getLanguageFromFileName(fileName) : 'plaintext')

  useEffect(() => {
    // Auto-resize editor on window resize
    const handleResize = () => {
      if (editorRef.current) {
        editorRef.current.layout()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Record<string, unknown>) => {
    editorRef.current = editor

    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      fontLigatures: true,
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      formatOnPaste: true,
      formatOnType: true,
    })

    if (onCursorPositionChange) {
      editor.onDidChangeCursorPosition((e) => {
        onCursorPositionChange({ line: e.position.lineNumber, col: e.position.column })
      })
    }
  }

  const handleEditorValidationError = (error: unknown) => {
    console.error('Monaco editor validation error:', error)
  }

  return (
    <div className="h-full w-full">
      <Editor
        height={height}
        language={detectedLanguage}
        value={value}
        onMount={handleEditorDidMount}
        onValidate={handleEditorValidationError}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
          contextmenu: true,
          scrollbar: {
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
        onChange={onChange}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        }
      />
    </div>
  )
}
