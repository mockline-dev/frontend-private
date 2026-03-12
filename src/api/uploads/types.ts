export interface Upload {
    uploadId?: string;
    key: string;
    success?: boolean;
}

export interface UploadCreateData {
    key: string;
    content: string;
    contentType: string;
    projectId?: string;
}

export interface UploadUpdateData {
    partNumber: number;
    uploadId: string;
    key: string;
    content: Buffer;
}

export interface UploadCompleteData {
    uploadId: string;
    key: string;
    parts: {
        ETag: string;
        PartNumber: number;
    }[];
    fileType: string;
}
