import { useRouter } from 'expo-router';
import { useState } from 'react';

import BusAppScreen from '../../features/Profile/screens/BusAppScreen';

import { useApplicationsStore } from '@/src/core/stores/applicationsStore';
import { useAuthStore } from '@/src/core/stores/authStore';

export default function apply(){
    const router = useRouter();
    const [system, setSystem] = useState(null);
    const profile = useAuthStore((state) => state.profile);

    const provinces = ['Cavite', 'Laguna', 'Batangas', 'Rizal', 'Quezon'];
    const createApplication = useApplicationsStore((state) => state.createApplication);
    const error = useApplicationsStore((state) => state.error);

    const onApplyPress = async (businessData) => {
        setSystem(null);
        
        try{           
            const appId = await createApplication({
                ...businessData,
                userId: profile.id, 
            });

            setSystem(`Application ${appId} sent`);            
        } catch (err) {
            setSystem(error ? error.message : err.message );
        }
    }

    const onBackPress = () => {
        router.back();
    }

    return (
        <BusAppScreen
            system={system}
            provinces={provinces}
            onApplyPress={onApplyPress}
            onBackPress={onBackPress}
        />
    )
}

// const ApplyScreen = ({
//     system,
//     provinces,
//     onApplyPress,
//     onBackPress
// }) => {
    
//     return (
//         <BusAppScreen
//             system={system}
//             provinces={provinces}
//             onApplyPress={onApplyPress}
//             onBackPress={onBackPress}
//         />
//     )
// }

// const ApplyScreen = ({
//     system,
//     provinces,
//     onApplyPress
// }) => {
//     const [email, setEmail] = useState('');
//     const [businessName, setBusinessName] = useState('');
//     const [businessAddress, setBusinessAddress] = useState('');
//     const [province, setProvince] = useState('');
    
//     return (
//         <ScrollView>
//             <Text>Business Application Screen</Text>
//             {
//                 system && <Text>{system}</Text>
//             }
//             <CustomTextInput
//                 placeholder="Email"
//                 value={email}
//                 onChangeText={setEmail}
//                 keyboardType="email-address"
//                 autoCapitalize="none"
//             />

//             <CustomTextInput
//                 placeholder="Business Name"
//                 value={businessName}
//                 onChangeText={setBusinessName}
//                 autoCapitalize="none"
//             />

//             <CustomTextInput
//                 placeholder="Business Address"
//                 value={businessAddress}
//                 onChangeText={setBusinessAddress}
//                 autoCapitalize="none"
//             />

//             <CustomTextInput
//                 placeholder="Business Province"
//                 value={province}
//                 onChangeText={null}
//                 autoCapitalize="none"
//             />

//             {
//                 provinces.map(p => {
//                     return (
//                         <Pressable onPress={() => setProvince(p)}>
//                             <Text>{p}</Text>
//                         </Pressable> 
//                     )
//                 })
//             }

//             <Pressable onPress={() => onApplyPress({
//                 email, 
//                 businessName, 
//                 businessAddress,
//                 province
//                 })}>
//                 <Text>Create New Business</Text>
//             </Pressable>
//         </ScrollView>
//     )
// }