import { storage } from '@/src/core/config/Firebase';
import { getAuth } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes, UploadResult } from 'firebase/storage';

export type SelectedFile = {
    uri: string;
    name: string;
    mimeType?: string;
    size?: number;
}

class FileRepositoryImpl{
    async uploadDocuments(file: SelectedFile): Promise<string> {
        if(!file) throw new Error('No file provided for upload');
        const auth = getAuth();
        const user = auth.currentUser;
        
        try{
            if(!user) 
                throw new Error('User must be authenticated to upload documents');

            const response = await fetch(file.uri);
            
            const blob: Blob = await response.blob();

            const storageRef = ref(storage, `users/${user.uid}/documents/${Date.now()}_${file.name}`);
            
            const snapshot: UploadResult = await uploadBytes(storageRef, blob)

            const downloadURL = await getDownloadURL(snapshot.ref);

            if(!downloadURL) 
                throw new Error('Failed to retrieve download URL after upload');

            console.log('Document uploaded successfully. Download URL:', downloadURL);
            
            return downloadURL;
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('An error occurred while uploading document');
        }
    }
}

export const FileRepository = new FileRepositoryImpl();