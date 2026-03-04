'use client'

import { FileTree } from '@/components/custom/FileTree';
import { MonacoEditor } from '@/components/custom/MonacoEditor';
import { UserMenu } from '@/components/custom/UserMenu';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { defaultAiModel } from '@/config/environment';
import { AiAgent } from '@/containers/aiAgent/AIAgent';
import { Terminal } from '@/containers/workspace/components/Terminal';
import { TestPanel } from '@/containers/workspace/components/TestPanel';
import { useAIProject } from '@/hooks/useAIProject';
import { useFileEditor } from '@/hooks/useFileEditor';
import { useProjectFiles } from '@/hooks/useProjectFiles';
import { useAuth } from '@/providers/AuthProvider';
import type { File } from '@/services/api/files';
import type { Project } from '@/services/api/projects';
import feathersClient from '@/services/featherClient';
import { clearSavedPrompt, getSavedPrompt } from '@/utils/promptStorage';
import {
  Bot,
  ChevronRight,
  Code2,
  Download,
  FolderTree,
  History,
  Loader2,
  Play,
  Terminal as TerminalIcon,
  TestTube2
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface WorkspaceProps {
  initialProjectId: string | undefined
  initialProject?: Project | null
  initialFiles?: File[]
}

export function Workspace({
  initialProjectId,
  initialProject = null,
  initialFiles = []
}: WorkspaceProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projectName, setProjectName] = useState('New Project');
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(
    initialProjectId || initialProject?._id
  );
  const { project, createProject, loading: projectLoading } = useAIProject(
    currentProjectId,
    initialProject
  );
  const { fileTree, files, selectedFileContent, loadingContent, loadFileContent } = useProjectFiles(
    currentProjectId,
    initialFiles
  );
  const [selectedFile, setSelectedFile] = useState<string>('src/server.js');
  const [editorContent, setEditorContent] = useState<string>('');
  const [sidebarView, setSidebarView] = useState<'files' | 'ai' | 'versions'>('files');
  const [activeView, setActiveView] = useState<'code' | 'api'>('code');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  
  const isCreatingProjectRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Get the currently selected file object
  const selectedFileObj = files.find(f => f.name === selectedFile) || null;
  
  // Use file editor hook
  const {
    content: fileEditorContent,
    setContent: setFileEditorContent,
    hasUnsavedChanges,
    isSaving,
    saveFile
  } = useFileEditor(
    currentProjectId,
    selectedFileObj,
    () => { /* Reload files after save */ }
  );

  // Sync editor content with file editor content
  useEffect(() => {
    if (selectedFileContent && selectedFileContent !== fileEditorContent) {
      setEditorContent(selectedFileContent);
    }
  }, [selectedFileContent, fileEditorContent]);

  // Update file editor content when editor changes
  useEffect(() => {
    setFileEditorContent(editorContent);
  }, [editorContent, setFileEditorContent]);

  const handleCreateProject = useCallback(async (prompt: string) => {
    if (projectLoading || isCreatingProjectRef.current) return

    try {
      isCreatingProjectRef.current = true

      const newProject = await createProject({
        name: prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt,
        description: prompt,
        framework: 'fast-api',
        language: 'python',
        model: defaultAiModel
      })
      if (newProject) {
        setCurrentProjectId(newProject._id)
        setProjectName(newProject.name)
        
        sessionStorage.setItem('currentProjectId', newProject._id)
        sessionStorage.setItem('projectInitialized', 'true')
      }
    } finally {
      isCreatingProjectRef.current = false
    }
  }, [createProject, projectLoading])

  useEffect(() => {
    if (hasInitializedRef.current) return

    const promptFromUrl = searchParams.get('prompt')
    const existingProjectId = searchParams.get('projectId')
    const savedPromptFromStorage = getSavedPrompt()
    const prompt = promptFromUrl || savedPromptFromStorage

    const projectInitialized = sessionStorage.getItem('projectInitialized')
    const storedProjectId = sessionStorage.getItem('currentProjectId')

    
    if (existingProjectId && existingProjectId !== currentProjectId) {
      setCurrentProjectId(existingProjectId)
      hasInitializedRef.current = true
      sessionStorage.setItem('currentProjectId', existingProjectId)
      sessionStorage.setItem('projectInitialized', 'true')
    }
    
    else if (storedProjectId && !currentProjectId) {
      setCurrentProjectId(storedProjectId)
      hasInitializedRef.current = true
      
      if (promptFromUrl) {
        router.replace('/workspace')
      }
    }
    else if (prompt && !currentProjectId && !projectLoading && !isCreatingProjectRef.current && !existingProjectId && !projectInitialized) {
      handleCreateProject(prompt)
      clearSavedPrompt()
      hasInitializedRef.current = true
    } else if (currentProjectId) {
      hasInitializedRef.current = true
      sessionStorage.setItem('projectInitialized', 'true')
    }
  }, [searchParams, currentProjectId, projectLoading, handleCreateProject, router])

  
  useEffect(() => {
    if (project) {
      setProjectName(project.name)
    }
  }, [project])

  
  useEffect(() => {
    return () => {
      
      const currentPath = window.location.pathname
      if (!currentPath.includes('/workspace')) {
        sessionStorage.removeItem('currentProjectId')
        sessionStorage.removeItem('projectInitialized')
      }
    }
  }, [])

  const handleNavigate = (page: 'dashboard' | 'workspace') => {
    router.push(page === 'dashboard' ? '/dashboard' : '/workspace')
  }
  
  const handleFileSelect = useCallback(async (filePath: string) => {
    setSelectedFile(filePath);
    const file = files.find(f => f.name === filePath);
    if (file) {
      await loadFileContent(file);
    }
  }, [files, loadFileContent]);

  const handleContentChange = useCallback((value: string | undefined) => {
    setEditorContent(value || '');
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
      if (isMeta && e.key === 'b') {
        e.preventDefault();
        setSidebarView(prev => prev === 'files' ? 'ai' : 'files');
      }
      if (isMeta && e.key === 'j') {
        e.preventDefault();
        setIsTerminalOpen(prev => !prev);
      }
      if (isMeta && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setSidebarView('ai');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveFile]);

  const handleDownload = useCallback(async () => {
    if (!currentProjectId) {
      toast.error('No project selected');
      return;
    }
    try {
      const auth = feathersClient.get('authentication');
      const token = auth?.accessToken;
      const response = await fetch('/api/projects/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ projectId: currentProjectId })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Download failed');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName || 'project'}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download project');
    }
  }, [currentProjectId, projectName]);

  const handleRunBackend = useCallback(async () => {
    if (!currentProjectId) {
      toast.error('No project selected');
      return;
    }

    setIsRunning(true);
    setIsTerminalOpen(true);

    try {
      const response = await fetch('/api/projects/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId: currentProjectId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start backend');
      }

      const result = await response.json();

      if (result.success) {
        
        toast.success('Backend setup instructions generated!', {
          description: result.project?.name ? `Project: ${result.project.name}` : undefined,
          duration: 5000,
        });

        
        console.log('=== Backend Setup Instructions ===');
        console.log(result.instructions.join('\n'));
        console.log('');
        console.log('Access Points:');
        console.log(`API: ${result.endpoints?.api}`);
        console.log(`Docs: ${result.endpoints?.docs}`);
      } else {
        toast.error('Failed to generate backend instructions');
      }
    } catch (error) {
      console.error('Failed to run backend:', error);
      toast.error('Failed to start backend');
    } finally {
      setIsRunning(false);
    }
  }, [currentProjectId]);
  
  if (projectLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Creating project...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Bar */}
      <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
        <nav className="flex items-center gap-1 text-sm">
          <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-md flex items-center justify-center mr-1">
            <Code2 className="w-3.5 h-3.5 text-white" />
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            Dashboard
          </button>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-gray-700 font-medium">{projectName.slice(0, 40)}</span>
          {selectedFile && activeView === 'code' && (
            <>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <span className="text-gray-900 font-semibold">{selectedFile}</span>
            </>
          )}
        </nav>
        
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setActiveView('code')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeView === 'code'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Code
          </button>
          <button
            onClick={() => setActiveView('api')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeView === 'api'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TestTube2 className="w-3.5 h-3.5" />
            API Testing
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleDownload}
            disabled={!currentProjectId || files.length === 0}
            size="sm"
            variant="outline"
            className="h-7 text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
          <UserMenu 
            currentPage="workspace" 
            onNavigate={handleNavigate}
            onLogout={logout}
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Sidebar - Files, Mocky, Versions */}
          <ResizablePanel defaultSize={25} minSize={15}>
            <div className="h-full border-r border-gray-200 bg-white flex flex-col">
              <div className="border-b border-gray-200 flex">
                {(['files', 'ai', 'versions'] as const).map(view => (
                  <button
                    key={view}
                    onClick={() => setSidebarView(view)}
                    className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      sidebarView === view
                        ? 'bg-white text-gray-900 border-b-2 border-black'
                        : 'text-gray-500 hover:text-gray-900 bg-gray-50'
                    }`}
                  >
                    {view === 'files' && <FolderTree className="w-3.5 h-3.5" />}
                    {view === 'ai' && <Bot className="w-3.5 h-3.5" />}
                    {view === 'versions' && <History className="w-3.5 h-3.5" />}
                    {view === 'files' ? 'Files' : view === 'ai' ? 'Mocky' : 'Versions'}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-hidden">
                {sidebarView === 'files' ? (
                  <div className="h-full overflow-y-auto px-3 py-3">
                    {fileTree.length > 0 ? (
                      <FileTree
                        data={fileTree}
                        onFileClick={handleFileSelect}
                        selectedFile={selectedFile}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500">No files generated yet</p>
                        <p className="text-xs text-gray-400 mt-1">Use Mocky to generate code</p>
                      </div>
                    )}
                  </div>
                ) : sidebarView === 'ai' ? (
                  <AiAgent
                    projectId={currentProjectId as string}
                    files={files}
                    selectedFile={selectedFile}
                    selectedFileContent={editorContent}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center py-8">
                      <History className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No snapshots yet</p>
                      <p className="text-xs text-gray-400 mt-1">Versions will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle className="w-1 bg-gray-200 hover:bg-blue-400 transition-colors cursor-col-resize" />
          {/* Main Content Area */}
          <ResizablePanel defaultSize={75} minSize={40}>
            <ResizablePanelGroup
              key={isTerminalOpen ? 'terminal-open' : 'terminal-closed'}
              direction="vertical"
              className="h-full"
            >
              <ResizablePanel defaultSize={isTerminalOpen ? 70 : 100} minSize={isTerminalOpen ? 50 : 30}>
                <div className="h-full flex flex-col overflow-hidden bg-gray-50">
                  {activeView === 'code' ? (
                    <>
                      {/* File Tab */}
                      <div className="border-b border-gray-200 px-4 py-2.5 bg-white flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                          <Code2 className="w-4 h-4" />
                          <span>{selectedFile}</span>
                          {hasUnsavedChanges && <span className="text-xs text-amber-500">● unsaved</span>}
                          {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                        </div>
                        <Button
                          onClick={handleRunBackend}
                          disabled={isRunning || !editorContent}
                          size="sm"
                          className="h-7 text-xs bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          {isRunning ? 'Running...' : 'Run Backend'}
                        </Button>
                      </div>
                      {/* Code Editor */}
                      <div className="flex-1 overflow-hidden bg-white">
                        {loadingContent ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                              <p className="text-sm text-gray-600">Loading file content...</p>
                            </div>
                          </div>
                        ) : selectedFileContent ? (
                          <MonacoEditor
                            value={editorContent}
                            fileName={selectedFile}
                            onChange={handleContentChange}
                            readOnly={false}
                            height="100%"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <Code2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                              <p className="text-sm text-gray-500">Select a file to view its content</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <TestPanel projectId={currentProjectId as string} />
                  )}
                </div>
              </ResizablePanel>
              {isTerminalOpen && (
                <>
                  <ResizableHandle className="h-1 bg-gray-200 hover:bg-blue-400 transition-colors cursor-row-resize" />
                  <ResizablePanel minSize={15} defaultSize={30}>
                    <Terminal
                      variant="panel"
                      isOpen={true}
                      onClose={() => setIsTerminalOpen(false)}
                      projectId={currentProjectId as string}
                    />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Terminal Toggle Button - Bottom Right */}
      <Button
        onClick={() => setIsTerminalOpen(prev => !prev)}
        className="fixed bottom-4 right-4 h-10 bg-black hover:bg-gray-800 text-white shadow-lg z-40"
      >
        <TerminalIcon className="w-4 h-4 mr-2" />
        {isTerminalOpen ? 'Hide Terminal' : 'Terminal'}
      </Button>

      {/* Status Bar */}
      <div className="h-6 bg-gray-100 border-t border-gray-200 flex items-center justify-between px-3 text-[11px] text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${
              project?.status === 'ready' ? 'bg-green-500' :
              project?.status === 'generating' ? 'bg-blue-500 animate-pulse' :
              project?.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
            }`} />
            {project?.status ?? 'no project'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>Model: {defaultAiModel}</span>
          <span>{files.length} files</span>
          {hasUnsavedChanges && <span className="text-amber-600">● Unsaved</span>}
        </div>
      </div>
    </div>
  );
}
