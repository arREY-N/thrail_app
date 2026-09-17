/**
 * @file OfferCard.tsx
 * @description Card component displaying high-level offer info, booking counts, actions, and status in the Admin screen.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Booking } from '@/src/core/models/Booking/Booking';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { useScrollFades } from '@/src/hooks/useScrollFades';
import { useWebDragScroll } from '@/src/hooks/useWebDragScroll';
import { formatDateToStandard } from '@/src/utils/dateFormatter';
import SlotsCounter from './SlotsCounter';

export interface OfferStatusDetails {
    /** The status label string (e.g. 'Active', 'Expired') */
    label: string;
    /** The status background color */
    bg: string;
    /** The status text color */
    color: string;
}

/**
 * Props for the OfferCard component.
 * 
 * @param offer - The offer data object containing price, trail info, etc.
 * @param bookings - The bookings associated with this offer to measure reservation slots.
 * @param statusDetails - Object detailing the visual attributes of the offer status badge.
 * @param actionableCount - Count of active bookings that need admin action.
 * @param onViewBookings - Callback function to view bookings for this offer.
 * @param onEditPress - Callback function to edit the details of this offer.
 * @param style - Optional style override prop.
 */
export interface OfferCardProps {
    offer: any;
    bookings: Booking[];
    statusDetails: OfferStatusDetails;
    actionableCount: number;
    onViewBookings: (offerId: string) => void;
    onEditPress: (offerId: string) => void;
    style?: StyleProp<ViewStyle>;
}

/**
 * OfferCard — Displays an offer's high-level information, slots utilization stats, 
 * details and side-by-side action buttons.
 */
