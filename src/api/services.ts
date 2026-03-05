export const apiServices = {
    // Core services
    users: 'users' as const,
    projects: 'projects' as const,
    files: 'files' as const,
    uploads: 'uploads' as const,
    media: 'media' as const,
    messages: 'messages' as const,
    
    // AI services
    aiModels: 'ai-models' as const,
    aiService: 'ai-service' as const,
    
    // File streaming service
    fileStream: 'file-stream' as const
} as const;
