// import { getFunctions, httpsCallable } from "firebase/functions";

// export const createBusiness = async (businessData) => {
//     const functions = getFunctions();

//     const createBusiness = httpsCallable(functions, 'createBusiness');

//     try{
//         const result = await createBusiness(businessData);
//         const data = result.data;
//         console.log(`Business Account created 
//             \nName: ${data.businessName}
//             \nID: ${data.businessId}`);
        
//     } catch (err) {
//         console.error('Failed creating business account', err);
//     }
// }