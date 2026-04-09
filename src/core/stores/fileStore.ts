import { FileRepository } from "@/src/core/repositories/fileRepository";
import * as DocumentPicker from 'expo-document-picker';
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";


export interface FileState {
    uploadDocument(): Promise<string>;
}

export const useFilesStore = create<FileState>()(immer((set, get) => ({
    uploadDocument: async (): Promise<string> => { 
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*', // Allow all file types
                copyToCacheDirectory: true, // Ensure the file is copied to a cache directory
            });

            if (!result.canceled) {
                const { uri, name, mimeType, size } = result.assets[0];

                const selectedFile = { uri, name, mimeType, size };

                const downloadURL = await FileRepository.uploadDocuments(selectedFile);
                
                if (!downloadURL) {
                    throw new Error('Failed to upload document');
                }

                return downloadURL;
            } else {
                console.log('Document selection canceled.');
                throw new Error('Document selection canceled');
            }
        } catch (err) {
            console.error('Error uploading document:', err);
            throw err instanceof Error ? err : new Error('Failed to upload document');
        }
    }
})))