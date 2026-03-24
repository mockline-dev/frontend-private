export interface EditorTab {
    id: string;
    filePath: string;
    fileName: string;
    isDirty: boolean;
}

export type ActiveView = 'code' | 'api' | 'architecture';

export type SidebarView = 'files' | 'ai' | 'versions';

export interface FileNode {
    name: string;
    type: 'file' | 'folder';
    children?: FileNode[];
    path: string;
    fileId?: string;
    key?: string;
}

export interface CursorPosition {
    line: number;
    col: number;
}
