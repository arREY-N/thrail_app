// import WriteComponent from "@/src/components/CustomWriteComponents";
// import { OFFER_CONSTANTS } from '@/src/constants/offers';
// import { useBusinessesStore } from "@/src/core/stores/businessesStore";
// import { useOffersStore } from "@/src/core/stores/offersStore";
// import { useTrailsStore } from "@/src/core/stores/trailsStore";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { useEffect } from "react";
// export default function writeOffer(){
//     const { id } = useLocalSearchParams();
//     const router = useRouter();
    
//     const system = useOffersStore(s => s.error);

//     const trails = useTrailsStore(s => s.trails);

//     const addOffer = useOffersStore(s => s.addOffer);
//     const offer = useOffersStore(s => s.offer);
//     const resetOffer = useOffersStore(s => s.resetOffer);
//     const writeOffer = useOffersStore(s => s.writeOffer);
//     const deleteOffer = useOffersStore(s => s.deleteOffer);
//     const isLoading = useOffersStore(s => s.isLoading);
//     const editProperty = useOffersStore(s => s.editProperty);
//     const businessAccount = useBusinessesStore(s => s.businessAccount);

//     const offerInformation = OFFER_CONSTANTS.OFFER_INFORMATION;

//     useEffect(()=> {
//         resetOffer();
//         if(id !== 0) writeOffer(id);    
//     }, [id]);

//     console.log('refreshed');
//     const onSubmitOfferPress = async () => {
//         const id = await addOffer(businessAccount);

//         if(!id) return;
        
//         console.log('Offer created with id: ', id);
//         router.back();    
//     }

//     const onDeleteOfferPress = async () => {
//         const businessId = businessAccount?.id;
//         if(id !== null) await deleteOffer(id, businessId);
//         router.back();
//     }

//     const onEditProperty = (property) => {
//         const { value, type } = property;
//         let finalValue = value;

//         if(type === 'object-select'){
//             const object = trails.find(t => t.general.name === property.value);

//             finalValue = {
//                 ...object.general,
//                 id: object.id,
//             }
            
//         }

//         editProperty({
//             ...property,
//             value: finalValue
//         })
//     }

//     let options = [];
    
//     trails.map(t => options.push(t.general.name));

//     return(
//         <WriteComponent
//             informationSet={offerInformation}
//             object={offer}
//             options={options}
//             system={system}
//             isLoading={isLoading}
//             onSubmit={onSubmitOfferPress}
//             onDelete={onDeleteOfferPress}
//             onEditProperty={onEditProperty}
//         />
//     )
// }