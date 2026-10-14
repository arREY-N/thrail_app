/**
 * @file PendingPanel.tsx
 * @description Action required panel displaying pending applications summary or success state for Superadmin Dashboard.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

/**
 * Interface representing the properties of the PendingPanel component.
 * 
 * @param pendingCount - The count of pending applications.
 * @param onReviewPress - Callback handler to navigate to applications list.
 */
interface Props {
    pendingCount: number;
    onReviewPress: () => void;
}

/**
 * PendingPanel component displaying application status alerts.
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement} The rendered pending status panel or success banner.
 */
const PendingPanel = ({
    pendingCount,
    onReviewPress,
}: Props): React.JSX.Element => {
    if (pendingCount === 0) {
        return (
            <View style={styles.successBanner}>
                <View style={styles.successIconWrapper}>
                    <CustomIcon 
                        library="Feather" 
                        name="check-circle" 
                        size={20} 
                        color={Colors.SUCCESS} 
                    />
                </View>
                <View style={styles.textWrapper}>
                    <CustomText variant="body" style={styles.successTitle}>
                        All Caught Up!
                    </CustomText>
                    <CustomText variant="caption" style={styles.successSubtitle}>
                        No pending guide or business partnership requests.
                    </CustomText>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
                <View style={styles.alertTitleRow}>
                    <View style={styles.alertIconWrapper}>
                        <CustomIcon 
                            library="Feather" 
                            name="bell" 
                            size={20} 
                            color={Colors.ERROR} 
                        />
                    </View>
                    <View style={styles.textWrapper}>
                        <CustomText variant="h3" style={styles.alertTitle}>
                            Action Required
                        </CustomText>
                        <CustomText variant="caption" style={styles.alertSubtitle}>
                            You have {pendingCount} pending {pendingCount === 1 ? 'application' : 'applications'} awaiting review.
                        </CustomText>
                    </View>
                </View>
                
                <CustomButton 
                    title="Review Requests" 
                    onPress={onReviewPress}
                    variant="primary"
                    style={styles.reviewButton}
                    textStyle={styles.reviewButtonText}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    alertCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.STATUS_PENDING_BORDER,
        ...GlobalStyles.dropShadow(3),
    },
    alertHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
    },
    alertTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: 240,
        gap: 12,
    },
    alertIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.ERROR_BG,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textWrapper: {
        flex: 1,
    },
    alertTitle: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    alertSubtitle: {
        color: Colors.TEXT_SECONDARY,
    },
    reviewButton: {
        height: 40,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    reviewButtonText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_APPROVED_BG,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
        gap: 12,
    },
    successIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successTitle: {
        color: Colors.STATUS_APPROVED_TEXT,
        fontWeight: 'bold',
        fontSize: 14,
    },
    successSubtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
    },
});

export default PendingPanel;
