/**
 * Feathers.js Data Models
 * Based on the backend API spec (alpha/e2e-generation-pipeline branch)
 */

// ============================================================================
// User Types
// ============================================================================

export interface User {
    _id: string;
    firebaseUid: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: number;
    updatedAt: number;
}

export interface CreateUserData {
    firebaseUid: string;
    firstName: string;
    lastName: string;
    email: string;
}

export interface UserQuery extends QueryParams {
    email?: string;
    firebaseUid?: string;
}

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
    failedAt?: number;
    errorMessage?: string;
    warnings?: string[];
    errorType?: string;
    retryAttempts?: number;
    validationResults?: {
        passCount: number;
        failCount: number;
        failedFiles: string[];
    };
}

export interface Project {
    _id: string;
    userId: string;
    name: string;
    description: string;
    framework: 'fast-api' | 'feathers';
    language: 'python' | 'typescript';
    model: string;
    status: 'initializing' | 'generating' | 'validating' | 'ready' | 'running' | 'error';
    errorMessage?: string;
    errorType?: string;
    retryAttempts?: number;
    jobId?: string;
    architectureId?: string;
    generationProgress?: GenerationProgress;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number;
}

export interface CreateProjectData {
    userId: string;
    name: string;
    description: string;
    framework: 'fast-api' | 'feathers';
    language: 'python' | 'typescript';
    model?: string;
    status: 'initializing' | 'generating' | 'validating' | 'ready' | 'running' | 'error';
    jobId?: string;
    architectureId?: string;
    generationProgress?: Partial<GenerationProgress>;
}

export interface UpdateProjectData {
    name?: string;
    description?: string;
    status?: Project['status'];
    errorMessage?: string;
    jobId?: string;
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

export interface MessageSandboxResult {
    success: boolean;
    durationMs: number;
}

export interface MessageMetadata {
    usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
    sandboxResult?: MessageSandboxResult;
    filesGenerated?: string[];   // file paths persisted to R2
    enhancedPrompt?: string;
    [key: string]: unknown;
}

export interface Message {
    _id: string;
    projectId: string;
    role: 'user' | 'system' | 'assistant';
    content: string;
    intent?: string;
    model?: string;
    metadata?: MessageMetadata;
    createdAt: number;
    updatedAt: number;
}

export interface CreateMessageData {
    projectId: string;
    role: 'user' | 'system' | 'assistant';
    content: string;
    intent?: string;
    model?: string;
    metadata?: MessageMetadata;
}

export interface UpdateMessageData {
    content?: string;
    tokens?: number;
    status?: string;
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

// ============================================================================
// Session Types
// ============================================================================

export interface Session {
    _id: string;
    projectId: string;
    userId: string;
    status: 'starting' | 'running' | 'stopped' | 'error';
    containerId?: string;
    proxyUrl?: string;
    port?: number;
    language: 'python' | 'typescript';
    startedAt?: number;
    stoppedAt?: number;
    errorMessage?: string;
    serverLog?: string;
    createdAt: number;
    updatedAt: number;
}

export interface CreateSessionData {
    projectId: string;
    userId: string;
    language: 'python' | 'typescript';
}

export interface SessionQuery extends QueryParams {
    projectId?: string;
    userId?: string;
    status?: Session['status'];
}

// ============================================================================
// Orchestration Event Types
// Payloads match backend alpha/e2e-generation-pipeline branch
// ============================================================================

/** Fired when orchestration pipeline starts */
export interface OrchestrationStartedEvent {
    projectId: string;
    userId: string;
}

/** Fired when intent is classified */
export interface OrchestrationIntentEvent {
    intent: string;
    confidence: number;
    entities: Record<string, unknown>;
}

/** Fired when prompt has been enhanced */
export interface OrchestrationEnhancedEvent {
    originalLength: number;
    enhancedLength: number;
}

/** Fired when RAG context is retrieved */
export interface OrchestrationContextEvent {
    chunksFound: number;
    tokensUsed: number;
}

/** Streaming LLM token */
export interface OrchestrationTokenEvent {
    token: string;
}

export interface OrchestrationUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

/** Fired when generation completes */
export interface OrchestrationCompletedEvent {
    intent: string;
    contentLength: number;
    usage: OrchestrationUsage;
}

/** Fired when pipeline encounters a fatal error */
export interface OrchestrationErrorEvent {
    error: string;
}

/** Fired on agentic sandbox retry attempt */
export interface SandboxRetryEvent {
    attempt: number;
    error: string;
}

/** Fired with sandbox execution result */
export interface SandboxResultEvent {
    success: boolean;
    syntaxValid: boolean;
    compilationOutput?: string;
    testOutput?: string;
    durationMs?: number;
}

/** Fired when files are persisted to R2 */
export interface FilesPersistedEvent {
    fileIds: string[];
    snapshotId?: string;
    uploadedCount: number;
    filePaths: string[];
}

/** Fired when indexing completes */
export interface IndexingCompletedEvent {
    projectId: string;
    indexed: number;
    removed: number;
    changes: {
        added: number;
        modified: number;
        deleted: number;
    };
}

/** Fired when indexing fails */
export interface IndexingErrorEvent {
    projectId: string;
    error: string;
}

// ============================================================================
// Terminal Streaming Event Types
// Emitted by sessions service during dep install, server start, and log tail
// ============================================================================

export type TerminalPhase = 'deps' | 'start' | 'server';

/** Fired when the sandbox process writes to stdout */
export interface TerminalStdoutEvent {
    projectId?: string;
    sessionId?: string;
    phase: TerminalPhase;
    text: string;
}

/** Fired when the sandbox process writes to stderr */
export interface TerminalStderrEvent {
    projectId?: string;
    sessionId?: string;
    phase: TerminalPhase;
    text: string;
}
