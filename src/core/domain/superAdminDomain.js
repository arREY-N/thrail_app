import { getFunctions } from "firebase/functions";

export const createBusiness = async ({email, businessName}) => {
    const functions = getFunctions();

    const createBusiness = httpsCallable(functions, 'createBusiness');

    try{
        const result = await createBusiness({
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