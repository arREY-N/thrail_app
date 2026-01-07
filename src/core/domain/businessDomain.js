import { createBusinessApplication } from '@/src/core/repositories/businessRepository';

export const applyBusiness = async (businessData) => {
    console.log('Data: ', businessData ?? null);
    
    try {
        if(!businessData.email || !businessData.businessName || !businessData.businessAddress || !businessData.province || !businessData.userId) 
            throw new Error('Please fill up all information');
        
        const applicationId = await createBusinessApplication(businessData);
                
        return applicationId;
    } catch (err) {
        throw new Error(err);
    }
} 