import CustomTextInput from '@/src/components/CustomTextInput';
import { useAuth } from '@/src/core/context/AuthProvider';
import { applyBusiness } from '@/src/core/domain/businessDomain';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

/**
 * Display business accounts
 * Display business admins
 * Approve business account creation request
 * Monitor business status 
 */
export default function apply(){
    const [email, setEmail] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
    const [error, setError] = useState(null);
    const [sucess, setSucess] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        setEmail(user?.email);
    }, [user]);

    const applyPress = async ({email, businessName}) => {
        setError(null);
        setSucess(null);
        try{
            const appId = await applyBusiness({email, businessName, businessAddress});
            setSucess(`Request successfully sent`);            
        } catch (err) {
            setError(err);
        } finally {
            setBusinessName('')
            setEmail('');
        }
    }

    return(
        <ScrollView>
            <Text>Business Application Screen</Text>
            {
                error && <Text>{error}</Text>
            }
            {
                sucess && <Text>{sucess}</Text>
            }
            <CustomTextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <CustomTextInput
                placeholder="Business Name"
                value={businessName}
                onChangeText={setBusinessName}
                autoCapitalize="none"
            />

            <CustomTextInput
                placeholder="Business Address"
                value={businessAddress}
                onChangeText={setBusinessAddress}
                autoCapitalize="none"
            />

            <Pressable onPress={() => applyPress({email, businessName})}>
                <Text>Create New Business</Text>
            </Pressable>
        </ScrollView>
    )
}