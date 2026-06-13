import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

/** Configuration object returned by getBannerConfig for each booking status. */
interface BannerConfig {
    title: string;
    icon: string;
    color: string;
    bg: string;
    showReason?: boolean;
}

/** Union of all supported booking status strings for the banner display. */
type BannerStatus =
    | 'for-reservation'
    | 'pending-docs'
    | 'approved-docs'
    | 'for-payment'
    | 'downpayment'
    | 'paid'
    | 'completed'
    | 'finished'
    | 'reservation-rejected'
    | 'for-reschedule'
    | 'reschedule-rejected'
    | 'rescheduled'
    | 'for-cancellation'
    | 'cancellation-rejected'
    | 'cancelled'
    | 'refund'
    | 'refunded'
    | 'expired';

/**
 * Returns the visual configuration (title, icon, colors) for a given booking status.
 * @param status - The current booking status string.
 */
const getBannerConfig = (status: string): BannerConfig => {
    switch (status) {
        case 'for-reservation':
        case 'pending-docs':
            return { 
                title: "Awaiting Document Review", 
                icon: "file-text", 
                color: Colors.PRIMARY, 
                bg: Colors.STATUS_APPROVED_BG 
            };
        case 'approved-docs':
        case 'for-payment':
            return { 
                title: "Awaiting Payment from Hiker", 
                icon: "clock", 
                color: Colors.STATUS_PENDING_TEXT, 
                bg: Colors.STATUS_PENDING_BG 
            };
        case 'downpayment':
            return { 
                title: "Downpayment Received (50%)", 
                icon: "pie-chart", 
                color: Colors.STATUS_WARNING_TEXT, 
                bg: Colors.STATUS_WARNING_BG 
            };
        case 'paid':
            return { 
                title: "Payment Received - Needs Verification", 
                icon: "shield", 
                color: Colors.PRIMARY, 
                bg: Colors.STATUS_APPROVED_BG 
            };
        case 'completed':
        case 'finished':
            return { 
                title: "Booking Completed & Approved", 
                icon: "check-circle", 
                color: Colors.SUCCESS, 
                bg: '#E8F5E9' 
            };
        
        case 'reservation-rejected':
            return { 
                title: "Booking Rejected", 
                icon: "alert-circle", 
                color: Colors.ERROR, 
                bg: Colors.ERROR_BG, 
                showReason: true 
            };
        
        case 'for-reschedule':
            return { 
                title: "Reschedule Requested", 
                icon: "calendar", 
                color: Colors.STATUS_WARNING_TEXT, 
                bg: Colors.STATUS_WARNING_BG 
            };
        case 'reschedule-rejected':
            return { 
                title: "Reschedule Declined", 
                icon: "x-octagon", 
                color: Colors.ERROR, 
                bg: Colors.ERROR_BG 
            };
        case 'rescheduled':
            return { 
                title: "Booking Rescheduled", 
                icon: "calendar", 
                color: Colors.SUCCESS, 
                bg: '#E8F5E9' 
            };
        
        case 'for-cancellation':
            return { 
                title: "Cancellation Requested", 
                icon: "alert-triangle", 
                color: Colors.STATUS_WARNING_TEXT, 
                bg: Colors.STATUS_WARNING_BG, 
                showReason: true 
            };
        case 'cancellation-rejected':
            return { 
                title: "Cancellation Declined", 
                icon: "x-octagon", 
                color: Colors.ERROR, 
                bg: Colors.ERROR_BG 
            };
        case 'cancelled':
            return { 
                title: "Booking Cancelled", 
                icon: "x-circle", 
                color: Colors.ERROR, 
                bg: Colors.ERROR_BG, 
                showReason: true 
            };
        
        case 'refund':
        case 'refunded':
            return { 
                title: "Booking Refunded", 
                icon: "refresh-ccw", 
                color: Colors.ERROR, 
                bg: Colors.ERROR_BG, 
                showReason: true 
            };
        
        case 'expired':
            return { 
                title: "Booking Expired", 
                icon: "clock", 
                color: Colors.TEXT_SECONDARY, 
                bg: Colors.GRAY_ULTRALIGHT 
            };
        
        default:
            return { 
                title: "Unknown Status", 
                icon: "help-circle", 
                color: Colors.TEXT_SECONDARY, 
                bg: Colors.GRAY_ULTRALIGHT 
            };
    }
};

/**
 * Props for the ReviewStatusBanner component.
 * @param currentStatus - The booking's current status string.
 * @param cancellationReason - Optional reason text if booking was cancelled.
 * @param rejectionReason - Optional reason text if booking was rejected.
 */
interface ReviewStatusBannerProps {
    currentStatus: string;
    cancellationReason?: string;
    rejectionReason?: string;
}

/**
 * ReviewStatusBanner — Displays a colored status banner at the top of the
 * admin booking review screen, with an optional reason message.
 */
const ReviewStatusBanner = ({ 
    currentStatus, 
    cancellationReason,
    rejectionReason 
}: ReviewStatusBannerProps) => {
    if (!currentStatus) return null;

    const config = getBannerConfig(currentStatus);
    const reasonText = cancellationReason || rejectionReason;

    return (
        <View 
            style={[
                styles.completedBanner,
                {
                    borderColor: config.color,
                    backgroundColor: config.bg,
                    alignItems: (config.showReason && reasonText) ? 'flex-start' : 'center'
                }
            ]}
        >
            <CustomIcon 
                library="Feather" 
                name={config.icon} 
                size={20} 
                color={config.color} 
                style={(config.showReason && reasonText) ? { marginTop: 2 } : {}}
            />
            <View style={styles.textWrapper}>
                <CustomText 
                    style={[
                        styles.completedBannerText, 
                        { color: config.color }
                    ]}
                >
                    {config.title}
                </CustomText>
                
                {config.showReason && reasonText ? (
                    <CustomText 
                        variant="caption" 
                        style={[
                            styles.reasonText, 
                            { color: config.color }
                        ]}
                    >
                        <CustomText 
                            style={[
                                styles.reasonLabel, 
                                { color: config.color }
                            ]}
                        >
                            Reason: 
                        </CustomText>
                        {reasonText}
                    </CustomText>
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    completedBanner: { 
        flexDirection: 'row', 
        padding: 16, 
        borderRadius: 12, 
        marginBottom: 16, 
        borderWidth: 1, 
        gap: 12 
    },
    textWrapper: {
        flex: 1, 
        justifyContent: 'center'
    },
    completedBannerText: { 
        fontWeight: 'bold',
        fontSize: 15
    },
    reasonText: {
        marginTop: 6, 
        lineHeight: 18
    },
    reasonLabel: {
        fontWeight: 'bold', 
        fontSize: 12
    }
});

export default ReviewStatusBanner;
