export const apiServices = {
    // Core services
    users: 'users' as const,
    projects: 'projects' as const,
    files: 'files' as const,
    snapshots: 'snapshots' as const,
    uploads: 'uploads' as const,
    media: 'media' as const,
    messages: 'messages' as const,
    sessions: 'sessions' as const,

    // AI services
    aiModels: 'ai-models' as const,
    aiService: 'ai-service' as const,
    aiStream: 'ai-stream' as const,
    validatePrompt: 'validate-prompt' as const,
    serverMonitor: 'server-monitor' as const,

    // File streaming service
    fileStream: 'file-stream' as const,
    enhancePrompt: 'enhance-prompt' as const,
    inferProjectMeta: 'infer-project-meta' as const,

    // Architecture service
    architecture: 'architecture' as const,

    // API test proxy
    apiTest: 'api-test' as const
} as const;
