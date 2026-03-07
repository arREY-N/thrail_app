import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomDropdown from '@/src/components/CustomDropdown';
import CustomHeader from '@/src/components/CustomHeader';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ErrorMessage from '@/src/components/ErrorMessage';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';

const ApplyScreen = ({
    system,
    provinces,
    onApplyPress,
    onBackPress
}) => {

    const [email, setEmail] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
    const [province, setProvince] = useState('');
    
    const [showConfirm, setShowConfirm] = useState(false);

    const isSuccess = system && (system.toLowerCase().includes('sent') || system.toLowerCase().includes('success'));
    const isError = system && !isSuccess;

    const isFormValid = 
        email.trim().length > 0 && 
        businessName.trim().length > 0 && 
        businessAddress.trim().length > 0 && 
        province !== '';

    const handlePreSubmit = () => {
        if (!isFormValid) return; 

        setShowConfirm(true);
    };

    const handleConfirmSubmit = () => {
        setShowConfirm(false);
        onApplyPress({
            email,
            businessName,
            businessAddress,
            province
        });
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <ConfirmationModal
                visible={showConfirm}
                title="Submit Application"
                message="Are you sure your business details are correct?"
                confirmText="Submit"
                cancelText="Check"
                onConfirm={handleConfirmSubmit}
                onClose={() => setShowConfirm(false)}
            />

            <CustomHeader 
                title=" " 
                onBackPress={onBackPress}
            />

            <ResponsiveScrollView contentContainerStyle={styles.scrollContent}>
                
                <View style={styles.headerSection}>
                    <CustomText variant="h2" style={styles.pageTitle}>
                        Apply for a Partner Account
                    </CustomText>
                    <CustomText variant="caption" style={styles.pageSubtitle}>
                        Fill in the details below to register your business on Thrail.
                    </CustomText>
                </View>

                {isError && <ErrorMessage error={system} />}

                {isSuccess && (
                    <View style={styles.successBox}>
                        <CustomText style={styles.successText}>
                            {system}
                        </CustomText>
                    </View>
                )}

                <View style={styles.formCard}>
                    
                    <CustomTextInput
                        label="Email Address"
                        placeholder="e.g. business@example.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.inputSpacing}
                    />

                    <CustomTextInput
                        label="Business Name"
                        placeholder="e.g. Mountview Hiking Gear"
                        value={businessName}
                        onChangeText={setBusinessName}
                        autoCapitalize="words"
                        style={styles.inputSpacing}
                    />

                    <CustomTextInput
                        label="Business Address"
                        placeholder="Street, Barangay, City"
                        value={businessAddress}
                        onChangeText={setBusinessAddress}
                        style={styles.inputSpacing}
                    />

                    <CustomDropdown
                        label="Province"
                        placeholder="Select Province"
                        options={provinces}
                        value={province}
                        onSelect={setProvince}
                    />

                    <View style={styles.buttonContainer}>
                        <CustomButton 
                            title="Submit Application"
                            onPress={handlePreSubmit}
                            variant="primary"
                            disabled={!isFormValid}
                            style={{ opacity: isFormValid ? 1 : 0.5 }}
                        />
                    </View>

                </View>

            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingVertical: 32,
        paddingHorizontal: 16,
    },
    headerSection: {
        marginBottom: 32,
        gap: 8,
        alignItems: 'center',
    },
    pageTitle: {
        fontWeight: 'bold',
        marginBottom: 0,
    },
    pageSubtitle: {
        textAlign: 'center',
        maxWidth: '85%',
    },

    successBox: {
        backgroundColor: Colors.SUCCESS,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY,
    },
    successText: {
        color: Colors.SUCCESS,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
    },
    
    formCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        paddingVertical: 24,
        paddingHorizontal: 16,

        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
    },
    inputSpacing: {
        marginBottom: 16,
    },
    buttonContainer: {
        marginTop: 8,
    }
});

export default ApplyScreen;