import { getFunctions, httpsCallable } from "firebase/functions";

export const createBusiness = async ({appId, email, businessName}) => {
    const functions = getFunctions();

    const createBusiness = httpsCallable(functions, 'createBusiness');

    try{
        const result = await createBusiness({
            appId,
            email,
            businessName
        });

        const data = result.data;

        console.log(`Business Account created 
            \nName: ${data.businessName}
            \nBusiness Email: ${data.businessEmail}
            \nTemporary Password: ${data.tempPass}`);
        
    } catch (err) {
        console.error('Failed creating business account', err);
    }
}