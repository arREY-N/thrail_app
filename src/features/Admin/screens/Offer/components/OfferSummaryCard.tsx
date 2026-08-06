/**
 * @file OfferSummaryCard.tsx
 * @description Card component displaying a summary of an offer's details with a collapsible section to show full package details.
 */

import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IBooking } from '@/src/core/models/Booking/Booking.types';
import { IOffer } from '@/src/core/models/Offer/interfaces/Offer.types';
import { formatDate } from '@/src/core/utility/date';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { useScrollFades } from '@/src/hooks/useScrollFades';
import { useWebDragScroll } from '@/src/hooks/useWebDragScroll';
import { formatActivityTime } from '@/src/utils/dateFormatter';
import SlotsCounter from './SlotsCounter';

/**
 * Props for the OfferSummaryCard component.
 * 
 * @param offer - The offer data object containing price, schedule, inclusions, etc.
 * @param trailName - The display name of the trail related to the offer.
 * @param bookings - List of bookings associated with this offer to measure reservation slots.
 * @param isOfferLocked - Whether the offer is expired/cancelled/rescheduled.
 */
export interface OfferSummaryCardProps {
    offer: IOffer & { hikeDuration?: string };
    trailName: string;
    bookings?: IBooking[];
    isOfferLocked?: boolean;
}



/**
 * OfferSummaryCard — Displays a quick overview of an offer's details.
 */
