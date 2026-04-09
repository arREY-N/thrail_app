import { useFilesStore } from '@/src/core/stores/fileStore';
import { useState } from 'react';

export default function useFileUpload(){

    const [validId, setValidId] = useState<string | null>();
    const [medicalCertificate, setMedicalCertificate] = useState<string | null>();
    const [localError, setLocalError] = useState<string | null>(null);
    const [bir, setBIR] = useState<string | null>(null);
    const [dti, setDTI] = useState<string | null>(null);
    const [denr, setDENR] = useState<string | null>(null);
    
    const uploadDocument = useFilesStore(s => s.uploadDocument);

    /**
     * Use to pick a document and upload it, then set the corresponding state with the uploaded document URL.
     * @param document: Possible values include 'validId', 'medicalCertificate', 'bir', 'dti', 'denr'.
     */
    const pickDocument = async (document: 'validId' | 'medicalCertificate' | 'bir' | 'dti' | 'denr') => {
        try {
            const documentUrl = await uploadDocument();
            if (!documentUrl) {
                throw new Error(`Failed to upload ${document}`);
            }
            switch (document) {
                case 'validId':
                    setValidId(documentUrl);
                    break;
                case 'medicalCertificate':
                    setMedicalCertificate(documentUrl);
                    break;
                case 'bir':
                    setBIR(documentUrl);
                    break;
                case 'dti':

                    setDTI(documentUrl);
                    break;
                case 'denr':
                    setDENR(documentUrl);
                    break;
            }
        } catch (error) {
            if (error instanceof Error) {
                setLocalError(error.message);
            }
            else {
                console.error('Unexpected error:', error);
            }
        }
    }

    return {
        localError,
        validId,
        medicalCertificate,
        bir,
        dti,
        denr,
        pickDocument,
    }
}