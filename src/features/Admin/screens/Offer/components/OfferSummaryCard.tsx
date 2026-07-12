/**
 * @file OfferSummaryCard.tsx
 * @description Card component displaying a summary of an offer's details with a collapsible section to show full package details.
 */

import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { IOffer, IActivity, ISchedule } from '@/src/core/models/Offer/Offer.types';
import { formatDate } from '@/src/core/utility/date';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { formatActivityTime } from '@/src/utils/dateFormatter';

/**
 * Props for the OfferSummaryCard component.
 * 
 * @param offer - The offer data object containing price, schedule, inclusions, etc.
 * @param trailName - The display name of the trail related to the offer.
 */
export interface OfferSummaryCardProps {
    offer: IOffer & { hikeDate?: Date; hikeDuration?: string };
    trailName: string;
}



/**
 * OfferSummaryCard — Displays a quick overview of an offer's details.
 */
const OfferSummaryCard: React.FC<OfferSummaryCardProps> = ({ offer, trailName }) => {
    const { isMobile } = useBreakpoints();
    const isWide = !isMobile;
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({ 0: true });
    const [expandedActivities, setExpandedActivities] = useState<Record<number, boolean>>({});

    if (!offer) return null;

    const totalDays = offer.schedule?.length ?? 0;
    const allDaysExpanded = totalDays > 0 && Array.from({ length: totalDays }).every((_, i) => expandedDays[i]);

    const toggleDay = (dayIdx: number) => {
        setExpandedDays(prev => ({
            ...prev,
            [dayIdx]: !prev[dayIdx],
        }));
    };

    const toggleActivities = (dayIdx: number) => {
        setExpandedActivities(prev => ({
            ...prev,
            [dayIdx]: !prev[dayIdx],
        }));
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

    return (
        <View style={styles.offerSummaryCard}>
            <View style={styles.headerRow}>
                <View style={styles.headerTitleGroup}>
                    <CustomText variant="label" style={styles.trailLabel}>
                        TRAIL OFFER
                    </CustomText>
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

            <View style={styles.chipRow}>
                {(offer.date || offer.hikeDate) && (
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
                )}
                
                {(offer.duration || offer.hikeDuration) && (
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
                )}

                {(offer.minPax || offer.maxPax) && (
                    <View style={styles.infoChip}>
                        <CustomIcon 
                            library="Feather" 
                            name="users" 
                            size={14} 
                            color={Colors.TEXT_SECONDARY} 
                        />
                        <CustomText style={styles.chipText}>
                            {offer.minPax || 0} - {offer.maxPax || 0} Pax
                        </CustomText>
                    </View>
                )}
            </View>

            {offer.description && !isExpanded && (
                <CustomText 
                    variant="caption" 
                    style={styles.descText} 
                    numberOfLines={2}
                >
                    {offer.description}
                </CustomText>
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
                                    <TouchableOpacity onPress={toggleAllDays} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <CustomText style={styles.expandAllText}>
                                            {allDaysExpanded ? 'Collapse all' : 'Expand all'}
                                        </CustomText>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={isWide ? styles.itineraryGridContainer : styles.itineraryVerticalContainer}>
                                {offer.schedule.map((dayItem: any, dayIdx: number) => {
                                    const isDayExpanded = offer.schedule.length === 1 || !!expandedDays[dayIdx];
                                    const activitiesList = dayItem.activities || [];
                                    const hasManyActivities = activitiesList.length > 4;
                                    const isActivitiesExpanded = !!expandedActivities[dayIdx];
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
                style={[styles.expandButton, { marginTop: 16 }]} 
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
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        marginBottom: 24 
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
        color: Colors.TEXT_PRIMARY 
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
    chipRow: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: 8, 
        marginBottom: 16 
    },
    infoChip: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#F9FAFB', 
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
        marginVertical: 16,
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
    expandAllText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.PRIMARY,
    },
    detailDescText: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 20,
    },
    dayContainer: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    dayDivider: {
        height: 1,
        backgroundColor: '#E9ECEF',
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
    }
});

export default OfferSummaryCard;
