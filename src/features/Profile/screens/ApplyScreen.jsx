import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ErrorMessage from '@/src/components/ErrorMessage';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import SelectionOption from '@/src/features/Auth/components/SelectionOption';

import { Colors } from '@/src/constants/colors';

const ApplyScreen = ({
    system,
    options,
    application,
    onUpdatePress,
    onSubmitPress,
    onBackPress
}) => {
    const [showConfirm, setShowConfirm] = useState(false);

    const isSuccess = system && (system.toLowerCase().includes('sent') || system.toLowerCase().includes('success'));
    const isError = system && !isSuccess;

    const isFormValid = 
        !!application?.name?.trim() &&
        application?.establishedOn !== null &&
        !!application?.address?.trim() &&
        Array.isArray(application?.servicedLocation) && application.servicedLocation.flat(Infinity).length > 0 &&
        
        !!application?.owner?.name?.trim() &&
        !!application?.owner?.email?.trim() &&
        !!application?.owner?.validId?.trim() &&
        
        !!application?.permits?.bir?.trim() &&
        !!application?.permits?.dti?.trim() &&
        !!application?.permits?.denr?.trim();

    const handlePreSubmit = () => {
        if (!isFormValid) return; 
        setShowConfirm(true);
    };

    const handleConfirmSubmit = () => {
        setShowConfirm(false);
        onSubmitPress();
    };

    const handleLocationSelect = (location) => {
        onUpdatePress({ section: 'root', id: 'servicedLocation', value: location });
    };

    const safeLocations = Array.isArray(application?.servicedLocation) 
        ? application.servicedLocation.flat(Infinity) 
        : [];

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <ConfirmationModal
                visible={showConfirm}
                title="Submit Application"
                message="Are you sure all your business details and permits are correct?"
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

                <View style={styles.formContainer}>
                    
                    <View style={styles.sectionBlock}>
                        <CustomText variant="h3" style={styles.sectionTitle}>Business Info</CustomText>
                        <View style={styles.formCard}>
                            
                            <CustomTextInput
                                label="Business Name *"
                                placeholder="Business Name"
                                value={application?.name || ''}
                                onChangeText={(val) => onUpdatePress({ section: 'root', id: 'name', value: val })}
                                autoCapitalize="words"
                                style={styles.inputSpacing}
                            />

                            <CustomTextInput
                                type="calendar"
                                label="Date of Establishment *"
                                placeholder="MM / DD / YYYY"
                                value={application?.establishedOn || null}
                                onChangeText={(val) => onUpdatePress({ section: 'root', id: 'establishedOn', value: val })}
                                showTodayButton={true}
                                allowFutureDates={false}
                                style={styles.inputSpacing}
                            />

                            <CustomTextInput
                                label="Owner/Office Address *"
                                placeholder="Owner/Office Address"
                                value={application?.address || ''}
                                onChangeText={(val) => onUpdatePress({ section: 'root', id: 'address', value: val })}
                                style={styles.inputSpacing}
                            />

                            <CustomText variant="label" style={styles.multiSelectLabel}>Offered Locations *</CustomText>
                            
                            <View style={styles.locationsContainer}>
                                {options?.provinces?.map((province) => {
                                    return (
                                        <SelectionOption
                                            key={province}
                                            label={province}
                                            selected={safeLocations.includes(province)}
                                            onPress={() => handleLocationSelect(province)}
                                            style={styles.compactSelection}
                                        />
                                    );
                                })}
                            </View>

                        </View>
                    </View>

                    <View style={styles.sectionBlock}>
                        <CustomText variant="h3" style={styles.sectionTitle}>Owner Info</CustomText>
                        <View style={styles.formCard}>
                            
                            <CustomTextInput
                                label="Name *"
                                placeholder="Owner Name"
                                value={application?.owner?.name || ''}
                                onChangeText={(val) => onUpdatePress({ section: 'owner', id: 'name', value: val })}
                                autoCapitalize="words"
                                style={styles.inputSpacing}
                            />

                            <CustomTextInput
                                label="Email *"
                                placeholder="e.g. owner@example.com"
                                value={application?.owner?.email || ''}
                                onChangeText={(val) => onUpdatePress({ section: 'owner', id: 'email', value: val })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={styles.inputSpacing}
                            />

                            <CustomTextInput
                                label="Valid Government ID *"
                                placeholder="Valid Government ID"
                                value={application?.owner?.validId || ''}
                                onChangeText={(val) => onUpdatePress({ section: 'owner', id: 'validId', value: val })}
                                style={styles.inputSpacing}
                            />

                        </View>
                    </View>

                    <View style={styles.sectionBlock}>
                        <CustomText variant="h3" style={styles.sectionTitle}>Permits & Documents</CustomText>
                        <View style={styles.formCard}>
                            
                            <CustomTextInput
                                label="BIR *"
                                placeholder="BIR"
                                value={application?.permits?.bir || ''}
                                onChangeText={(val) => onUpdatePress({ section: 'permits', id: 'bir', value: val })}
                                style={styles.inputSpacing}
                            />

                            <CustomTextInput
                                label="DTI *"
                                placeholder="DTI"
                                value={application?.permits?.dti || ''}
                                onChangeText={(val) => onUpdatePress({ section: 'permits', id: 'dti', value: val })}
                                style={styles.inputSpacing}
                            />

                            <CustomTextInput
                                label="DENR *"
                                placeholder="DENR"
                                value={application?.permits?.denr || ''}
                                onChangeText={(val) => onUpdatePress({ section: 'permits', id: 'denr', value: val })}
                                style={styles.inputSpacing}
                            />

                        </View>
                    </View>

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
        paddingHorizontal: 16 
    },
    headerSection: { 
        marginBottom: 32, 
        gap: 8, 
        alignItems: 'center' 
    },
    pageTitle: { 
        fontWeight: 'bold', 
        marginBottom: 0, 
        textAlign: 'center' 
    },
    pageSubtitle: { 
        textAlign: 'center', 
        maxWidth: '85%' 
    },

    successBox: { 
        backgroundColor: Colors.SUCCESS, 
        padding: 12, 
        borderRadius: 8, 
        marginBottom: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY 
    },
    successText: { 
        color: Colors.SUCCESS, 
        textAlign: 'center', 
        fontSize: 14, 
        fontWeight: '500' 
    },
    
    formContainer: { 
        gap: 24 
    },
    sectionBlock: { 
        gap: 8 
    },
    sectionTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY, 
        marginLeft: 4 
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
        marginBottom: 16 
    },
    
    multiSelectLabel: { 
        marginBottom: 8, 
        marginLeft: 2 
    },
    
    locationsContainer: { 
        marginTop: 4,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    compactSelection: { 
        width: '48%', 
        marginBottom: 12, 
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: Colors.BACKGROUND,
    },
    
    buttonContainer: { 
        marginTop: 16 
    }
});

export default ApplyScreen;