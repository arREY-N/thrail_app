import { useMemo, useState } from 'react';
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

export interface InformationScreenProps {
    onContinuePress: (phone: string, first: string, last: string, bday: string | Date, address: string) => void;
    onBackPress: () => void;
    error?: string | null;
}

/**
 * Sanitizes name input in real-time, allowing only alphabetic characters and spaces.
 * Omits numbers, symbols, and emojis cleanly without inserting ghost spaces or causing cursor jigger.
 *
 * @param text - The raw user input string.
 * @returns {string} Cleaned string containing letters and spaces only.
 */
const sanitizeName = (text: string): string => {
    return text.replace(/[^a-zA-Z\s\u00C0-\u024F\u1E00-\u1EFF]/g, '');
};

const InformationScreen = ({ 
    onContinuePress, 
    onBackPress, 
    error 
}: InformationScreenProps) => {

    const [phoneNumber, setPhoneNumber] = useState('');
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [birthday, setBirthday] = useState<string | Date>('');
    const [address, setAddress] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    const maxAllowedBirthday = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 10);
        return d;
    }, []);

    const handleContinue = () => {
        setLocalError(null);

        const cleanFirst = firstname.trim().replace(/\s+/g, ' ');
        const cleanLast = lastname.trim().replace(/\s+/g, ' ');

        if (!cleanFirst || !cleanLast) {
            setLocalError('First name and last name must contain letters only.');
            return;
        }

        if (!birthday) {
            setLocalError('Birthday is required');
            return;
        }

        const bdayDate = typeof birthday === 'string' ? new Date(birthday) : birthday;
        if (isNaN(bdayDate.getTime()) || bdayDate > maxAllowedBirthday) {
            setLocalError('You must be at least 10 years old to register.');
            return;
        }

        const finalNumber = cleanPhoneNumber(phoneNumber);
        
        onContinuePress(finalNumber, cleanFirst, cleanLast, birthday, address.trim());
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

                        <ErrorMessage error={localError || error} />

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
                            sanitizeText={sanitizeName}
                            disableEmojiKeyboard={true}
                            autoCapitalize="words"
                            autoCorrect={false}
                        />

                        <CustomTextInput
                            label="Last Name *"
                            placeholder="e.g. Dela Cruz"
                            value={lastname}
                            onChangeText={setLastname}
                            sanitizeText={sanitizeName}
                            disableEmojiKeyboard={true}
                            autoCapitalize="words"
                            autoCorrect={false}
                        />

                        <CustomTextInput
                            label="Birthday *"
                            placeholder="MM/DD/YYYY"
                            value={birthday}
                            onChangeText={(val: string | Date) => {
                                setLocalError(null);
                                setBirthday(val);
                            }}
                            type="calendar"
                            showTodayButton={false}
                            allowFutureDates={false}
                            defaultMode="year"
                            maximumDate={maxAllowedBirthday}
                            helperText="Note: You must be at least 10 years old to register."
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
