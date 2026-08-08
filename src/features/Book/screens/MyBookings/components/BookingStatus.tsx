import React from 'react';
import { Platform,  StyleSheet, View  } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { getStatusConfig } from '@/src/constants/statusConfig';
import { BookingStatus as BookingStatusType } from '@/src/core/models/Booking/Booking.types';

export interface BookingTrackerData {
    steps: Array<{ id: number, defaultLabel: string, defaultIcon: string }>;
    currentIndex: number;
    isTerminalError: boolean;
    config: any;
}

/**
 * Gets tracker data based on booking status.
 * @param {BookingStatusType | string | undefined} status - Booking status
 * @returns {BookingTrackerData} Tracker state
 */
const getTrackerData = (status?: BookingStatusType | string): BookingTrackerData => {
    const config = getStatusConfig(status, 'user');
    const rawStatus = status || 'unknown';

    const terminalStatuses = [
        'reservation-rejected', 
        'cancelled', 
        'refund', 
        'refunded', 
        'cancellation-rejected', 
        'reschedule-rejected'
    ];

    if (terminalStatuses.includes(rawStatus as string)) {
        return {
            steps: [],
            currentIndex: 0,
            isTerminalError: true,
            config
        };
    }

    const steps = [
        { id: 0, defaultLabel: 'REVIEW', defaultIcon: 'file-text' },
        { id: 1, defaultLabel: 'PAYMENT', defaultIcon: 'credit-card' },
        { id: 2, defaultLabel: 'VERIFYING', defaultIcon: 'shield' },
        { id: 3, defaultLabel: 'COMPLETED', defaultIcon: 'check-circle' }
    ];

    let currentIndex = 0;

    switch (rawStatus) {
        case 'for-reservation':
        case 'pending-docs':
            currentIndex = 0;
            break;
        case 'approved-docs':
        case 'for-payment':
            currentIndex = 1;
            break;
        case 'downpayment':
        case 'paid':
            currentIndex = 2;
            break;
        case 'completed':
        case 'rescheduled':
        case 'for-reschedule':
        case 'for-cancellation':
            currentIndex = 3;
            break;
        default:
            currentIndex = 0;
    }

    return { 
        steps, 
        currentIndex, 
        isTerminalError: false, 
        config 
    };
};

export interface BookingStatusProps {
    /** The status of the booking */
    status?: BookingStatusType | string;
    /** Optional cancellation reason */
    reason?: string;
}

/**
 * Visual tracker for the booking status.
 * 
 * @param {BookingStatusProps} props - Component props
 */
const BookingStatus = ({ status, reason }: BookingStatusProps) => {
    const { 
        steps, 
        currentIndex, 
        isTerminalError, 
        config 
    } = getTrackerData(status);

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <CustomIcon 
                    library="Feather" 
                    name="map" 
                    size={18} 
                    color={Colors.TEXT_PRIMARY} 
                />
                <CustomText variant="label" style={styles.title}>
                    Booking Status
                </CustomText>
            </View>

            {isTerminalError ? (
                // ✅ MORPHED TERMINAL BANNER (Replaces the empty white space)
                <View style={styles.terminalBanner}>
                    <View style={styles.terminalHeader}>
                        <CustomIcon 
                            library="Feather" 
                            name={config.icon} 
                            size={20} 
                            color={Colors.ERROR} 
                        />
                        <CustomText style={styles.terminalTitle}>
                            {config.label}
                        </CustomText>
                    </View>
                    
                    {reason ? (
                        <View style={styles.terminalReasonWrapper}>
                            <CustomText variant="caption" style={styles.terminalReasonText}>
                                <CustomText style={styles.terminalReasonLabel}>Reason: </CustomText>
                                {reason}
                            </CustomText>
                        </View>
                    ) : null}
                </View>
            ) : (
                // ✅ ACTIVE STEP TRACKER
                <View 
                    style={[
                        styles.trackerContainer, 
                        steps.length === 1 && { justifyContent: 'center' }
                    ]}
                >
                    {steps.map((step, index) => {
                        const isDone = index < currentIndex;
                        const isCurrent = index === currentIndex;
                        const isLastVisible = index === steps.length - 1;

                        let circleBg: string = Colors.GRAY_LIGHT;
                        let iconColor: string = Colors.TEXT_SECONDARY;
                        let iconName: string = step.defaultIcon;
                        let labelText: string = step.defaultLabel;
                        let labelColor: string = Colors.TEXT_SECONDARY;

                        if (isDone) {
                            circleBg = Colors.SUCCESS;
                            iconColor = Colors.WHITE;
                            iconName = 'check';
                            labelColor = Colors.TEXT_PRIMARY;
                        } else if (isCurrent) {
                            circleBg = config.bgColor;
                            iconColor = config.textColor === Colors.WHITE ? Colors.WHITE : config.textColor;
                            iconName = config.icon;
                            labelText = config.label;
                            labelColor = config.textColor === Colors.WHITE ? Colors.PRIMARY : config.textColor; 
                        }

                        return (
                            <React.Fragment key={step.id}>
                                <View style={styles.stepWrapper}>
                                    <View 
                                        style={[
                                            styles.circle, 
                                            { backgroundColor: circleBg }
                                        ]}
                                    >
                                        <CustomIcon 
                                            library="Feather" 
                                            name={iconName} 
                                            size={16} 
                                            color={iconColor} 
                                        />
                                    </View>
                                    <CustomText 
                                        variant="caption" 
                                        style={[
                                            styles.stepText, 
                                            { color: labelColor }, 
                                            isCurrent && styles.boldText
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {labelText}
                                    </CustomText>
                                </View>

                                {!isLastVisible && (
                                    <View 
                                        style={[
                                            styles.line, 
                                            { backgroundColor: isDone ? Colors.SUCCESS : Colors.GRAY_LIGHT }
                                        ]} 
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        padding: 20, 
        marginHorizontal: 20, 
        marginBottom: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
         
         
         
         
        ...GlobalStyles.dropShadow(3), 
    },
    headerRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 20 
    },
    title: { 
        fontWeight: 'bold', 
        fontSize: 16 
    },
    trackerContainer: { 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        justifyContent: 'space-between' 
    },
    stepWrapper: { 
        alignItems: 'center', 
        width: 75 
    }, 
    circle: { 
        width: 36, 
        height: 36, 
        borderRadius: 18, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 8 
    },
    line: { 
        flex: 1, 
        height: 2, 
        marginTop: 18, 
        marginHorizontal: -8 
    },
    stepText: { 
        fontSize: 10, 
        textAlign: 'center', 
        lineHeight: 14, 
        textTransform: 'uppercase'
    },
    boldText: { 
        fontWeight: 'bold' 
    },
    // ✅ NEW TERMINAL BANNER STYLES
    terminalBanner: {
        backgroundColor: Colors.ERROR_BG,
        borderColor: Colors.ERROR,
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
    },
    terminalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    terminalTitle: {
        color: Colors.ERROR,
        fontWeight: 'bold',
        fontSize: 15,
    },
    terminalReasonWrapper: {
        marginTop: 6,
        paddingLeft: 28, // Aligns exactly under the text, skipping the icon width
    },
    terminalReasonText: {
        color: Colors.ERROR,
        lineHeight: 18,
    },
    terminalReasonLabel: {
        fontWeight: 'bold',
        color: Colors.ERROR,
    }
});

export default BookingStatus;
