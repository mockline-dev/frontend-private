import type { ProjectFile } from '@/types/feathers';
import type { FileNode } from '@/types/workspace';

export function getDisplayPath(file: ProjectFile): string {
    const key = file.key || '';
    const marker = '/';
    const projectsPrefix = 'projects/';

    if (key.startsWith(projectsPrefix)) {
        const firstSlashAfterProjectId = key.indexOf(marker, projectsPrefix.length);
        if (firstSlashAfterProjectId !== -1 && firstSlashAfterProjectId + 1 < key.length) {
            return key.slice(firstSlashAfterProjectId + 1);
        }
    }

    return file.name;
}

function sortTreeNodes(nodes: FileNode[]) {
    nodes.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });

    for (const node of nodes) {
        if (node.children?.length) {
            sortTreeNodes(node.children);
        }
    }
}

export function buildFileTree(files: ProjectFile[]): FileNode[] {
    const tree: FileNode[] = [];
    const pathMap = new Map<string, FileNode>();
    const sorted = [...files].sort((a, b) => getDisplayPath(a).localeCompare(getDisplayPath(b)));

    for (const file of sorted) {
        const displayPath = getDisplayPath(file);
        const parts = displayPath.split('/');
        let currentPath = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!part) continue;
            const isLast = i === parts.length - 1;
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            if (!pathMap.has(currentPath)) {
                const node: FileNode = isLast
                    ? { name: part, type: 'file', path: currentPath, fileId: file._id, key: file.key }
                    : { name: part, type: 'folder', path: currentPath, children: [] };

                pathMap.set(currentPath, node);

                if (i === 0) {
                    tree.push(node);
                } else {
                    const parentPath = parts.slice(0, i).join('/');
                    pathMap.get(parentPath)?.children?.push(node);
                }
            }
        }
    }

    sortTreeNodes(tree);

    return tree;
}

export function flattenFileTree(nodes: FileNode[]): FileNode[] {
    const result: FileNode[] = [];
    for (const node of nodes) {
        if (node.type === 'file') {
            result.push(node);
        }
        if (node.children) {
            result.push(...flattenFileTree(node.children));
        }
    }
    return result;
}
