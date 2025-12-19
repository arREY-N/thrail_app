import CustomTextInput from "@/src/components/CustomTextInput";
import { useAuth } from "@/src/core/context/AuthProvider";
import { onUpdateUserProfile } from "@/src/core/domain/authDomain";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function information(){
    const { user } = useAuth(); 
    const [error, setError] = useState(null);
    
    const [number, setNumber] = useState();
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [birthday, setBirthday] = useState('');
    const [address, setAddress] = useState('');

    const onContinuePress = async () => {
        setError(null);

        try {
            await onUpdateUserProfile(
                user.uid, 
                firstname,
                lastname,
                number,
                birthday,
                address
            )
        } catch (err) {
            console.log(err.message);
            setError(err.message);
        }
    }

    return(
        /**
         * Used for testing purposes only.
         * Change into proper component <Information/> for frontend development
         * Please make sure to include all necessary props to pass
         */
        <View>
            {error && <Text>{error}</Text>}
            <CustomTextInput label={'First name'} placeholder={'Enter first name'} value={firstname} onChangeText={setFirstname}/>
            <CustomTextInput label={'Last name'} placeholder={'Enter first name'} value={lastname} onChangeText={setLastname}/>
            <CustomTextInput label={'Birtday'} placeholder={'Enter birthday'} value={birthday} onChangeText={setBirthday}/>
            <CustomTextInput label={'Contact Number'} placeholder={'Enter contact number'} value={number} onChangeText={setNumber}/>
            <CustomTextInput label={'Address'} placeholder={'Enter address'} value={address} onChangeText={setAddress}/>
        
            <Pressable onPress={onContinuePress}>
                <Text>Continue</Text>
            </Pressable>
        </View>
    )
}