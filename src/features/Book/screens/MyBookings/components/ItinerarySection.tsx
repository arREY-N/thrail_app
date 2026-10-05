import React from 'react';
import { StyleSheet, View } from 'react-native';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { IActivity, ISchedule } from '@/src/core/models/Offer/Offer';
import { formatTime } from '@/src/utils/dateFormatter';
import AccordionItem from '@/src/features/Book/screens/MyBookings/components/AccordionItem';

/**
 * Props for configuring the ItinerarySection component.
 */
export interface ItinerarySectionProps {
    /** The chronological schedule of activities and events for the booking. */
    schedule: ISchedule<Date>[];
    /** Indicates if the booking is fully confirmed, defaulting the accordion to open. */
    isConfirmed: boolean;
}

/**
 * Renders an accordion section containing a visual timeline of the booking's itinerary.
 * Only displays if a schedule is provided and has items.
 *
 * @param {ItinerarySectionProps} props - The schedule data and confirmed state.
 * @returns {React.JSX.Element | null} The rendered accordion timeline or null if empty.
 */
const ItinerarySection = ({ schedule, isConfirmed }: ItinerarySectionProps) => {
    if (!schedule || schedule.length === 0) return null;

    return (
        <AccordionItem title="Itinerary" icon="map" defaultOpen={isConfirmed}>
            <View style={styles.timelineContainer}>
                {schedule.map((dayData: ISchedule<Date>, dayIdx: number) => (
                    <View key={dayIdx} style={styles.timelineDay}>
                        <CustomText variant="label" style={styles.dayLabelText}>
                            Day {dayData.day}
                        </CustomText>
                        {dayData.activities?.map((act: IActivity<Date>, actIdx: number) => (
                            <View key={actIdx} style={styles.timelineRow}>
                                <View style={styles.timelineDot} />
                                <View style={styles.timelineContent}>
                                    <CustomText variant="label" style={styles.timelineTime}>
                                        {formatTime(act.time)} — {act.event.split(' - ')[0] || 'Activity'}
                                    </CustomText>
                                    {act.event.includes(' - ') && (
                                        <CustomText variant="caption" style={styles.timelineSubEvent}>
                                            {act.event.split(' - ')[1]}
                                        </CustomText>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        </AccordionItem>
    );
};

const styles = StyleSheet.create({
    timelineContainer: {
        borderLeftWidth: 1,
        borderLeftColor: Colors.GRAY_LIGHT,
        marginLeft: 8,
        paddingLeft: 16,
        marginTop: 8
    },
    timelineDay: {
        marginBottom: 20
    },
    dayLabelText: {
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginBottom: 12
    },
    timelineRow: {
        flexDirection: 'row',
        marginBottom: 16,
        position: 'relative'
    },
    timelineDot: {
        position: 'absolute',
        left: -20.5,
        top: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.PRIMARY
    },
    timelineContent: {
        flex: 1
    },
    timelineTime: {
        fontWeight: 'bold',
        fontSize: 13,
        color: Colors.TEXT_PRIMARY
    },
    timelineSubEvent: {
        lineHeight: 20,
        marginTop: 2
    }
});

export default ItinerarySection;
