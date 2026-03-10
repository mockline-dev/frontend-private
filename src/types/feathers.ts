/**
 * Feathers.js Data Models
 * Based on the backend implementation plan
 */

// ============================================================================
// Project Types
// ============================================================================

export interface GenerationProgress {
    percentage: number; // 0-100
    currentStage: string;
    currentFile?: string;
    filesGenerated: number;
    totalFiles: number;
    startedAt?: number;
    completedAt?: number;
    errorMessage?: string;
}

export interface Project {
    _id: string;
    userId: string;
    name: string;
    description: string;
    framework: 'fast-api' | 'feathers';
    language: 'python' | 'typescript';
    model: string;
    status: 'initializing' | 'generating' | 'validating' | 'ready' | 'error';
    errorMessage?: string;
    jobId?: string;
    generationProgress?: GenerationProgress;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number;
}

export interface CreateProjectData {
    name: string;
    description: string;
    framework: 'fast-api' | 'feathers';
    language: 'python' | 'typescript';
    model?: string;
}

export interface UpdateProjectData {
    name?: string;
    description?: string;
    status?: Project['status'];
    errorMessage?: string;
    generationProgress?: Partial<GenerationProgress>;
}

// ============================================================================
// File Types
// ============================================================================

export interface ProjectFile {
    _id: string;
    projectId: string;
    messageId?: string;
    name: string;
    key: string; // R2 storage path
    fileType: string;
    size: number;
    currentVersion: number;
    createdAt: number;
    updatedAt: number;
}

export interface CreateFileData {
    projectId: string;
    messageId?: string;
    name: string;
    key: string;
    fileType: string;
    size: number;
    currentVersion?: number;
}

export interface UpdateFileData {
    size?: number;
    currentVersion?: number;
}

// ============================================================================
// Snapshot Types
// ============================================================================

export interface SnapshotFile {
    fileId: string;
    name: string;
    key: string;
    r2SnapshotKey: string;
    size: number;
    fileType: string;
}

export interface Snapshot {
    _id: string;
    projectId: string;
    version: number;
    label: string;
    trigger: 'auto-generation' | 'auto-ai-edit' | 'manual';
    r2Prefix: string;
    files: SnapshotFile[];
    totalSize: number;
    fileCount: number;
    createdAt: number;
}

export interface CreateSnapshotData {
    projectId: string;
    label: string;
    trigger: 'auto-generation' | 'auto-ai-edit' | 'manual';
}

export interface RollbackResult {
    success: boolean;
    restoredVersion: number;
    projectId: string;
    fileCount: number;
    snapshotId?: string;
}

// ============================================================================
// Message Types
// ============================================================================

export interface Message {
    _id: string;
    projectId: string;
    role: 'user' | 'system' | 'assistant';
    type: 'text' | 'file';
    content: string;
    tokens?: number;
    status?: string;
    createdAt: number;
    updatedAt: number;
}

export interface CreateMessageData {
    projectId: string;
    role: 'user' | 'system' | 'assistant';
    type?: 'text' | 'file';
    content: string;
    tokens?: number;
    status?: string;
}

export interface UpdateMessageData {
    content?: string;
    tokens?: number;
    status?: string;
}

export interface ConversationHistoryItem {
    role: 'user' | 'system' | 'assistant';
    content: string;
}

// ============================================================================
// AI Stream Types
// ============================================================================

export interface AIStreamChunk {
    projectId: string;
    content: string;
    fullContent?: string;
    done: boolean;
    messageId?: string;
}

export interface AIFileUpdate {
    fileId?: string;
    name: string;
    action: 'create' | 'modify' | 'delete';
    description: string;
    content?: string;
    diff?: string;
}

export interface AIStreamFileUpdates {
    projectId: string;
    updates: AIFileUpdate[];
    snapshotId?: string;
}

export interface AIStreamContext {
    files?: string[];
    selectedFile?: string;
    selectedContent?: string;
    [key: string]: unknown;
}

export interface StreamAIRequest {
    projectId: string;
    message: string;
    conversationHistory?: ConversationHistoryItem[];
    context?: AIStreamContext;
}

export interface StreamAIResponse {
    success: boolean;
    messageId?: string;
}

// ============================================================================
// Common Query Types
// ============================================================================

export interface QueryParams {
    $sort?: Record<string, 1 | -1>;
    $limit?: number;
    $skip?: number;
    [key: string]: unknown;
}

export interface ProjectQuery extends QueryParams {
    userId?: string;
    status?: Project['status'];
}

export interface FileQuery extends QueryParams {
    projectId?: string;
    messageId?: string;
}

export interface MessageQuery extends QueryParams {
    projectId?: string;
    role?: Message['role'];
}

export interface SnapshotQuery extends QueryParams {
    projectId?: string;
    version?: number;
}

// ============================================================================
// Event Types
// ============================================================================

export type ServiceEvent = 'created' | 'updated' | 'patched' | 'removed';

export interface ProgressEventData {
    projectId: string;
    status: Project['status'];
    progress: GenerationProgress;
}

export interface GenerationProgressEventData {
    stage: string;
    percentage: number;
    currentFile?: string;
}