const OfferSummaryCard: React.FC<OfferSummaryCardProps> = ({ 
    offer, 
    trailName,
    bookings = [],
    isOfferLocked = false
}) => {
    const { isMobile } = useBreakpoints();
    const isWide = !isMobile;
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>(() => {
        const hasSecondDay = isWide && offer?.schedule && offer.schedule.length > 1;
        return (hasSecondDay ? { 0: true, 1: true } : { 0: true }) as Record<number, boolean>;
    });
    const [expandedActivities, setExpandedActivities] = useState<Record<number, boolean>>({});

    const badgeScrollRef = useRef<ScrollView>(null);
    const { showLeftFade, showRightFade, scrollProps } = useScrollFades();
    useWebDragScroll(badgeScrollRef, true);

    if (!offer) return null;

    const totalDays = offer.schedule?.length ?? 0;
    const allDaysExpanded = totalDays > 0 && Array.from({ length: totalDays }).every((_, i) => Object.prototype.hasOwnProperty.call(expandedDays, i) ? expandedDays[i] : false);

    const toggleDay = (dayIdx: number) => {
        setExpandedDays(prev => {
            const next = { ...prev };
            next[dayIdx] = !Object.prototype.hasOwnProperty.call(prev, dayIdx) ? true : !prev[dayIdx];
            return next;
        });
    };

    const toggleActivities = (dayIdx: number) => {
        setExpandedActivities(prev => {
            const next = { ...prev };
            next[dayIdx] = !Object.prototype.hasOwnProperty.call(prev, dayIdx) ? true : !prev[dayIdx];
            return next;
        });
    };

    const toggleAllDays = () => {
        if (allDaysExpanded) {
            setExpandedDays({});
        } else {
            const nextExpanded: Record<number, boolean> = {};
            offer.schedule?.forEach((_: any, i: number) => {
                nextExpanded[i] = true;
            });
            setExpandedDays(nextExpanded);
        }
    };

    const status = (offer.status || '').toString().toLowerCase();
    const offerDate = new Date(offer.date || offer.hikeDate || 0);
    offerDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isExpired = offerDate < today;

    return (
        <View style={styles.offerSummaryCard}>
            <View style={styles.headerRow}>
                <View style={styles.headerTitleGroup}>
                    <View style={styles.labelRow}>
                        <CustomText variant="label" style={styles.trailLabel}>
                            TRAIL OFFER
                        </CustomText>
                        {status === 'cancelled' && (
                            <View style={[styles.statusBadge, { backgroundColor: Colors.ERROR_BG }]}>
                                <CustomText style={[styles.statusBadgeText, { color: Colors.ERROR }]}>
                                    Cancelled
                                </CustomText>
                            </View>
                        )}
                        {status === 'rescheduled' && (
                            <View style={[styles.statusBadge, { backgroundColor: Colors.STATUS_WARNING_BG }]}>
                                <CustomText style={[styles.statusBadgeText, { color: Colors.WARNING }]}>
                                    Rescheduled
                                </CustomText>
                            </View>
                        )}
                        {isExpired && status !== 'cancelled' && status !== 'rescheduled' && (
                            <View style={[styles.statusBadge, { backgroundColor: Colors.GRAY_ULTRALIGHT }]}>
                                <CustomText style={[styles.statusBadgeText, { color: Colors.TEXT_SECONDARY }]}>
                                    Expired
                                </CustomText>
                            </View>
                        )}
                    </View>
                    <CustomText variant="h2" style={styles.trailName}>
                        {trailName}
                    </CustomText>
                </View>
                
                <View style={styles.priceGroup}>
                    <CustomText variant="h3" style={styles.priceText}>
                        ₱{offer.price}
                    </CustomText>
                    <CustomText style={styles.priceSubText}>
                        / person
                    </CustomText>
                </View>
            </View>

            {offer.description && !isExpanded && (
                <CustomText 
                    variant="caption" 
                    style={[styles.descText, { marginBottom: 8 }]} 
                    numberOfLines={2}
                >
                    {offer.description}
                </CustomText>
            )}

            {isExpanded ? (
                <View style={styles.chipRow}>
                    {offer?.date || offer?.hikeDate ? (
                        <View style={styles.infoChip}>
                            <CustomIcon 
                                library="Feather" 
                                name="calendar" 
                                size={14} 
                                color={Colors.TEXT_SECONDARY} 
                            />
                            <CustomText style={styles.chipText}>
                                {formatDate(offer.date || offer.hikeDate)}
                            </CustomText>
                        </View>
                    ) : null}
                    
                    {offer?.duration || offer?.hikeDuration ? (
                        <View style={styles.infoChip}>
                            <CustomIcon 
                                library="Feather" 
                                name="clock" 
                                size={14} 
                                color={Colors.TEXT_SECONDARY} 
                            />
                            <CustomText style={styles.chipText}>
                                {offer.duration || offer.hikeDuration}
                            </CustomText>
                        </View>
                    ) : null}

                    {offer?.documents && offer.documents.map((doc: string, idx: number) => {
                        if (!doc) return null;
                        return (
                            <View key={idx} style={styles.infoChip}>
                                <CustomIcon 
                                    library="Feather" 
                                    name="file-text" 
                                    size={14} 
                                    color={Colors.TEXT_SECONDARY} 
                                />
                                <CustomText style={styles.chipText}>
                                    {doc}
                                </CustomText>
                            </View>
                        );
                    })}
                </View>
            ) : (
                <View style={styles.badgeContainer}>
                    <ScrollView 
                        ref={badgeScrollRef}
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipRowSummary}
                        {...scrollProps}
                    >
                        {offer?.date || offer?.hikeDate ? (
                            <View style={styles.infoChip}>
                                <CustomIcon 
                                    library="Feather" 
                                    name="calendar" 
                                    size={14} 
                                    color={Colors.TEXT_SECONDARY} 
                                />
                                <CustomText style={styles.chipText}>
                                    {formatDate(offer.date || offer.hikeDate)}
                                </CustomText>
                            </View>
                        ) : null}
                        
                        {offer?.duration || offer?.hikeDuration ? (
                            <View style={styles.infoChip}>
                                <CustomIcon 
                                    library="Feather" 
                                    name="clock" 
                                    size={14} 
                                    color={Colors.TEXT_SECONDARY} 
                                />
                                <CustomText style={styles.chipText}>
                                    {offer.duration || offer.hikeDuration}
                                </CustomText>
                            </View>
                        ) : null}

                        {offer?.documents && offer.documents.map((doc: string, idx: number) => {
                            if (!doc) return null;
                            return (
                                <View key={idx} style={styles.infoChip}>
                                    <CustomIcon 
                                        library="Feather" 
                                        name="file-text" 
                                        size={14} 
                                        color={Colors.TEXT_SECONDARY} 
                                    />
                                    <CustomText style={styles.chipText}>
                                        {doc}
                                    </CustomText>
                                </View>
                            );
                        })}
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
            )}

            {!isOfferLocked && bookings && (
                <SlotsCounter 
                    bookings={bookings} 
                    minPax={Number(offer.minPax) || 0} 
                    maxPax={Number(offer.maxPax) || 0} 
                />
            )}

            {isExpanded && (
                <View style={styles.expandedContent}>
                    <View style={styles.divider} />
                    
                    {offer.description && (
                        <View style={styles.detailSection}>
                            <CustomText variant="label" style={styles.sectionHeading}>
                                About this package
                            </CustomText>
                            <CustomText style={styles.detailDescText}>
                                {offer.description}
                            </CustomText>
                        </View>
                    )}

                    {offer.schedule && offer.schedule.length > 0 && (
                        <View style={styles.detailSection}>
                            <View style={styles.itineraryHeaderRow}>
                                <CustomText variant="label" style={styles.sectionHeading}>
                                    Itinerary
                                </CustomText>
                                {offer.schedule.length > 1 && (
                                    <TouchableOpacity 
                                        onPress={toggleAllDays} 
                                        style={styles.expandAllButton}
                                        activeOpacity={0.7}
                                    >
                                        <CustomText style={styles.expandAllText}>
                                            {allDaysExpanded ? 'Collapse All' : 'Expand All'}
                                        </CustomText>
                                        <CustomIcon 
                                            library="Feather" 
                                            name={allDaysExpanded ? "chevron-up" : "chevron-down"} 
                                            size={12} 
                                            color={Colors.PRIMARY} 
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={isWide ? styles.itineraryGridContainer : styles.itineraryVerticalContainer}>
                                {offer.schedule.map((dayItem: any, dayIdx: number) => {
                                    const isDayExpanded = offer.schedule.length === 1 || (Object.prototype.hasOwnProperty.call(expandedDays, dayIdx) ? !!expandedDays[dayIdx] : false);
                                    const activitiesList = dayItem.activities || [];
                                    const hasManyActivities = activitiesList.length > 4;
                                    const isActivitiesExpanded = Object.prototype.hasOwnProperty.call(expandedActivities, dayIdx) ? !!expandedActivities[dayIdx] : false;
                                    const visibleActivities = hasManyActivities && !isActivitiesExpanded 
                                        ? activitiesList.slice(0, 4) 
                                        : activitiesList;

                                    return (
                                        <View 
                                            key={dayIdx} 
                                            style={[
                                                styles.dayContainer, 
                                                isWide && { width: '48.5%', minWidth: 320, marginBottom: 12, flexGrow: 1 }
                                            ]}
                                        >
                                            <TouchableOpacity 
                                                activeOpacity={0.7} 
                                                onPress={() => offer.schedule.length > 1 && toggleDay(dayIdx)}
                                                style={styles.dayHeaderRow}
                                                disabled={offer.schedule.length <= 1}
                                            >
                                                <View style={styles.dayTitleGroup}>
                                                    <CustomIcon 
                                                        library="Feather" 
                                                        name="calendar" 
                                                        size={14} 
                                                        color={Colors.PRIMARY} 
                                                        style={styles.dayCalendarIcon}
                                                    />
                                                    <CustomText style={styles.dayTitle}>Day {dayItem.day || (dayIdx + 1)}</CustomText>
                                                </View>
                                                {offer.schedule.length > 1 && (
                                                    <CustomIcon 
                                                        library="Feather" 
                                                        name={isDayExpanded ? "chevron-up" : "chevron-down"} 
                                                        size={16} 
                                                        color={Colors.TEXT_SECONDARY} 
                                                    />
                                                )}
                                            </TouchableOpacity>
                                            
                                            {isDayExpanded && (
                                                <>
                                                    {activitiesList.length > 0 && <View style={styles.dayDivider} />}
                                                    <View style={styles.activitiesList}>
                                                        {visibleActivities.map((activity: any, actIdx: number) => {
                                                            const isLast = actIdx === visibleActivities.length - 1 && !hasManyActivities;
                                                            return (
                                                                <View key={actIdx} style={styles.activityRow}>
                                                                    <View style={styles.timelineColumn}>
                                                                        <View style={styles.timelineCircle} />
                                                                        {!isLast && <View style={styles.timelineLine} />}
                                                                    </View>
                                                                    <CustomText style={styles.activityTime}>
                                                                        {formatActivityTime(activity.time)}
                                                                    </CustomText>
                                                                    <CustomText style={styles.activityEvent}>
                                                                        {activity.event}
                                                                    </CustomText>
                                                                </View>
                                                            );
                                                        })}
                                                        
                                                        {hasManyActivities && (
                                                            <TouchableOpacity 
                                                                activeOpacity={0.7} 
                                                                onPress={() => toggleActivities(dayIdx)}
                                                                style={styles.showMoreRow}
                                                            >
                                                                <View style={styles.timelineColumn}>
                                                                    <View style={styles.plusCircle}>
                                                                        <CustomIcon 
                                                                            library="Feather" 
                                                                            name={isActivitiesExpanded ? "minus" : "plus"} 
                                                                            size={10} 
                                                                            color={Colors.WHITE} 
                                                                        />
                                                                    </View>
                                                                </View>
                                                                <CustomText style={styles.showMoreText}>
                                                                    {isActivitiesExpanded 
                                                                        ? 'Show less' 
                                                                        : `Show ${activitiesList.length - 4} more activities`}
                                                                </CustomText>
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                </>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {offer.inclusions && offer.inclusions.length > 0 && (
                        <View style={styles.detailSection}>
                            <CustomText variant="label" style={styles.sectionHeading}>
                                Inclusions
                            </CustomText>
                            <View style={styles.listGrid}>
                                {offer.inclusions.map((inclusion: string, index: number) => (
                                    <View key={index} style={styles.listItemRow}>
                                        <CustomIcon 
                                            library="Feather" 
                                            name="check-circle" 
                                            size={14} 
                                            color={Colors.PRIMARY} 
                                            style={styles.listIcon}
                                        />
                                        <CustomText style={styles.listItemText}>
                                            {inclusion}
                                        </CustomText>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {offer.thingsToBring && offer.thingsToBring.length > 0 && (
                        <View style={styles.detailSection}>
                            <CustomText variant="label" style={styles.sectionHeading}>
                                Things to bring
                            </CustomText>
                            <View style={styles.listGrid}>
                                {offer.thingsToBring.map((item: string, index: number) => (
                                    <View key={index} style={styles.listItemRow}>
                                        <View style={styles.bulletDot} />
                                        <CustomText style={styles.listItemText}>
                                            {item}
                                        </CustomText>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {offer.reminders && offer.reminders.length > 0 && (
                        <View style={styles.remindersCard}>
                            <View style={styles.remindersHeader}>
                                <CustomIcon 
                                    library="Feather" 
                                    name="alert-circle" 
                                    size={16} 
                                    color={Colors.PRIMARY} 
                                />
                                <CustomText style={styles.remindersHeading}>
                                    Important reminders
                                </CustomText>
                            </View>
                            <View style={styles.remindersList}>
                                {offer.reminders.map((reminder: string, index: number) => (
                                    <View key={index} style={styles.reminderItemRow}>
                                        <View style={styles.bulletDotPrimary} />
                                        <CustomText style={styles.reminderItemText}>
                                            {reminder}
                                        </CustomText>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            )}

            <TouchableOpacity 
                style={[styles.expandButton, { marginTop: isExpanded ? 16 : 0 }]} 
                onPress={() => setIsExpanded(!isExpanded)}
                activeOpacity={0.7}
            >
                <CustomText style={styles.expandButtonText}>
                    {isExpanded ? "Show Less" : "Show Details"}
                </CustomText>
                <CustomIcon 
                    library="Feather" 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={Colors.PRIMARY} 
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    offerSummaryCard: { 
        backgroundColor: Colors.WHITE, 
        padding: 20, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        marginBottom: 24,
        ...GlobalStyles.dropShadow(3)
    },
    headerRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: 16 
    },
    headerTitleGroup: { 
        flex: 1, 
        paddingRight: 16 
    },
    trailLabel: { 
        color: Colors.PRIMARY, 
        letterSpacing: 1, 
        marginBottom: 4, 
        fontSize: 11 
    },
    trailName: { 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0
    },
    priceGroup: { 
        alignItems: 'flex-end' 
    },
    priceText: { 
        fontWeight: 'bold', 
        color: Colors.PRIMARY, 
        marginBottom: 2 
    },
    priceSubText: { 
        fontSize: 12, 
        color: Colors.TEXT_SECONDARY 
    },
    badgeContainer: {
        position: 'relative',
        width: '100%',
        marginBottom: 12,
    },
    chipRowSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
    chipRow: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: 8, 
        marginBottom: 12 
    },
    infoChip: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: Colors.INFO_CHIP_BG, 
        paddingHorizontal: 10, 
        paddingVertical: 6, 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        gap: 6 
    },
    chipText: { 
        fontSize: 12, 
        fontWeight: '600', 
        color: Colors.TEXT_PRIMARY 
    },
    descText: { 
        color: Colors.TEXT_SECONDARY, 
        lineHeight: 20 
    },
    expandedContent: {
        width: '100%',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginTop: 4,
        marginBottom: 16,
    },
    detailSection: {
        marginBottom: 16,
    },
    sectionHeading: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    itineraryHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    expandAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 4,
    },
    expandAllText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    detailDescText: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 20,
    },
    dayContainer: {
        backgroundColor: Colors.DAY_CONTAINER_BG,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.DAY_BORDER,
    },
    dayDivider: {
        height: 1,
        backgroundColor: Colors.DAY_BORDER,
        marginVertical: 8,
    },
    dayHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 2,
    },
    dayTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dayCalendarIcon: {
        marginTop: -1,
    },
    dayTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    activitiesList: {
        paddingLeft: 4,
    },
    activityRow: {
        flexDirection: 'row',
        paddingVertical: 4,
        gap: 12,
    },
    timelineColumn: {
        alignItems: 'center',
        width: 16,
        position: 'relative',
    },
    timelineCircle: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.PRIMARY,
        zIndex: 2,
        marginTop: 6,
    },
    timelineLine: {
        position: 'absolute',
        top: 12,
        bottom: -20,
        left: 7,
        width: 2,
        backgroundColor: Colors.GRAY_LIGHT,
        zIndex: 1,
    },
    activityTime: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    activityEvent: {
        flex: 1,
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
    },
    showMoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        gap: 12,
    },
    plusCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        marginTop: 2,
    },
    showMoreText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.PRIMARY,
        lineHeight: 18,
    },
    itineraryGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    itineraryVerticalContainer: {
        flexDirection: 'column',
    },
    listGrid: {
        gap: 6,
    },
    listItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    listIcon: {
        marginTop: 1,
    },
    listItemText: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
    },
    bulletDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: Colors.TEXT_SECONDARY,
        marginHorizontal: 4,
        marginTop: 1,
    },
    remindersCard: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 16,
        borderRadius: 12,
        marginTop: 4,
        gap: 10,
    },
    remindersHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    remindersHeading: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    remindersList: {
        gap: 8,
    },
    reminderItemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    bulletDotPrimary: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: Colors.PRIMARY,
        marginRight: 8,
        marginTop: 7,
    },
    reminderItemText: {
        flex: 1,
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        gap: 6,
        width: '100%',
    },
    expandButtonText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
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
    }
});

export default OfferSummaryCard;
