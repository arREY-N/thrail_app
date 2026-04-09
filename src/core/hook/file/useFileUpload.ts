import { useFilesStore } from '@/src/core/stores/fileStore';
import { useState } from 'react';

export default function useFileUpload(){

    const [validId, setValidId] = useState<string | null>();
    const [medicalCertificate, setMedicalCertificate] = useState<string | null>();
    const [localError, setLocalError] = useState<string | null>(null);
    
    const uploadDocument = useFilesStore(s => s.uploadDocument);

    const pickValidId = async () => {
        try {
            const validIdUrl = await uploadDocument();
            
            if (!validIdUrl) {
                throw new Error('Failed to upload valid ID');
            }

            setValidId(validIdUrl);
        } catch (error) {
            if (error instanceof Error) {
                setLocalError(error.message);
            } else {
                console.error('Unexpected error:', error);
            }        
        }
    }

    const pickMedicalCertificate = async () => {
        try {
            const medicalCertificateUrl = await uploadDocument();
            
            if (!medicalCertificateUrl) {
                throw new Error('Failed to upload medical certificate');
            }

            setMedicalCertificate(medicalCertificateUrl);
        } catch (error) {
            if (error instanceof Error) {
                setLocalError(error.message);
            } else {
                console.error('Unexpected error:', error);
            }        
        }
    }

    return {
        localError,
        validId,
        medicalCertificate,
        pickValidId,
        pickMedicalCertificate,
    }
}