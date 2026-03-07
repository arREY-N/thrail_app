import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const OfferCardItem = ({ 
    offer, 
    isSelected, 
    onSelect 
}) => {
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
                                About this Package
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
                            <CustomText 
                                variant="label" 
                                style={styles.detailLabel}
                            >
                                Itinerary
                            </CustomText>
                            <View style={styles.timelineContainer}>
                                {offer.schedule.map((dayData, dayIdx) => (
                                    <View 
                                        key={dayIdx} 
                                        style={styles.timelineDay}
                                    >
                                        <CustomText 
                                            variant="label"
                                            style={styles.dayLabel}
                                        >
                                            {dayData.day}
                                        </CustomText>
                                        
                                        {dayData.activities.map((act, actIdx) => (
                                            <View 
                                                key={actIdx} 
                                                style={styles.timelineRow}
                                            >
                                                <View style={styles.timelineDot} />
                                                <CustomText 
                                                    variant="label"
                                                    style={styles.timelineTime}
                                                >
                                                    {act.time}
                                                </CustomText>
                                                <CustomText 
                                                    variant="caption"
                                                    style={styles.timelineEvent}
                                                >
                                                    {act.event}
                                                </CustomText>
                                            </View>
                                        ))}
                                    </View>
                                ))}
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
                            {offer.inclusions.map((item, idx) => (
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
                                Things to Bring
                            </CustomText>
                            <View style={styles.gridContainer}>
                                {offer.thingsToBring.map((item, idx) => (
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
                                    Important Reminders
                                </CustomText>
                            </View>
                            
                            {offer.reminders.map((item, idx) => (
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
                            ))}
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
        
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
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
        borderLeftWidth: 2, 
        borderLeftColor: Colors.GRAY_LIGHT, 
        marginLeft: 8, 
        paddingLeft: 16,
    },
    timelineDay: { 
        marginBottom: 20,
    },
    dayLabel: { 
        fontWeight: 'bold', 
        color: Colors.PRIMARY, 
        marginBottom: 12, 
        marginTop: 4,
    },
    timelineRow: { 
        flexDirection: 'row', 
        marginBottom: 12, 
        position: 'relative',
    },
    timelineDot: { 
        position: 'absolute', 
        left: -22, 
        top: 6, 
        width: 10, 
        height: 10, 
        borderRadius: 5, 
        backgroundColor: Colors.GRAY_MEDIUM,
    },
    timelineTime: { 
        width: 80, 
        fontWeight: '700',
    },
    timelineEvent: { 
        flex: 1, 
        lineHeight: 20,
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
        backgroundColor: Colors.GRAY_MEDIUM, 
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
        backgroundColor: Colors.GRAY_MEDIUM, 
        marginTop: 9, 
    },
    warningText: { 
        flex: 1, 
        lineHeight: 22, 
    },
});

export default OfferCardItem;