const OfferCard: React.FC<OfferCardProps> = ({ 
    offer, 
    bookings = [],
    statusDetails, 
    actionableCount, 
    onViewBookings, 
    onEditPress,
    style
}) => {
    const { isDesktop, isTablet } = useBreakpoints();
    const isWide = isDesktop || isTablet;
    const isDescLong = (offer.description || '').length > 100;
    const [isExpanded, setIsExpanded] = useState(false);

    const badgeScrollRef = useRef<ScrollView>(null);
    const { showLeftFade, showRightFade, scrollProps } = useScrollFades();
    useWebDragScroll(badgeScrollRef, true);

    return (
        <View style={[styles.offerCard, style]}>
            {/* 1. Header (Trail Name and Price) */}
            <View style={styles.cardHeader}>
                <View style={styles.trailInfo}>
                    <View style={styles.labelRow}>
                        <CustomText variant="label" style={styles.trailLabel}>
                            TRAIL
                        </CustomText>
                        
                        {statusDetails.label !== 'Active' && (
                            <View style={[styles.statusBadge, { backgroundColor: statusDetails.bg }]}>
                                <CustomText style={[styles.statusBadgeText, { color: statusDetails.color }]}>
                                    {statusDetails.label}
                                </CustomText>
                            </View>
                        )}
                    </View>

                    <CustomText variant="h3" style={styles.trailName} numberOfLines={1}>
                        {offer.trail?.name || "Unknown Trail"}
                    </CustomText>
                </View>
                
                <View style={styles.priceInfo}>
                    <CustomText variant="title" style={styles.priceText}>
                        ₱{offer.price}
                    </CustomText>
                    <CustomText variant="caption" style={styles.perPax}>
                        / person
                    </CustomText>
                </View>
            </View>

            {/* 2. Collapsible Description (Chevron click) */}
            {offer.description ? (
                <TouchableOpacity 
                    activeOpacity={isDescLong && !isWide ? 0.8 : 1}
                    onPress={() => isDescLong && !isWide && setIsExpanded(!isExpanded)}
                    disabled={isWide || !isDescLong}
                    style={styles.descriptionWrapper}
                >
                    <CustomText 
                        variant="caption" 
                        style={styles.description} 
                        numberOfLines={isWide ? 1 : (isExpanded ? undefined : 1)}
                    >
                        {offer.description}
                    </CustomText>
                    {isDescLong && !isWide && (
                        <View style={styles.expandIconContainer}>
                            <CustomIcon
                                library="Feather"
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={14}
                                color={Colors.PRIMARY}
                            />
                        </View>
                    )}
                </TouchableOpacity>
            ) : null}

            {/* 3. Divider */}
            <View style={styles.divider} />

            {/* 4. Details scroll track (Horizontal Scroll with Fades) */}
            <View style={styles.badgeContainer}>
                <ScrollView 
                    ref={badgeScrollRef}
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.detailsGrid}
                    {...scrollProps}
                >
                    <View style={[styles.detailRow, statusDetails.label === 'Expired' && { backgroundColor: Colors.GRAY_ULTRALIGHT, opacity: 0.8 }]}>
                        <CustomIcon 
                            library="Feather" 
                            name="calendar" 
                            size={14} 
                            color={Colors.TEXT_SECONDARY} 
                            style={styles.badgeIcon}
                        />
                        <CustomText 
                            variant="caption" 
                            style={[
                                styles.detailText, 
                                statusDetails.label === 'Expired' && { color: Colors.ERROR }
                            ]}
                        >
                            {formatDateToStandard(offer.date || offer.hikeDate)}
                        </CustomText>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <CustomIcon 
                            library="Feather" 
                            name="clock" 
                            size={14} 
                            color={Colors.TEXT_SECONDARY} 
                            style={styles.badgeIcon}
                        />
                        <CustomText variant="caption" style={styles.detailText}>
                            {offer.duration || offer.hikeDuration || "1 Day"}
                        </CustomText>
                    </View>

                    {/* Repositioned Required Documents chips in scroll track */}
                    {offer.documents && offer.documents.map((doc: string, idx: number) => (
                        <View key={idx} style={[styles.detailRow, styles.docDetailRow]}>
                            <CustomIcon 
                                library="Feather" 
                                name="file-text" 
                                size={12} 
                                color={Colors.TEXT_SECONDARY}
                                style={styles.badgeIcon}
                            />
                            <CustomText variant="caption" style={styles.docDetailText}>
                                {doc}
                            </CustomText>
                        </View>
                    ))}
                </ScrollView>

                {showLeftFade && (
                    <LinearGradient 
                        colors={[Colors.WHITE, Colors.WHITE_FADE_HALF, Colors.WHITE_TRANSPARENT]} 
                        start={{ x: 0, y: 0 }} 
                        end={{ x: 1, y: 0 }} 
                        style={styles.leftFade} 
                        pointerEvents="none" 
                    />
                )}

                {showRightFade && (
                    <LinearGradient 
                        colors={[Colors.WHITE_TRANSPARENT, Colors.WHITE_FADE_HALF, Colors.WHITE]} 
                        start={{ x: 0, y: 0 }} 
                        end={{ x: 1, y: 0 }} 
                        style={styles.rightFade} 
                        pointerEvents="none" 
                    />
                )}
            </View>

            {/* 5. Slots reservation counter */}
            {statusDetails.label === 'Active' && (
                <SlotsCounter 
                    bookings={bookings} 
                    minPax={Number(offer.minPax) || 0} 
                    maxPax={Number(offer.maxPax) || 0} 
                />
            )}

            {/* 6. Buttons Row */}
            <View style={styles.buttonRow}>
                {statusDetails.label === 'Active' ? (
                    <>
                        <View style={styles.actionButtonWrapper}>
                            {actionableCount > 0 && (
                                <View style={styles.buttonNotificationDot}>
                                    <CustomText style={styles.notificationText}>
                                        {actionableCount > 99 ? '99+' : actionableCount}
                                    </CustomText>
                                </View>
                            )}
                            <CustomButton 
                                title="Manage Bookings"
                                onPress={() => onViewBookings(offer.id)}
                                variant="primary"
                                icon="calendar-clear"
                                iconLibrary="Ionicons"
                                style={styles.viewBookingsButton}
                            />
                        </View>

                        <View style={styles.editButtonWrapper}>
                            <CustomButton 
                                title="Edit"
                                onPress={() => onEditPress(offer.id)}
                                variant="outline"
                                icon="edit"
                                iconLibrary="Feather"
                                style={styles.editButton}
                            />
                        </View>
                    </>
                ) : (
                    <View style={{ flex: 1 }}>
                        <CustomButton 
                           title="Manage Bookings"
                           onPress={() => onViewBookings(offer.id)}
                           variant="primary"
                           icon="calendar-clear"
                           iconLibrary="Ionicons"
                           style={styles.viewBookingsButton}
                        />
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    offerCard: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 24, 
        padding: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        ...GlobalStyles.dropShadow(3), 
    },
    offerCardWide: {
        minHeight: 315,
        justifyContent: 'space-between',
    },
    topGroup: {
        width: '100%',
    },
    bottomGroup: {
        width: '100%',
        marginTop: 12,
    },
    cardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start' 
    },
    trailInfo: { 
        flex: 1, 
        paddingRight: 12 
    },
    labelRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 8, 
        minHeight: 20 
    },
    statusBadge: { 
        paddingHorizontal: 6, 
        paddingVertical: 2, 
        borderRadius: 8 
    },
    statusBadgeText: { 
        fontSize: 10, 
        fontWeight: 'bold', 
        letterSpacing: 0.5 
    },
    trailLabel: { 
        color: Colors.PRIMARY, 
        fontWeight: 'bold', 
        fontSize: 12, 
        letterSpacing: 2 
    },
    trailName: { 
        fontSize: 18, 
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0
    },
    priceInfo: { 
        alignItems: 'flex-end', 
        gap: 0 
    },
    priceText: { 
        color: Colors.PRIMARY, 
        fontSize: 20 
    },
    perPax: { 
        color: Colors.TEXT_SECONDARY, 
        marginTop: -4, 
        fontSize: 12 
    },
    descriptionWrapper: {
        marginTop: 10,
        marginBottom: 2,
    },
    description: { 
        color: Colors.TEXT_SECONDARY, 
        lineHeight: 18, 
        marginBottom: 0 
    },
    expandIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 2,
        marginTop: 2,
    },
    divider: { 
        height: 1, 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        marginVertical: 12 
    },
    badgeContainer: {
        position: 'relative',
        width: '100%',
        marginBottom: 12,
    },
    detailsGrid: { 
        flexDirection: 'row', 
        alignItems: 'center',
        gap: 12,
        paddingRight: 24,
    },
    leftFade: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 24,
        zIndex: 2,
    },
    rightFade: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 24,
        zIndex: 2,
    },
    detailRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 6, 
        gap: 6 
    },
    badgeIcon: {
        marginTop: 3
    },
    detailText: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: '500' 
    },
    docDetailRow: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 0,
    },
    docDetailText: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 12,
        marginTop: 4,
        width: '100%',
    },
    actionButtonWrapper: { 
        flex: 1.5,
        position: 'relative', 
        alignItems: 'stretch',
    },
    editButtonWrapper: {
        flex: 1,
        alignItems: 'stretch',
    },
    buttonNotificationDot: { 
        position: 'absolute', 
        top: -8, 
        right: -8, 
        backgroundColor: Colors.ERROR, 
        minWidth: 24, 
        height: 24, 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 10, 
        paddingHorizontal: 6, 
        borderWidth: 2, 
        borderColor: Colors.WHITE 
    },
    notificationText: { 
        color: Colors.WHITE, 
        fontWeight: 'bold', 
        fontSize: 11 
    },
    viewBookingsButton: { 
        paddingVertical: 10,
        flex: 1,
        height: '100%',
    },
    editButton: { 
        paddingVertical: 10,
        flex: 1,
        height: '100%',
    },
    expiredSlotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 10,
        borderRadius: 12,
        gap: 6,
        marginBottom: 12,
    },
    expiredSlotsText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    }
});

export default OfferCard;
