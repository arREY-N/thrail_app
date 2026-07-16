/**
 * @file HikerProfileCard.tsx
 * @description Admin component displaying hiker and emergency contact details for a booking.
 * Grouped into clean, consistent profile information cards.
 */

import React, { useState } from 'react';
import {
    Linking,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { calculateAge, formatDateToStandard, getInitials } from '@/src/utils/dateFormatter';
import { User } from '@/src/core/models/User/User';
import { IEmergencyContact } from '@/src/core/models/User/User.types';
import { IUserBooking } from '@/src/core/models/Booking/Booking.types';

/**
 * Props for HikerProfileCard component.
 * @param user - The user basic information object on the booking.
 * @param emergencyContact - Hiker's emergency contact detail.
 * @param hikerProfile - The full hiker profile document containing medical information.
 * @param personalStatus - Verification status of the hiker's personal phone number.
 * @param emergencyStatus - Verification status of the emergency contact's phone number.
 * @param personalMonthsRemaining - Months remaining for personal phone number verification validity.
 * @param emergencyMonthsRemaining - Months remaining for emergency contact phone number verification validity.
 * @param onTogglePersonalVerify - Callback to toggle personal phone verification state.
 * @param onToggleEmergencyVerify - Callback to toggle emergency phone verification state.
 * @param statusText - Optional display label for the booking workflow status.
 * @param statusBgColor - Optional background color for the booking status badge.
 * @param statusTextColor - Optional text color for the booking status badge.
 * @param isMinor - Flag indicating if the hiker is a legal minor.
 */
export interface HikerProfileCardProps {
    user: IUserBooking<Date>;
    emergencyContact: IEmergencyContact;
    hikerProfile?: User | null;
    personalStatus: 'verified' | 'expired' | 'unverified';
    emergencyStatus: 'verified' | 'expired' | 'unverified';
    personalMonthsRemaining: number;
    emergencyMonthsRemaining: number;
    onTogglePersonalVerify: () => void;
    onToggleEmergencyVerify: () => void;
    statusText?: string;
    statusBgColor?: string;
    statusTextColor?: string;
    isMinor: boolean;
}

/**
 * HikerProfileCard — Displays hiker details, emergency contacts, and profile preferences in modular cards.
 */
const HikerProfileCard: React.FC<HikerProfileCardProps> = ({ 
    user, 
    emergencyContact,
    hikerProfile,
    personalStatus,
    emergencyStatus,
    personalMonthsRemaining,
    emergencyMonthsRemaining,
    onTogglePersonalVerify, 
    onToggleEmergencyVerify,
    statusText,
    statusBgColor,
    statusTextColor,
    isMinor
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const medicalDetails = Array.isArray(hikerProfile?.medicalProfile?.details)
        ? hikerProfile.medicalProfile.details
        : [];
    const hasMedicalCondition = !!hikerProfile?.medicalProfile?.hasCondition && medicalDetails.length > 0;
    
    let medicalBadgeText = "";
    if (hasMedicalCondition) {
        if (medicalDetails.length === 1) {
            medicalBadgeText = medicalDetails[0];
        } else {
            medicalBadgeText = "Medical Info";
        }
    }

    // ConfirmationModal States for Phone Verification
    const [confirmVerifyVisible, setConfirmVerifyVisible] = useState(false);
    const [pendingVerifyType, setPendingVerifyType] = useState<'personal' | 'emergency' | null>(null);
    const [pendingVerifyAction, setPendingVerifyAction] = useState<(() => void) | null>(null);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmBtnText, setConfirmBtnText] = useState('');
    const [confirmIcon, setConfirmIcon] = useState('phone-call');
    const [isConfirmDestructive, setIsConfirmDestructive] = useState(false);

    const handleCall = async (phoneNumber: string) => {
        if (!phoneNumber) return;
        const url = `tel:${phoneNumber}`;
        if (await Linking.canOpenURL(url)) {
            await Linking.openURL(url);
        }
    };

    const userPhone = user?.phoneNumber;

    const handleVerifyPress = (
        type: 'personal' | 'emergency', 
        currentStatus: 'verified' | 'expired' | 'unverified', 
        onToggle: () => void
    ) => {
        setPendingVerifyType(type);
        setPendingVerifyAction(() => onToggle);
        
        const isPersonal = type === 'personal';
        const labelName = isPersonal ? 'hiker' : `emergency contact (${emergencyContact?.name || 'N/A'})`;

        if (currentStatus === 'verified') {
            setConfirmTitle('Unverify Phone Number?');
            setConfirmMessage(`Are you sure you want to mark the ${labelName}'s phone number as unverified?`);
            setConfirmBtnText('Yes, Unverify');
            setConfirmIcon('alert-triangle');
            setIsConfirmDestructive(true);
        } else {
            setConfirmTitle('Confirm Verification');
            setConfirmMessage(`Have you called this phone number to manually verify the ${labelName}'s details?`);
            setConfirmBtnText('Yes, Verified');
            setConfirmIcon('phone-call');
            setIsConfirmDestructive(false);
        }
        setConfirmVerifyVisible(true);
    };

    const handleConfirmVerification = () => {
        if (pendingVerifyAction) {
            pendingVerifyAction();
        }
        setConfirmVerifyVisible(false);
        setPendingVerifyType(null);
        setPendingVerifyAction(null);
    };

    const getExperienceBadgeColors = (exp?: string | null) => {
        const level = exp?.toLowerCase() || '';
        if (level.includes('begin') || level.includes('novice')) {
            return {
                bg: Colors.EXP_BEGINNER_BG,
                text: Colors.EXP_BEGINNER_TEXT,
            };
        }
        if (level.includes('regular') || level.includes('intermed')) {
            return {
                bg: Colors.EXP_REGULAR_BG,
                text: Colors.EXP_REGULAR_TEXT,
            };
        }
        if (level.includes('exper') || level.includes('adv')) {
            return {
                bg: Colors.EXP_EXPERIENCED_BG,
                text: Colors.EXP_EXPERIENCED_TEXT,
            };
        }
        return {
            bg: Colors.GRAY_ULTRALIGHT,
            text: Colors.TEXT_SECONDARY,
        };
    };

    const renderVerifyButton = (
        status: 'verified' | 'expired' | 'unverified', 
        onToggle: () => void
    ) => {
        let btnStyle: any = styles.verifyBtn;
        let textStyle: any = styles.verifyBtnText;
        let iconName: 'circle' | 'check-circle' | 'alert-octagon' = 'circle';
        let iconColor = Colors.TEXT_SECONDARY;
        let label = "Verify";

        if (status === 'verified') {
            btnStyle = [styles.verifyBtn, styles.verifyBtnActive];
            textStyle = [styles.verifyBtnText, { color: Colors.PRIMARY }];
            iconName = 'check-circle';
            iconColor = Colors.PRIMARY;
            label = "Verified";
        } else if (status === 'expired') {
            btnStyle = [styles.verifyBtn, styles.verifyBtnExpired];
            textStyle = [styles.verifyBtnText, { color: Colors.VERIFICATION_EXPIRED_TEXT }];
            iconName = 'alert-octagon';
            iconColor = Colors.VERIFICATION_EXPIRED_TEXT;
            label = "Expired";
        }

        return (
            <TouchableOpacity style={btnStyle} onPress={onToggle} activeOpacity={0.7}>
                <CustomIcon 
                    library="Feather" 
                    name={iconName} 
                    size={14} 
                    color={iconColor} 
                />
                <CustomText style={textStyle}>{label}</CustomText>
            </TouchableOpacity>
        );
    };

    const hikerInitials = getInitials((user?.firstname || '') + ' ' + (user?.lastname || ''));

    return (
        <View style={styles.container}>
            {/* CARD 1: HIKER PROFILE (Merged block containing initials row & full details when expanded) */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <CustomIcon library="Feather" name="user" size={18} color={Colors.PRIMARY} />
                    <CustomText variant="h3" style={styles.cardTitle}>Hiker Profile</CustomText>
                </View>

                {/* Profile Header Row (Compact Name Summary) */}
                <View style={styles.profileHeaderRow}>
                    <View style={styles.avatarCircle}>
                        <CustomText style={styles.avatarText}>
                            {hikerInitials}
                        </CustomText>
                    </View>
                    
                    <View style={styles.profileTextGroup}>
                        <CustomText style={styles.profileName} numberOfLines={1}>
                            {user?.firstname} {user?.lastname}
                        </CustomText>
                        
                        {/* WRAPPING BADGES CONTAINER */}
                        <View style={styles.badgesWrapper}>
                            {/* Booking Status Badge */}
                            {statusText && (
                                <View style={[
                                    styles.statusBadge, 
                                    statusBgColor && { backgroundColor: statusBgColor }
                                ]}>
                                    <CustomText style={[
                                        styles.statusBadgeText,
                                        statusTextColor && { color: statusTextColor }
                                    ]}>
                                        {statusText}
                                    </CustomText>
                                </View>
                            )}

                            {/* Medical Info Badge (Unified Blue Chip) */}
                            {hasMedicalCondition && (
                                <View style={styles.medicalBadge}>
                                    <CustomText style={styles.medicalBadgeText}>
                                        {medicalBadgeText}
                                    </CustomText>
                                </View>
                            )}

                            {/* Minor Badge */}
                            {isMinor && (
                                <View style={styles.minorBadge}>
                                    <CustomText style={styles.minorBadgeText}>MINOR</CustomText>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Horizontal divider line above expand button (does not move when expanded) */}
                <View style={styles.expandDivider} />

                {/* Profile Details Panel (Expanded Block) */}
                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <View style={styles.inlineRow}>
                            <CustomText style={styles.inlineLabel}>Age / Birthday</CustomText>
                            <CustomText style={styles.inlineValue}>
                                {calculateAge(user?.birthday || hikerProfile?.birthday)} years old {isMinor && "(Minor)"} ({formatDateToStandard(user?.birthday || hikerProfile?.birthday)})
                            </CustomText>
                        </View>
                        
                        {hikerProfile?.address && (
                            <View style={styles.inlineRow}>
                                <CustomText style={styles.inlineLabel}>Address</CustomText>
                                <CustomText style={styles.inlineValue}>{hikerProfile.address}</CustomText>
                            </View>
                        )}

                        {hikerProfile?.preferences?.experience && (
                            <View style={styles.inlineRow}>
                                <CustomText style={styles.inlineLabel}>Hike Experience</CustomText>
                                <View style={styles.experienceTagWrapper}>
                                    {(() => {
                                        const expStyle = getExperienceBadgeColors(hikerProfile.preferences.experience);
                                        return (
                                            <View style={[styles.experienceBadgeInline, { backgroundColor: expStyle.bg }]}>
                                                <CustomText style={[styles.experienceBadgeInlineText, { color: expStyle.text }]}>
                                                    {hikerProfile.preferences.experience}
                                                </CustomText>
                                            </View>
                                        );
                                    })()}
                                </View>
                            </View>
                        )}

                        {hasMedicalCondition && (
                            <>
                                {medicalDetails.length === 1 ? (
                                    <View style={[styles.inlineRow, styles.noBorder]}>
                                        <CustomText style={styles.inlineLabel}>Medical Condition</CustomText>
                                        <View style={styles.experienceTagWrapper}>
                                            <View style={styles.gamifiedChip}>
                                                <CustomText style={styles.gamifiedChipText}>
                                                    {medicalDetails[0]}
                                                </CustomText>
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={[styles.stackedRow, styles.noBorder]}>
                                        <CustomText style={styles.inlineLabel}>Medical Conditions</CustomText>
                                        <View style={styles.gamifiedChipContainer}>
                                            {medicalDetails.map((cond: string, idx: number) => (
                                                <View key={idx} style={styles.gamifiedChip}>
                                                    <CustomText style={styles.gamifiedChipText}>
                                                        {cond}
                                                    </CustomText>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                )}

                <TouchableOpacity style={styles.expandToggle} onPress={() => setIsExpanded(!isExpanded)} activeOpacity={0.7}>
                    <CustomText style={styles.expandToggleText}>
                        {isExpanded ? "Hide Full Profile" : "View Full Profile"}
                    </CustomText>
                    <CustomIcon library="Feather" name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={Colors.PRIMARY} />
                </TouchableOpacity>
            </View>

            {/* CARD 2: VERIFICATION CONTACTS (Separate Block) */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <CustomIcon library="Feather" name="phone" size={18} color={Colors.PRIMARY} />
                    <CustomText variant="h3" style={styles.cardTitle}>Verification Contacts</CustomText>
                </View>
                
                <View style={styles.cardBody}>
                    {userPhone && (
                        <View style={styles.contactRow}>
                            <View style={styles.contactLeft}>
                                <CustomText style={styles.contactLabel}>Hiker Phone Number</CustomText>
                                <CustomText style={styles.contactNumber}>{userPhone}</CustomText>
                            </View>
                            <View style={styles.contactActions}>
                                <TouchableOpacity 
                                    style={styles.callCircleButton} 
                                    onPress={() => handleCall(userPhone)}
                                    activeOpacity={0.7}
                                >
                                    <CustomIcon library="Feather" name="phone" size={14} color={Colors.PRIMARY} />
                                </TouchableOpacity>
                                {renderVerifyButton(personalStatus, () => handleVerifyPress('personal', personalStatus, onTogglePersonalVerify))}
                            </View>
                        </View>
                    )}

                    {emergencyContact?.name && (
                        <View style={[styles.contactRow, styles.noBorder]}>
                            <View style={styles.contactLeft}>
                                <CustomText style={styles.contactLabel}>Emergency Contact</CustomText>
                                <CustomText style={styles.contactNumber}>
                                    {emergencyContact.contactNumber}
                                    <CustomText style={styles.contactNameInline}> ({emergencyContact.name})</CustomText>
                                </CustomText>
                            </View>
                            <View style={styles.contactActions}>
                                <TouchableOpacity 
                                    style={styles.callCircleButton} 
                                    onPress={() => handleCall(emergencyContact.contactNumber)}
                                    activeOpacity={0.7}
                                >
                                    <CustomIcon library="Feather" name="phone" size={14} color={Colors.PRIMARY} />
                                </TouchableOpacity>
                                {renderVerifyButton(emergencyStatus, () => handleVerifyPress('emergency', emergencyStatus, onToggleEmergencyVerify))}
                            </View>
                        </View>
                    )}
                </View>
            </View>

            <ConfirmationModal 
                visible={confirmVerifyVisible} 
                title={confirmTitle} 
                message={confirmMessage} 
                confirmText={confirmBtnText}
                iconName={confirmIcon}
                isDestructive={isConfirmDestructive}
                onConfirm={handleConfirmVerification} 
                onClose={() => setConfirmVerifyVisible(false)} 
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        gap: 16,
    },
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2),
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    cardTitle: {
        marginBottom: 0,
        color: Colors.BLACK,
        fontWeight: 'bold',
        fontSize: 15,
    },
    cardBody: {
        flexDirection: 'column',
    },
    profileHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 16,
    },
    avatarCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(2),
    },
    avatarText: { 
        color: Colors.WHITE, 
        fontWeight: 'bold', 
        fontSize: 20 
    },
    profileTextGroup: { 
        flex: 1 
    },
    profileName: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4
    },
    badgesWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center'
    },
    minorBadge: {
        backgroundColor: Colors.STATUS_WARNING_BG,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12
    },
    minorBadgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: Colors.STATUS_WARNING_TEXT
    },
    medicalBadge: {
        backgroundColor: Colors.MEDICAL_BADGE_BG,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12
    },
    medicalBadgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: Colors.MEDICAL_BADGE_TEXT
    },
    statusBadge: { 
        backgroundColor: Colors.STATUS_PENDING_BG, 
        paddingHorizontal: 8, 
        paddingVertical: 2, 
        borderRadius: 12 
    },
    statusBadgeText: { 
        fontSize: 9, 
        fontWeight: 'bold', 
        color: Colors.STATUS_PENDING_TEXT 
    },
    verifyBtn: { 
        height: 32, 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: Colors.WHITE, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        paddingHorizontal: 12, 
        borderRadius: 20, 
        gap: 4 
    },
    verifyBtnActive: { 
        backgroundColor: Colors.STATUS_APPROVED_BG, 
        borderColor: Colors.SUCCESS 
    },
    verifyBtnExpired: {
        backgroundColor: Colors.VERIFICATION_EXPIRED_BG,
        borderColor: Colors.VERIFICATION_EXPIRED_BORDER
    },
    verifyBtnText: { 
        color: Colors.TEXT_SECONDARY, 
        fontSize: 11, 
        fontWeight: 'bold' 
    },
    contactRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    contactLeft: {
        flexDirection: 'column',
        gap: 4,
        flex: 1,
    },
    contactLabel: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    contactNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    contactNameInline: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'normal',
    },
    contactActions: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    callCircleButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.BUTTON_OUTLINE_BORDER,
        backgroundColor: Colors.BUTTON_OUTLINE_BG,
        justifyContent: 'center',
        alignItems: 'center',
    },
    expandedContent: {
        marginTop: 4
    },
    inlineRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        flexWrap: 'wrap',
    },
    inlineLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: '500',
        flexShrink: 1,
        marginRight: 16,
    },
    inlineValue: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        fontWeight: '700',
        flex: 1,
        textAlign: 'right',
    },
    stackedRow: {
        flexDirection: 'column',
        paddingVertical: 12,
        gap: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    experienceTagWrapper: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        flex: 1,
    },
    experienceBadgeInline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    experienceBadgeInlineText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    noBorder: {
        borderBottomWidth: 0,
    },
    expandDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginTop: 6,
        marginBottom: 6,
    },
    expandToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 4,
    },
    expandToggleText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 12
    },
    gamifiedChipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
    },
    gamifiedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: Colors.MEDICAL_BADGE_BG,
    },
    gamifiedChipText: {
        fontWeight: 'bold',
        fontSize: 11,
        color: Colors.MEDICAL_BADGE_TEXT,
    }
});

export default HikerProfileCard;
