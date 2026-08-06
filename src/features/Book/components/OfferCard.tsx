import React, { useState } from 'react';
import { Platform, 
    StyleSheet,
    TouchableOpacity,
    View
 } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { formatActivityTime } from '@/src/utils/dateFormatter';

export interface OfferData {
    business?: { name?: string };
    duration?: string;
    price?: number;
    minPax?: number;
    maxPax?: number;
    description?: string;
    schedule?: Array<{ day: number; activities?: Array<{ time: unknown; event: string }> }>;
    inclusions?: string[];
    thingsToBring?: string[];
    reminders?: string[] | string;
    [key: string]: unknown;
}

export interface OfferCardProps {
    offer: OfferData;
    isSelected: boolean;
    onSelect: () => void;
}

const OfferCard: React.FC<OfferCardProps> = ({ 
    offer, 
    isSelected, 
    onSelect 
}) => {
    const { isMobile } = useBreakpoints();
    const isWide = !isMobile;
    const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({ 0: true });
    const [expandedActivities, setExpandedActivities] = useState<Record<number, boolean>>({});

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
        <TouchableOpacity 
            activeOpacity={0.9} 
            style={[
                styles.offerCard, 
                isSelected && styles.selectedOfferCard
            ]}
            onPress={onSelect}
        >
            <View style={styles.cardHeader}>
                <View style={styles.guideAvatar}>
                    <CustomIcon 
                        library="FontAwesome5" 
                        name="user-circle" 
                        size={24} 
                        color={Colors.WHITE} 
                    />
                </View>
                
                <View style={styles.guideInfo}>
                    <CustomText 
                        variant="body" 
                        style={styles.guideName}
                        numberOfLines={2} 
                    >
                        {offer.business?.name || "Independent Guide"}
                    </CustomText>
                    
                    <View style={styles.ratingRow}>
                        <CustomIcon 
                            library="AntDesign" 
                            name="star" 
                            size={14} 
                            color={Colors.YELLOW} 
                        />
                        <CustomText variant="caption">
                            4.9 (60 reviews)
                        </CustomText>
                    </View>

                    {offer.duration && (
                        <View style={styles.durationRow}>
                            <CustomIcon 
                                library="Feather" 
                                name="clock" 
                                size={12} 
                                color={Colors.TEXT_SECONDARY} 
                            />
                            <CustomText variant="caption" style={styles.durationText}>
                                {offer.duration}
                            </CustomText>
                        </View>
                    )}
                </View>

                <View style={styles.priceInfo}>
                    <CustomText 
                        variant="title" 
                        style={styles.priceText}
                    >
                        ₱{offer.price}
                    </CustomText>
                    <CustomText 
                        variant="caption" 
                        style={styles.perPerson}
                    >
                        / Per Person
                    </CustomText>
                    
                    {(offer.minPax || offer.maxPax) && (
                        <CustomText variant="caption" style={styles.paxText}>
                            {offer.minPax}-{offer.maxPax} Pax required
                        </CustomText>
                    )}
                </View>
            </View>

            {isSelected && (
                <View style={styles.expandedContent}>
                    
                    {offer.description && (
                        <View style={styles.detailBlock}>
                            <CustomText 
                                variant="label" 
                                style={styles.detailLabel}
                            >
                                About this package
                            </CustomText>
                            <CustomText 
                                variant="caption"
                                style={styles.detailText}
                            >
                                {offer.description}
                            </CustomText>
                        </View>
                    )}

                     {offer.schedule && offer.schedule.length > 0 && (
                        <View style={styles.detailBlock}>
                            <View style={styles.itineraryHeaderRow}>
                                <CustomText 
                                    variant="label" 
                                    style={styles.detailLabel}
                                >
                                    Itinerary
                                </CustomText>
                                {(offer.schedule?.length ?? 0) > 1 && (
                                    <TouchableOpacity onPress={toggleAllDays} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <CustomText style={styles.expandAllText}>
                                            {allDaysExpanded ? 'Collapse all' : 'Expand all'}
                                        </CustomText>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={isWide ? styles.itineraryGridContainer : styles.itineraryVerticalContainer}>
                                {offer.schedule?.map((dayData, dayIdx) => {
                                    const isDayExpanded = (offer.schedule?.length ?? 0) === 1 || !!expandedDays[dayIdx];
                                    const activitiesList = dayData.activities || [];
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
                                                onPress={() => (offer.schedule?.length ?? 0) > 1 && toggleDay(dayIdx)}
                                                style={styles.dayHeaderRow}
                                                disabled={(offer.schedule?.length ?? 0) <= 1}
                                            >
                                                <View style={styles.dayTitleGroup}>
                                                    <CustomIcon 
                                                        library="Feather" 
                                                        name="calendar" 
                                                        size={16} 
                                                        color={Colors.PRIMARY} 
                                                        style={styles.dayCalendarIcon}
                                                    />
                                                    <CustomText 
                                                        variant="label"
                                                        style={styles.dayLabelText}
                                                    >
                                                        Day {dayData.day || (dayIdx + 1)}
                                                    </CustomText>
                                                </View>
                                                {(offer.schedule?.length ?? 0) > 1 && (
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
                                                        {visibleActivities.map((act, actIdx) => {
                                                            const isLast = actIdx === visibleActivities.length - 1 && !hasManyActivities;
                                                            return (
                                                                <View 
                                                                    key={actIdx} 
                                                                    style={styles.activityRow}
                                                                >
                                                                    <View style={styles.timelineColumn}>
                                                                        <View style={styles.timelineCircle} />
                                                                        {!isLast && <View style={styles.timelineLine} />}
                                                                    </View>
                                                                    <CustomText 
                                                                        variant="label"
                                                                        style={styles.timelineTime}
                                                                    >
                                                                        {formatActivityTime(act.time)}
                                                                    </CustomText>
                                                                    <CustomText 
                                                                        variant="caption"
                                                                        style={styles.timelineEvent}
                                                                    >
                                                                        {act.event}
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
                        <View style={styles.detailBlock}>
                            <CustomText 
                                variant="label" 
                                style={styles.detailLabel}
                            >
                                Inclusions
                            </CustomText>
                            {offer.inclusions?.map((item, idx) => (
                                <View 
                                    key={idx} 
                                    style={styles.bulletRow}
                                >
                                    <CustomIcon 
                                        library="Feather" 
                                        name="check-circle" 
                                        size={16} 
                                        color={Colors.SUCCESS} 
                                    />
                                    <CustomText 
                                        variant="caption"
                                        style={styles.bulletText}
                                    >
                                        {item}
                                    </CustomText>
                                </View>
                            ))}
                        </View>
                    )}

                    {offer.thingsToBring && offer.thingsToBring.length > 0 && (
                        <View style={styles.detailBlock}>
                            <CustomText 
                                variant="label" 
                                style={styles.detailLabel}
                            >
                                Things to bring
                            </CustomText>
                            <View style={styles.gridContainer}>
                                {offer.thingsToBring?.map((item, idx) => (
                                    <View 
                                        key={idx} 
                                        style={styles.gridItem}
                                    >
                                        <View style={styles.tinyDot} />
                                        <CustomText 
                                            variant="caption"
                                            style={styles.bulletText}
                                        >
                                            {item}
                                        </CustomText>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {offer.reminders && offer.reminders.length > 0 && (
                        <View style={styles.simpleWarningBox}>
                            
                            <View style={styles.warningHeader}>
                                <CustomIcon 
                                    library="Feather" 
                                    name="info" 
                                    size={18} 
                                    color={Colors.PRIMARY} 
                                />
                                <CustomText 
                                    variant="label"
                                    style={styles.warningTitle}
                                >
                                    Important reminders
                                </CustomText>
                            </View>
                            
                            {Array.isArray(offer.reminders) ? (
                                offer.reminders?.map((item, idx) => (
                                    <View 
                                        key={idx} 
                                        style={styles.warningRow}
                                    >
                                        <View style={styles.warningDot} />
                                        <CustomText 
                                            variant="caption"
                                            style={styles.warningText}
                                        >
                                            {item}
                                        </CustomText>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.warningRow}>
                                    <View style={styles.warningDot} />
                                    <CustomText 
                                        variant="caption"
                                        style={styles.warningText}
                                    >
                                        {offer.reminders}
                                    </CustomText>
                                </View>
                            )}
                        </View>
                    )}

                </View>
            )}

        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    offerCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        
        
        
        
        ...GlobalStyles.dropShadow(3),
    },
    selectedOfferCard: {
        borderColor: Colors.PRIMARY,
        borderWidth: 2,
    },
    
    cardHeader: { 
        flexDirection: 'row', 
        alignItems: 'flex-start',
    },
    guideAvatar: { 
        width: 48, 
        height: 48, 
        borderRadius: 24, 
        backgroundColor: Colors.PRIMARY, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 16,
        marginTop: 4,
    },
    guideInfo: { 
        flex: 1, 
        flexShrink: 1,
        justifyContent: 'center',
        paddingRight: 12,
    },
    guideName: { 
        marginBottom: 4,
        fontWeight: 'bold',
        lineHeight: 20, 
    },
    ratingRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6,
    },
    durationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 6,
    },
    durationText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        marginBottom: 2,
    },
    priceInfo: { 
        alignItems: 'flex-end', 
        justifyContent: 'flex-start',
    },
    priceText: { 
        fontSize: 22, 
        color: Colors.PRIMARY, 
        marginBottom: 2, 
        fontWeight: 'bold',
    },
    perPerson: { 
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    paxText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 4,
    },
    
    expandedContent: {
        marginTop: 24,
        paddingHorizontal: 8,
        paddingBottom: 8,
        gap: 16, 
    },
    detailBlock: { 
        marginBottom: 0,
    },
    detailLabel: { 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY, 
        marginBottom: 12,
        fontSize: 16,
    },
    detailText: { 
        lineHeight: 24,
    },
    
    bulletRow: { 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        marginBottom: 10, 
        gap: 12,
    },
    bulletText: { 
        flex: 1, 
        lineHeight: 22,
    },
    
    timelineContainer: { 
        marginLeft: 8, 
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
        gap: 8,
    },
    dayCalendarIcon: {
        marginTop: -1,
    },
    dayLabelText: { 
        fontWeight: 'bold', 
        color: Colors.PRIMARY, 
    },
    activitiesList: {
        marginBottom: 8,
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
    timelineTime: { 
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    timelineEvent: { 
        flex: 1, 
        fontSize: 13,
        lineHeight: 18,
        color: Colors.TEXT_SECONDARY,
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
        marginTop: 1,
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

    gridContainer: { 
        flexDirection: 'row', 
        flexWrap: 'wrap',
    },
    gridItem: { 
        width: '50%', 
        flexDirection: 'row', 
        alignItems: 'flex-start',
        marginBottom: 10, 
        paddingRight: 8,
    },
    tinyDot: { 
        width: 4,
        height: 4, 
        borderRadius: 2, 
        backgroundColor: Colors.PRIMARY, 
        marginRight: 10,
        marginTop: 9,
    },

    simpleWarningBox: { 
        backgroundColor: '#F8F9FA',
        borderRadius: 12, 
        padding: 16,
        marginTop: 0, 
        borderWidth: 1, 
        borderColor: Colors.PRIMARY,
    },
    warningHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 10, 
        marginBottom: 16,
    },
    warningTitle: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: 'bold',
    },
    warningRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 10,
    },
    warningDot: {
        width: 4, 
        height: 4, 
        borderRadius: 2, 
        backgroundColor: Colors.PRIMARY, 
        marginTop: 9, 
    },
    warningText: { 
        flex: 1, 
        lineHeight: 22, 
    },
});

export default OfferCard;