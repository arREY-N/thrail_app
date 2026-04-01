import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { formatBookingDate } from '@/src/utils/dateFormatter';

const SummaryScreen = ({ bookingData, profileFullName }) => {
    const trailName = bookingData?.trail?.name || 'Hiking Package';
    const businessName = bookingData?.business?.name || 'Tour Provider';
    const formattedDate = formatBookingDate(bookingData?.offer?.date);
    const totalPrice = bookingData?.offer?.price || 0;
    
    const inclusions = bookingData?.offer?.inclusions || [];
    const thingsToBring = bookingData?.offer?.thingsToBring || [];
    const reminders = bookingData?.offer?.reminders || [];

    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.section}>
                <CustomText variant="h2" style={styles.sectionTitle}>
                    Booking Overview
                </CustomText>

                <View style={styles.card}>
                    <CustomText variant="h3" style={styles.summaryTrailName}>{trailName}</CustomText>
                    <CustomText variant="caption" style={styles.summaryGuideName}>by {businessName}</CustomText>
                    
                    <View style={styles.divider} />

                    <View style={styles.dataRow}>
                        <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Date & Time</CustomText>
                        <CustomText variant="body" style={styles.value}>{formattedDate}</CustomText>
                    </View>
                    
                    <View style={styles.divider} />

                    <View style={styles.expandedContent}>
                        {inclusions.length > 0 && (
                            <View style={styles.detailBlock}>
                                <CustomText variant="label" style={styles.detailLabel}>Inclusions</CustomText>
                                {inclusions.map((item, idx) => (
                                    <View key={idx} style={styles.bulletRow}>
                                        <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.SUCCESS} />
                                        <CustomText variant="caption" style={styles.bulletText}>{item}</CustomText>
                                    </View>
                                ))}
                            </View>
                        )}

                        {thingsToBring.length > 0 && (
                            <View style={styles.detailBlock}>
                                <CustomText variant="label" style={styles.detailLabel}>Things to Bring</CustomText>
                                <View style={styles.gridContainer}>
                                    {thingsToBring.map((item, idx) => (
                                        <View key={idx} style={styles.gridItem}>
                                            <View style={styles.tinyDot} />
                                            <CustomText variant="caption" style={styles.bulletText}>{item}</CustomText>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {reminders.length > 0 && (
                            <View style={styles.simpleWarningBox}>
                                <View style={styles.warningHeader}>
                                    <CustomIcon library="Feather" name="info" size={18} color={Colors.PRIMARY} />
                                    <CustomText variant="label" style={styles.warningTitle}>Important Reminders</CustomText>
                                </View>
                                {Array.isArray(reminders) ? (
                                    reminders.map((item, idx) => (
                                        <View key={idx} style={styles.warningRow}>
                                            <View style={styles.warningDot} />
                                            <CustomText variant="caption" style={styles.warningText}>{item}</CustomText>
                                        </View>
                                    ))
                                ) : (
                                    <View style={styles.warningRow}>
                                        <View style={styles.warningDot} />
                                        <CustomText variant="caption" style={styles.warningText}>{reminders}</CustomText>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    <View style={styles.divider} />
                    
                    <View style={styles.dataRow}>
                        <CustomText variant="body" style={styles.boldLabel}>Total Amount</CustomText>
                        <CustomText variant="h3" style={styles.boldValuePrimary}>₱{totalPrice.toFixed(2)}</CustomText>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: { 
        paddingHorizontal: 20, 
        paddingBottom: 120,
    },
    section: { 
        paddingTop: 24, 
    },
    sectionTitle: { 
        marginBottom: 16, 
        color: Colors.TEXT_PRIMARY, 
    },
    card: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        padding: 20, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 4, 
        elevation: 2, 
    },
    dataRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: 12, 
    },
    value: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: '500', 
        textAlign: 'right', 
        flex: 1, 
        marginLeft: 20, 
    },
    boldLabel: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: 'bold', 
    },
    boldValuePrimary: { 
        color: Colors.PRIMARY, 
        fontWeight: 'bold', 
    },
    divider: { 
        height: 1, 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        marginVertical: 12, 
    },
    summaryTrailName: { 
        color: Colors.PRIMARY, 
        fontWeight: 'bold', 
        marginBottom: 4, 
    },
    summaryGuideName: { 
        color: Colors.TEXT_SECONDARY, 
        marginBottom: 8, 
    },
    expandedContent: { 
        paddingVertical: 8, 
        gap: 16, 
    },
    detailBlock: { 
        marginBottom: 0, 
    },
    detailLabel: { 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY, 
        marginBottom: 12, 
        fontSize: 14, 
    },
    bulletRow: { 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        marginBottom: 10, 
        gap: 12, 
    },
    bulletText: { 
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
        marginTop: 8, 
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
        lineHeight: 20, 
    },
});

export default SummaryScreen;