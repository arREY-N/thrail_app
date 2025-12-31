import { createBusinessApplication } from '@/src/core/repositories/businessRepository';

export const applyBusiness = async ({
    email, 
    businessName, 
    businessAddress
}) => {
    if(!email || !businessName || !businessAddress) return new Error('Please fill up all information');

    try {
        const applicationId = await createBusinessApplication({
            email, 
            businessName, 
            businessAddress
        });

        return applicationId;
    } catch (err) {
        throw new Error(err);
    }
} 