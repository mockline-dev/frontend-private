export const apiServices = {
    // Core services
    users: 'users' as const,
    projects: 'projects' as const,
    files: 'files' as const,
    snapshots: 'snapshots' as const,
    uploads: 'uploads' as const,
    messages: 'messages' as const,
    sessions: 'sessions' as const,

    // File streaming service
    fileStream: 'file-stream' as const,

    // API test proxy
    apiTest: 'api-test' as const,
} as const;
