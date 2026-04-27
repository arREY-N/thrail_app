import React from 'react';
import {
    Linking,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const HikerProfileCard = ({ 
    user, 
    emergencyContact, 
    personalVerified, 
    emergencyVerified, 
    onTogglePersonalVerify, 
    onToggleEmergencyVerify,
    statusText,
    isApprovedStatus,
    isRejectedStatus,
    isMinor
}) => {

    const handleCall = async (phoneNumber) => {
        if (!phoneNumber) return;
        const url = `tel:${phoneNumber}`;
        if (await Linking.canOpenURL(url)) {
            await Linking.openURL(url);
        }
    };

    const userPhone = user?.phoneNumber || user?.phone;

    return (
        <View style={styles.cardContainer}>
            <CustomText variant="label" style={styles.sectionLabel}>
                HIKER PROFILE
            </CustomText>
            
            <View style={styles.profileHeader}>
                <View style={styles.avatarCircle}>
                    <CustomText style={styles.avatarText}>
                        {user?.firstname?.[0]}{user?.lastname?.[0]}
                    </CustomText>
                </View>
                
                <View style={styles.profileTextGroup}>
                    <View style={styles.nameRow}>
                        
                        <View style={styles.nameAndMinorWrapper}>
                            <CustomText 
                                style={styles.profileName} 
                                numberOfLines={1}
                            >
                                {user?.firstname} {user?.lastname}
                            </CustomText>
                            
                            {isMinor && (
                                <View style={styles.minorBadge}>
                                    <CustomText style={styles.minorBadgeText}>
                                        MINOR
                                    </CustomText>
                                </View>
                            )}
                        </View>
                        
                        {statusText && (
                            <View style={[
                                styles.statusBadge, 
                                isRejectedStatus && { backgroundColor: Colors.ERROR_BG },
                                isApprovedStatus && { backgroundColor: Colors.STATUS_APPROVED_BG }
                            ]}>
                                <CustomText style={[
                                    styles.statusBadgeText,
                                    isRejectedStatus && { color: Colors.ERROR },
                                    isApprovedStatus && { color: Colors.SUCCESS }
                                ]}>
                                    {statusText}
                                </CustomText>
                            </View>
                        )}
                    </View>
                    
                    <CustomText variant="caption">
                        {user?.email}
                    </CustomText>
                    {user?.username && (
                        <CustomText variant="caption">
                            @{user.username}
                        </CustomText>
                    )}
                </View>
            </View>

            {userPhone && (
                <View style={styles.phoneBox}>
                    <View style={styles.phoneTextWrapper}>
                        <CustomText style={styles.phoneLabel}>
                            Personal Phone
                        </CustomText>
                        <CustomText style={styles.phoneNumberText}>
                            {userPhone}
                        </CustomText>
                    </View>
                    <View style={styles.actionRow}>
                        <TouchableOpacity 
                            style={styles.iconBtnPrimary} 
                            onPress={() => handleCall(userPhone)}
                            activeOpacity={0.7}
                        >
                            <CustomIcon 
                                library="Feather" 
                                name="phone-call" 
                                size={16} 
                                color={Colors.WHITE} 
                            />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[
                                styles.verifyBtn, 
                                personalVerified && styles.verifyBtnActive
                            ]} 
                            onPress={onTogglePersonalVerify}
                            activeOpacity={0.7}
                        >
                            <CustomIcon 
                                library="Feather" 
                                name={personalVerified ? "check-circle" : "circle"} 
                                size={14} 
                                color={personalVerified ? Colors.PRIMARY : Colors.TEXT_SECONDARY} 
                            />
                            <CustomText 
                                style={[
                                    styles.verifyBtnText, 
                                    personalVerified && { color: Colors.PRIMARY }
                                ]}
                            >
                                {personalVerified ? "Verified" : "Verify"}
                            </CustomText>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {emergencyContact?.name ? (
                <>
                    <CustomText variant="label" style={[styles.sectionLabel, { marginTop: 24 }]}>
                        {isMinor ? "PARENT / GUARDIAN CONTACT" : "EMERGENCY CONTACT"}
                    </CustomText>
                    
                    <View style={styles.emergencyHeader}>
                        <View style={styles.shieldCircle}>
                            <CustomIcon 
                                library="Feather" 
                                name="shield" 
                                size={16} 
                                color={Colors.PRIMARY} 
                            />
                        </View>
                        <CustomText style={styles.emergencyName}>
                            {emergencyContact.name}
                        </CustomText>
                    </View>

                    <View style={styles.phoneBox}>
                        <View style={styles.phoneTextWrapper}>
                            <CustomText style={styles.phoneLabel}>
                                Contact Phone
                            </CustomText>
                            <CustomText style={styles.phoneNumberText}>
                                {emergencyContact.contactNumber}
                            </CustomText>
                        </View>
                        <View style={styles.actionRow}>
                            <TouchableOpacity 
                                style={styles.iconBtnPrimary} 
                                onPress={() => handleCall(emergencyContact.contactNumber)}
                                activeOpacity={0.7}
                            >
                                <CustomIcon 
                                    library="Feather" 
                                    name="phone-call" 
                                    size={16} 
                                    color={Colors.WHITE} 
                                />
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[
                                    styles.verifyBtn, 
                                    emergencyVerified && styles.verifyBtnActive
                                ]} 
                                onPress={onToggleEmergencyVerify}
                                activeOpacity={0.7}
                            >
                                <CustomIcon 
                                    library="Feather" 
                                    name={emergencyVerified ? "check-circle" : "circle"} 
                                    size={14} 
                                    color={emergencyVerified ? Colors.PRIMARY : Colors.TEXT_SECONDARY} 
                                />
                                <CustomText 
                                    style={[
                                        styles.verifyBtnText, 
                                        emergencyVerified && { color: Colors.PRIMARY }
                                    ]}
                                >
                                    {emergencyVerified ? "Verified" : "Verify"}
                                </CustomText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        padding: 20, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        marginBottom: 24 
    },
    sectionLabel: { 
        color: Colors.PRIMARY, 
        fontSize: 11, 
        fontWeight: 'bold', 
        letterSpacing: 1, 
        marginBottom: 16 
    },
    profileHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 16, 
        marginBottom: 16 
    },
    avatarCircle: { 
        width: 50, 
        height: 50, 
        borderRadius: 25, 
        backgroundColor: Colors.PRIMARY, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    avatarText: { 
        color: Colors.WHITE, 
        fontWeight: 'bold', 
        fontSize: 18 
    },
    profileTextGroup: { 
        flex: 1 
    },
    nameRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 2 
    },
    nameAndMinorWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 8
    },
    profileName: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY,
        flexShrink: 1,
        marginRight: 8
    },
    minorBadge: {
        backgroundColor: Colors.STATUS_WARNING_BG,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    minorBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.STATUS_WARNING_TEXT,
    },
    statusBadge: { 
        backgroundColor: Colors.STATUS_PENDING_BG, 
        paddingHorizontal: 10, 
        paddingVertical: 4, 
        borderRadius: 12 
    },
    statusBadgeText: { 
        fontSize: 10, 
        fontWeight: 'bold', 
        color: Colors.STATUS_PENDING_TEXT, 
        letterSpacing: 0.5 
    },
    emergencyHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12, 
        marginBottom: 16 
    },
    shieldCircle: { 
        width: 32, 
        height: 32, 
        borderRadius: 16, 
        backgroundColor: '#E8F5E9', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    emergencyName: { 
        fontSize: 15, 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY 
    },
    phoneBox: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        backgroundColor: '#F9FAFB', 
        borderRadius: 12, 
        padding: 12 
    },
    phoneTextWrapper: { 
        flex: 1 
    },
    phoneLabel: { 
        fontSize: 12, 
        color: Colors.TEXT_SECONDARY, 
        marginBottom: 4 
    },
    phoneNumberText: { 
        fontSize: 14, 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY 
    },
    actionRow: { 
        flexDirection: 'row', 
        gap: 8 
    },
    iconBtnPrimary: { 
        width: 40, 
        height: 40, 
        backgroundColor: Colors.PRIMARY, 
        borderRadius: 8, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    verifyBtn: { 
        height: 40, 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: Colors.WHITE, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        paddingHorizontal: 12, 
        borderRadius: 8, 
        gap: 6 
    },
    verifyBtnActive: { 
        backgroundColor: Colors.STATUS_APPROVED_BG, 
        borderColor: Colors.SUCCESS 
    },
    verifyBtnText: { 
        color: Colors.TEXT_SECONDARY, 
        fontSize: 13, 
        fontWeight: '500' 
    }
});

export default HikerProfileCard;