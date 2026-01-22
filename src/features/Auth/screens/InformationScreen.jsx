import { useState } from 'react';
import { View } from 'react-native';

import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import CustomButton from '../../../components/CustomButton';
import CustomHeader from '../../../components/CustomHeader';
import CustomText from '../../../components/CustomText';
import CustomTextInput from '../../../components/CustomTextInput';
import ErrorMessage from '../../../components/ErrorMessage';
import ScreenWrapper from '../../../components/ScreenWrapper';

import { Colors } from '../../../constants/colors';
import { AuthStyles } from '../styles/AuthStyles';

const InformationScreen = ({ onContinuePress, onBackPress, error }) => {

    const [number, setNumber] = useState('');
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [birthday, setBirthday] = useState('');
    const [address, setAddress] = useState('');
    
    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>

            <ResponsiveScrollView 
                minHeight={600} 
                style={AuthStyles.container} 
                contentContainerStyle={AuthStyles.scrollContent}
            >
                <CustomHeader onBackPress={onBackPress} />

                <View style={AuthStyles.contentContainer}>
                    <View style={AuthStyles.formConstrainer}>

                        <CustomText variant="h1" style={AuthStyles.pageTitle}>
                            Personal Details
                        </CustomText>

                        <ErrorMessage error={error} />

                        <CustomTextInput
                            label="Phone Number"
                            placeholder="0912 345 6789"
                            value={number}
                            onChangeText={setNumber}
                            keyboardType="phone-pad"
                        />

                        <CustomTextInput
                            label="First Name"
                            placeholder="e.g. Juan"
                            value={firstname}
                            onChangeText={setFirstname}
                        />

                        <CustomTextInput
                            label="Last Name"
                            placeholder="e.g. Dela Cruz"
                            value={lastname}
                            onChangeText={setLastname}
                        />

                        <CustomTextInput
                            label="Birthday"
                            placeholder="MM/DD/YYYY"
                            value={birthday}
                            onChangeText={setBirthday}
                        />

                        <CustomTextInput
                            label="Address"
                            placeholder="City, Province"
                            value={address}
                            onChangeText={setAddress}
                        />

                        <View style={AuthStyles.buttonContainer}>
                            <CustomButton 
                                title="Continue" 
                                onPress={() => onContinuePress(number, firstname, lastname, birthday, address)}
                                variant="primary" 
                            />
                        </View>
                    </View>
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    )
}

export default InformationScreen;