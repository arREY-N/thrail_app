import CustomButton from "@/src/components/CustomButton";
import CustomTextInput from "@/src/components/CustomTextInput";
import ResponsiveScrollView from "@/src/components/ResponsiveScrollView";
import { useBusinessesStore } from "@/src/core/stores/businessesStore";
import { useState } from "react";
import { Text } from "react-native";

export default function createBusiness(){
    const [error, setError] = useState(null);
    const [businessName, setBusinessName] = useState('');

    const { addBusinessAccount } = useBusinessesStore();

    const onCreateBusinessPress = async (businessName) => {
        try{
            await addBusinessAccount({businessName})
        } catch (err) {
            console.error(err);
            setError(err)
        }
    }
    return(
        <ResponsiveScrollView>
            <Text>Create Business</Text>

            <CustomTextInput
                placeholder="Name"
                value={businessName ?? ''}
                onChangeText={setBusinessName}
                keyboardType="phone-pad"
            />
            
            <CustomButton 
                title="Publish" 
                onPress={() => onCreateBusinessPress(businessName)}
                variant="primary" 
            />

            
        </ResponsiveScrollView>
    )
}