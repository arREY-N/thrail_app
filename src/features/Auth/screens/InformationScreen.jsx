import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import CustomButton from '../../../components/CustomButton';
import CustomText from '../../../components/CustomText';
import CustomTextInput from '../../../components/CustomTextInput';
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
        <ScreenWrapper backgroundColor={Colors.Background}>

            <ResponsiveScrollView 
                minHeight={600} 
                style={AuthStyles.container} 
                contentContainerStyle={AuthStyles.scrollContent}
            >

                <View style={AuthStyles.header}> 
                    <TouchableOpacity onPress={onBackPress} style={AuthStyles.backButton}>
                        <Feather name="chevron-left" size={28} color={Colors.BLACK} />
                    </TouchableOpacity>
                    <CustomText style={AuthStyles.headerTitle}>Thrail</CustomText>
                    <View style={{ width: 28 }} />
                </View>

                <View style={AuthStyles.contentContainer}>
                    <View style={AuthStyles.formConstrainer}>

                        <CustomText variant="h1" style={AuthStyles.pageTitle}>
                            Sign Up
                        </CustomText>

                        {error && (
                            <View style={AuthStyles.errorContainer}>
                                <Feather name="alert-circle" size={18} color="#D32F2F" />
                                <CustomText style={AuthStyles.errorText}>
                                    {error}
                                </CustomText>
                            </View>
                        )}

                        <CustomTextInput
                            placeholder="Phone Number"
                            value={number}
                            onChangeText={setNumber}
                            keyboardType="phone-pad"
                        />

                        <CustomTextInput
                            placeholder="First Name"
                            value={firstname}
                            onChangeText={setFirstname}
                        />

                        <CustomTextInput
                            placeholder="Last Name"
                            value={lastname}
                            onChangeText={setLastname}
                        />

                        <CustomTextInput
                            placeholder="Birthday (MM/DD/YYYY)"
                            value={birthday}
                            onChangeText={setBirthday}
                        />

                        <CustomTextInput
                            placeholder="Address"
                            value={address}
                            onChangeText={setAddress}
                        />

                        <View style={AuthStyles.buttonContainer}>
                            <CustomButton 
                                title="Continue" 
                                onPress={() => onContinuePress( number,firstname, lastname, birthday, address)}
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