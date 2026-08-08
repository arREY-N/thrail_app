import { FileRepository } from "@/src/core/repositories/fileRepository";
import { useAuthStore } from "@/src/core/stores/authStores/authStore";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface FileState {
    uploadDocument(): Promise<string>;
    capturePhoto(): Promise<string>;
    selectPhoto(): Promise<string>;

    error: string | null;
}

export const useFilesStore = create<FileState>()(immer((set, get) => ({
    error: null,

    uploadDocument: async (): Promise<string> => { 
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*', 
                copyToCacheDirectory: true,
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
    },

    capturePhoto: async (): Promise<string> => {
        try {
            const { profile } = useAuthStore.getState();

            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if(!profile) {
                throw new Error('User profile not found. Please log in again.');
            }

            if (status !== 'granted') {
                throw new Error('Permission to access camera is required!');
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: false,
                quality: 0.4,
                base64: false,
            });

            if(result.canceled) {
                throw new Error('Photo capture canceled');
            }

            const { uri, fileName, mimeType, fileSize: size } = result.assets[0];

            const selectedFile = { 
                uri, 
                name: fileName ?? `${profile.firstname}_photo_${Date.now()}.jpg`,
                mimeType, 
                size 
            };

            const downloadURL = await FileRepository.uploadDocuments(selectedFile);
            
            if (!downloadURL) {
                throw new Error('Failed to upload document');
            }

            return downloadURL;
        } catch (error) {
            throw error instanceof Error ? error : new Error('An unexpected error occurred while requesting permissions.');
        }
    },

    selectPhoto: async (): Promise<string> => {
        try {
            const { profile } = useAuthStore.getState();

            if (!profile) {
                throw new Error('User profile not found. Please log in again.');
            }

            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                throw new Error('Permission to access media library is required!');
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
            });

            if (result.canceled) {
                throw new Error('Photo selection canceled');
            }

            const { uri, fileName, mimeType, fileSize: size } = result.assets[0];

            const selectedFile = { 
                uri, 
                name: fileName ?? `${profile.firstname}_photo_${Date.now()}.jpg`,
                mimeType: mimeType ?? 'image/jpeg', 
                size 
            };

            const downloadURL = await FileRepository.uploadDocuments(selectedFile);
            
            if (!downloadURL) {
                throw new Error('Failed to upload document');
            }

            return downloadURL;
        } catch (error) {
            throw error instanceof Error ? error : new Error('An unexpected error occurred while selecting photo.');
        }
    }
})))