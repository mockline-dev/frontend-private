
import { createUpload } from '@/api/uploads/createUpload';
import { patchUpload } from '@/api/uploads/patchUpload';
import { updateUpload } from '@/api/uploads/updateUpload';
import { hashFileName } from '@/services/hashFileName';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export default async function uploadFileMultipart(file: File, fileObject: File, setUploadProgress?: (progress: number) => void): Promise<string | null> {
    try {
        const hashedFilename = await hashFileName(file.name);
        const initResponse = await createUpload({
            key: hashedFilename,
            contentType: file.type
        });
        const { uploadId, uri: key } = initResponse;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const parts = [];

        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(file.size, start + CHUNK_SIZE);
            const chunk = file.slice(start, end);

            const reader = new FileReader();
            const chunkData = await new Promise<ArrayBuffer>((resolve) => {
                reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
                reader.readAsArrayBuffer(chunk);
            });

            const partResponse = await patchUpload('', {
                partNumber: i + 1,
                uploadId,
                key,
                content: Buffer.from(chunkData)
            });
            const responseETag =
                Array.isArray(partResponse) && partResponse.length > 0
                    ? (partResponse[0] as unknown as { ETag: string; PartNumber: number })?.ETag || ''
                    : (partResponse as unknown as { ETag: string; PartNumber: number })?.ETag || '';

            parts.push({
                ETag: responseETag,
                PartNumber: i + 1
            });

            if (setUploadProgress) {
                setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
            }
        }

        const completeResponse = await updateUpload('', {
            uploadId,
            key,
            parts
        });
        return (completeResponse as unknown as string) || null;
    } catch (error) {
        throw error;
    }
}
