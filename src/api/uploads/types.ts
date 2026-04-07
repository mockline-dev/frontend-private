// Initiate response — returned by POST /uploads
export interface Upload {
    _id: string;
    uri: string;        // R2 key / path
    contentType: string;
    uploadId: string;   // multipart upload ID for subsequent steps
}

// Step 1: POST /uploads — initiate multipart upload
export interface UploadCreateData {
    key: string;        // R2 object key
    contentType: string;
}

// Step 2: PATCH /uploads/<any> — upload a single part
export interface UploadUpdateData {
    partNumber: number;
    uploadId: string;
    key: string;
    content: Buffer;
}

// Response from Step 2
export interface UploadPartResponse {
    ETag: string;
}

// Step 3: PUT /uploads/<any> — complete multipart upload
export interface UploadCompleteData {
    uploadId: string;
    key: string;
    parts: {
        ETag: string;
        PartNumber: number;
    }[];
}
