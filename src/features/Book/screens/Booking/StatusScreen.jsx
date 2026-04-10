import React from 'react';
import {
    ScrollView,
    StyleSheet,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { formatBookingDate } from '@/src/utils/dateFormatter';

const StatusScreen = ({ onReturn, bookedOffer }) => {
    
    const trailName = bookedOffer?.business?.name || bookedOffer?.trail?.name || "Hiking Package";
    const hikeDate = formatBookingDate(bookedOffer?.date || bookedOffer?.hikeDate);
    const price = bookedOffer?.price || 0;
    const duration = bookedOffer?.duration || "1 Day";
    const minPax = bookedOffer?.minPax || 1;
    const maxPax = bookedOffer?.maxPax || 10;
    const inclusions = bookedOffer?.inclusions || [];

    return (
        <View style={styles.container}>
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.headerSection}>
                    <View style={styles.iconCircle}>
                        <CustomIcon 
                            library="Feather" 
                            name="check" 
                            size={40} 
                            color={Colors.WHITE} 
                        />
                    </View>
                    <CustomText variant="h1" style={styles.title}>
                        Request Submitted!
                    </CustomText>
                    <CustomText variant="body" style={styles.subtitle}>
                        Your reservation request has been successfully sent to the tour provider.
                    </CustomText>
                </View>

                <View style={styles.infoBanner}>
                    <CustomIcon 
                        library="Feather" 
                        name="info" 
                        size={16} 
                        color={Colors.TEXT_SECONDARY} 
                    />
                    <CustomText variant="caption" style={styles.infoText}>
                        You will receive a notification as soon as your reservation is approved.
                    </CustomText>
                </View>

                <View style={styles.summaryCard}>
                    <CustomText variant="h3" style={styles.summaryTitle}>
                        Reservation Summary
                    </CustomText>
                    
                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <View style={styles.detailLabelRow}>
                            <CustomIcon 
                                library="Feather" 
                                name="map-pin" 
                                size={16} 
                                color={Colors.TEXT_SECONDARY} 
                            />
                            <CustomText variant="caption" style={styles.detailLabel}>
                                Package
                            </CustomText>
                        </View>
                        <CustomText variant="body" style={styles.detailValue} numberOfLines={1}>
                            {trailName}
                        </CustomText>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailLabelRow}>
                            <CustomIcon 
                                library="Feather" 
                                name="calendar" 
                                size={16} 
                                color={Colors.TEXT_SECONDARY} 
                            />
                            <CustomText variant="caption" style={styles.detailLabel}>
                                Date
                            </CustomText>
                        </View>
                        <CustomText variant="body" style={styles.detailValue}>
                            {hikeDate}
                        </CustomText>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailLabelRow}>
                            <CustomIcon 
                                library="Feather" 
                                name="clock" 
                                size={16} 
                                color={Colors.TEXT_SECONDARY} 
                            />
                            <CustomText variant="caption" style={styles.detailLabel}>
                                Duration
                            </CustomText>
                        </View>
                        <CustomText variant="body" style={styles.detailValue}>
                            {duration}
                        </CustomText>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailLabelRow}>
                            <CustomIcon 
                                library="Feather" 
                                name="users" 
                                size={16} 
                                color={Colors.TEXT_SECONDARY} 
                            />
                            <CustomText variant="caption" style={styles.detailLabel}>
                                Group Size
                            </CustomText>
                        </View>
                        <CustomText variant="body" style={styles.detailValue}>
                            {minPax} - {maxPax} Pax
                        </CustomText>
                    </View>

                    {inclusions.length > 0 && (
                        <>
                            <View style={[styles.divider, styles.marginTopSmall]} />
                            <CustomText variant="caption" style={styles.inclusionsTitle}>
                                Includes:
                            </CustomText>
                            <View style={styles.inclusionsWrapper}>
                                <CustomText variant="caption" style={styles.inclusionsText}>
                                    {inclusions.join('  •  ')}
                                </CustomText>
                            </View>
                        </>
                    )}

                    <View style={[styles.divider, styles.marginTopLarge]} />

                    <View style={styles.totalRow}>
                        <CustomText variant="body" style={styles.totalLabel}>
                            Total Amount
                        </CustomText>
                        <CustomText variant="h2" style={styles.totalValue}>
                            ₱{price}
                        </CustomText>
                    </View>
                </View>

            </ScrollView>

            <CustomStickyFooter 
                primaryButton={{
                    title: "Return to Trail",
                    onPress: onReturn
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: Colors.BACKGROUND, 
    },
    scrollContent: { 
        paddingHorizontal: 20, 
        paddingTop: 40, 
        paddingBottom: 120,
        alignItems: 'center',
    },
    
    headerSection: { 
        alignItems: 'center', 
        marginBottom: 24,
    },
    iconCircle: { 
        width: 80, 
        height: 80, 
        borderRadius: 40, 
        backgroundColor: Colors.SUCCESS, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 20, 
        shadowColor: Colors.SUCCESS, 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 8, 
        elevation: 6,
    },
    title: { 
        marginBottom: 12, 
        color: Colors.TEXT_PRIMARY,
    },
    subtitle: { 
        textAlign: 'center', 
        color: Colors.TEXT_SECONDARY, 
        paddingHorizontal: 20, 
        lineHeight: 22,
    },

    infoBanner: { 
        flexDirection: 'row', 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        padding: 16, 
        borderRadius: 12, 
        marginBottom: 32, 
        width: '100%', 
        alignItems: 'flex-start', 
        gap: 12, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT,
    },
    infoText: { 
        flex: 1, 
        color: Colors.TEXT_SECONDARY, 
        lineHeight: 20,
    },

    summaryCard: { 
        backgroundColor: Colors.WHITE, 
        width: '100%', 
        borderRadius: 20, 
        padding: 20, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 8, 
        elevation: 2,
    },
    summaryTitle: { 
        marginBottom: 16,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    divider: { 
        height: 1, 
        backgroundColor: Colors.GRAY_LIGHT, 
        marginBottom: 16,
    },
    
    detailRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16,
    },
    detailLabelRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8,
    },
    detailLabel: { 
        color: Colors.TEXT_SECONDARY,
    },
    detailValue: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: '600', 
        flex: 1, 
        textAlign: 'right', 
        marginLeft: 20,
    },

    inclusionsTitle: { 
        color: Colors.TEXT_SECONDARY, 
        marginBottom: 8, 
        fontWeight: 'bold',
    },
    inclusionsWrapper: { 
        backgroundColor: Colors.BACKGROUND, 
        padding: 12, 
        borderRadius: 8,
    },
    inclusionsText: { 
        color: Colors.TEXT_PRIMARY, 
        lineHeight: 20,
    },

    marginTopSmall: {
        marginTop: 8,
    },
    marginTopLarge: {
        marginTop: 16,
    },

    totalRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 4,
    },
    totalLabel: { 
        color: Colors.TEXT_SECONDARY, 
        fontWeight: 'bold',
    },
    totalValue: { 
        color: Colors.PRIMARY,
    },
});

export default StatusScreen;