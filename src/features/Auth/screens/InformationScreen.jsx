import { useState } from 'react';
import { View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomText from '@/src/components/CustomText';
import CustomTextInput, { cleanPhoneNumber } from '@/src/components/CustomTextInput';
import ErrorMessage from '@/src/components/ErrorMessage';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { AuthStyles } from '@/src/features/Auth/styles/AuthStyles';

const InformationScreen = ({ 
    onContinuePress, 
    onBackPress, 
    error 
}) => {

    const [phoneNumber, setPhoneNumber] = useState('');
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [birthday, setBirthday] = useState('');
    const [address, setAddress] = useState('');

    const maxAllowedBirthday = new Date();
    maxAllowedBirthday.setFullYear(maxAllowedBirthday.getFullYear() - 18);

    const handleContinue = () => {
        const finalNumber = cleanPhoneNumber(phoneNumber);
        
        onContinuePress(finalNumber, firstname, lastname, birthday, address);
    };
    
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

                        <CustomText variant="title" style={AuthStyles.pageTitle}>
                            Personal Details
                        </CustomText>

                        <ErrorMessage error={error} />

                        <CustomTextInput
                            label="Phone Number *"
                            placeholder="9XX XXX XXXX"
                            prefix="+63"
                            type="phone"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="number-pad"
                            maxLength={12}
                        />

                        <CustomTextInput
                            label="First Name *"
                            placeholder="e.g. Juan"
                            value={firstname}
                            onChangeText={setFirstname}
                        />

                        <CustomTextInput
                            label="Last Name *"
                            placeholder="e.g. Dela Cruz"
                            value={lastname}
                            onChangeText={setLastname}
                        />

                        <CustomTextInput
                            label="Birthday *"
                            placeholder="MM/DD/YYYY"
                            value={birthday}
                            onChangeText={setBirthday}
                            type="calendar"
                            showTodayButton={false}
                            allowFutureDates={false}
                            defaultMode="year"
                            maximumDate={maxAllowedBirthday}
                        />

                        <CustomTextInput
                            label="Address *"
                            placeholder="City, Province"
                            value={address}
                            onChangeText={setAddress}
                        />

                        <View style={AuthStyles.buttonContainer}>
                            <CustomButton 
                                title="Continue" 
                                onPress={handleContinue}
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