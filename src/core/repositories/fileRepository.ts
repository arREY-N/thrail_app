import { storage } from '@/src/core/config/Firebase';
import { logger } from '@/src/core/utility/errorFormatter';
import { getAuth } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes, UploadResult } from 'firebase/storage';

export type SelectedFile = {
    uri: string;
    name: string;
    mimeType?: string;
    size?: number;
}

// Strict allowlist: extension -> canonical MIME type. Must stay in sync with storage.rules.
const ALLOWED_MIME_TYPES: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    pdf: 'application/pdf',
};

const ALLOWED_MIME_VALUES = new Set(Object.values(ALLOWED_MIME_TYPES));

/**
 * Resolves the contentType to send to Firebase Storage.
 * React Native's Blob on Android has an empty `type`, so it must be set explicitly.
 * Never falls back to a default: unknown types are rejected.
 */
const resolveContentType = (file: SelectedFile): string => {
    const mime = file.mimeType?.toLowerCase();
    if (mime && ALLOWED_MIME_VALUES.has(mime)) return mime;

    const extension = file.name?.split('.').pop()?.toLowerCase();
    if (extension && ALLOWED_MIME_TYPES[extension]) return ALLOWED_MIME_TYPES[extension];

    throw new Error(`Unsupported file type: ${file.name}`);
};

class FileRepositoryImpl {
    async uploadDocuments(file: SelectedFile): Promise<string> {
        if (!file) throw new Error('No file provided for upload');
        const auth = getAuth();
        const user = auth.currentUser;

        try {
            if (!user)
                throw new Error('User must be authenticated to upload documents');

            // Validate before reading the file so unsupported types fail fast
            const contentType = resolveContentType(file);

            const response = await fetch(file.uri);

            const blob: Blob = await response.blob();

            logger('fileRepository', 'File data: ', file);
            const storageRef = ref(storage, `users/${user.uid}/documents/${Date.now()}_${file.name}`);

            const snapshot: UploadResult = await uploadBytes(storageRef, blob, { contentType })
            logger('fileRepository', 'snapshot: ', snapshot)

            const downloadURL = await getDownloadURL(snapshot.ref);
            logger('fileRepository', 'downloadUrl: ', downloadURL)

            if (!downloadURL)
                throw new Error('Failed to retrieve download URL after upload');


            return downloadURL;
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error('An error occurred while uploading document');
        }
    }

    async uploadBusinessFile(businessId: string, folder: string, file: SelectedFile): Promise<string> {
        if (!file) throw new Error('No file provided for upload');
        const auth = getAuth();
        const user = auth.currentUser;

        try {
            if (!user)
                throw new Error('User must be authenticated to upload files');

            const contentType = resolveContentType(file);
            const response = await fetch(file.uri);
            const blob: Blob = await response.blob();

            const storageRef = ref(storage, `businesses/${businessId}/${folder}/${Date.now()}_${file.name}`);
            const snapshot: UploadResult = await uploadBytes(storageRef, blob, { contentType });
            const downloadURL = await getDownloadURL(snapshot.ref);

            if (!downloadURL)
                throw new Error('Failed to retrieve download URL after upload');

            return downloadURL;
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error('An error occurred while uploading business file');
        }
    }
}

export const FileRepository = new FileRepositoryImpl();