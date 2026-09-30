import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { getStatusConfig } from '@/src/constants/statusConfig';
import { BookingStatus as BookingStatusType } from '@/src/core/models/Booking/Booking';

export interface BookingStatusProps {
    /** The status of the booking */
    status?: BookingStatusType | string;
    /** Optional cancellation reason (kept for backward compatibility, not displayed in 4-step bar) */
    reason?: string;
    /** Whether payment has been captured for this booking */
    isPaid?: boolean;
}

interface StepDefinition {
    id: number;
    defaultLabel: string;
    defaultIcon: string;
}

const DEFAULT_STEPS: StepDefinition[] = [
    { id: 0, defaultLabel: 'REVIEW', defaultIcon: 'file-text' },
    { id: 1, defaultLabel: 'PAYMENT', defaultIcon: 'credit-card' },
    { id: 2, defaultLabel: 'VERIFYING', defaultIcon: 'shield' },
    { id: 3, defaultLabel: 'COMPLETED', defaultIcon: 'check-circle' },
];

/**
 * Visual 4-step progress tracker for booking lifecycle.
 * Preserves the 4 steps at all times and dynamically updates the active/cancelled step.
 */
const BookingStatus: React.FC<BookingStatusProps> = ({ status, isPaid = false }) => {
    const rawStatus = status || 'unknown';
    const config = getStatusConfig(status, 'user');

    let currentIndex = 0;
    let overrideLabel: string | undefined;
    let overrideIcon: string | undefined;
    let isErrorState = false;
    let isRefundState = false;

    switch (rawStatus) {
        case 'for-reservation':
            currentIndex = 0;
            break;
        case 'reservation-rejected':
            currentIndex = 0;
            overrideLabel = 'REJECTED';
            overrideIcon = 'x-circle';
            isErrorState = true;
            break;
        case 'approved-docs':
        case 'for-payment':
            currentIndex = 1;
            break;
        case 'expired':
            currentIndex = 1;
            overrideLabel = 'EXPIRED';
            overrideIcon = 'clock';
            isErrorState = true;
            break;
        case 'downpayment':
        case 'paid':
            currentIndex = 2;
            break;
        case 'completed':
        case 'rescheduled':
        case 'for-reschedule':
        case 'finished':
            currentIndex = 3;
            break;
        case 'reschedule-rejected':
            currentIndex = 3;
            overrideLabel = 'REJECTED';
            overrideIcon = 'x-circle';
            isErrorState = true;
            break;

        // Cancellation sub-approval overrides:
        case 'for-cancellation':
            currentIndex = isPaid ? 2 : 0;
            overrideLabel = 'CANCELLING';
            overrideIcon = 'alert-triangle';
            isErrorState = true;
            break;
        case 'cancellation-rejected':
            currentIndex = isPaid ? 2 : 0;
            overrideLabel = 'DECLINED';
            overrideIcon = 'x-octagon';
            isErrorState = true;
            break;
        case 'refund':
            currentIndex = 2;
            overrideLabel = 'REFUNDING';
            overrideIcon = 'rotate-ccw';
            isRefundState = true;
            break;
        case 'refunded':
            currentIndex = 2;
            overrideLabel = 'REFUNDED';
            overrideIcon = 'check-circle';
            isRefundState = true;
            break;
        case 'cancelled':
            currentIndex = isPaid ? 2 : 0;
            overrideLabel = 'CANCELLED';
            overrideIcon = 'x-circle';
            isErrorState = true;
            break;
        default:
            currentIndex = 0;
    }

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

            <View style={styles.trackerContainer}>
                {DEFAULT_STEPS.map((step, index) => {
                    const isDone = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isLastVisible = index === DEFAULT_STEPS.length - 1;

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
                        if (isErrorState) {
                            circleBg = Colors.STATUS_CANCELLED_BG;
                            iconColor = Colors.ERROR;
                            iconName = overrideIcon || 'alert-triangle';
                            labelText = overrideLabel || config.label;
                            labelColor = Colors.ERROR;
                        } else if (isRefundState) {
                            circleBg = rawStatus === 'refunded' ? Colors.STATUS_APPROVED_BG : '#FEF3C7';
                            iconColor = rawStatus === 'refunded' ? Colors.PRIMARY : '#D97706';
                            iconName = overrideIcon || 'rotate-ccw';
                            labelText = overrideLabel || config.label;
                            labelColor = rawStatus === 'refunded' ? Colors.PRIMARY : '#92400E';
                        } else {
                            circleBg = config.bgColor;
                            iconColor = config.textColor === Colors.WHITE ? Colors.WHITE : config.textColor;
                            iconName = config.icon;
                            labelText = config.label;
                            labelColor = config.textColor === Colors.WHITE ? Colors.PRIMARY : config.textColor;
                        }
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
});

export default BookingStatus;
