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

// ============================================================================
// Architecture Types
// ============================================================================

export interface ArchService {
    name: string;
    description?: string;
    routes: string[];
    methods?: Array<{
        name: string;
        httpMethod?: string;
        path?: string;
        params?: string[];
        returnType?: string;
    }>;
    dependencies?: string[];
}

export interface ArchModel {
    name: string;
    fields: Array<{ name: string; type: string; required: boolean; indexed?: boolean; unique?: boolean }>;
}

export interface ArchRelation {
    from: string;
    to: string;
    type: 'one-to-many' | 'many-to-many' | 'one-to-one';
}

export interface ArchRoute {
    method: string;
    path: string;
    service: string;
}

export interface Architecture {
    _id: string;
    projectId: string;
    services: ArchService[];
    models: ArchModel[];
    relations: ArchRelation[];
    routes: ArchRoute[];
    serviceDependencies?: Array<{ from: string; to: string }>;
    updatedAt: number;
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

export interface AIAgentStepEvent {
    projectId: string;
    type: 'thinking' | 'tool_call' | 'tool_result' | 'status';
    title: string;
    detail?: string;
    createdAt: number;
}

export interface AIWritePreviewEvent {
    projectId: string;
    filename: string;
    action: 'create' | 'modify' | 'delete';
    oldContent?: string;
    newContent?: string;
    description?: string;
}

/** Emitted by the new backend instead of write-preview. Includes server-resolved preview content. */
export interface AIFileDiffEvent {
    projectId: string;
    updateId: string;
    filename: string;
    action: 'create' | 'modify' | 'delete';
    /** Original file content (for diff view) */
    oldContent?: string;
    /** Resolved new content (S/R already applied for modify actions) */
    newContent: string;
    description?: string;
}

/** Emitted when the backend has written a file update to storage. */
export interface AIFileAppliedEvent {
    projectId: string;
    updateId: string;
    filename: string;
    action: 'create' | 'modify' | 'delete';
}

/** Emitted when a pending file update has been rejected server-side. */
export interface AIFileRejectedEvent {
    projectId: string;
    updateId: string;
    filename: string;
}

export interface AIStreamPatchRequest {
    projectId: string;
    action: 'apply' | 'accept' | 'reject' | 'accept-all';
    updateId?: string;
}

export interface AIContextFileTreeEntry {
    path: string;
    size?: number;
    fileType?: string;
}

export interface AIContextSelectionRange {
    startLine: number;
    endLine: number;
}

export interface AIStreamContext {
    files?: string[];
    fileTree?: AIContextFileTreeEntry[];
    selectedFile?: string;
    selectedContent?: string;
    selectedRange?: AIContextSelectionRange;
    pinnedFiles?: string[];
    allowedEditFiles?: string[];
    [key: string]: unknown;
}

export interface StreamAIRequest {
    projectId: string;
    message: string;
    conversationHistory?: ConversationHistoryItem[];
    context?: AIStreamContext;
    model?: string;
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
