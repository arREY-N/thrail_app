import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Platform, SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IBooking } from '@/src/core/models/Booking/Booking';
import { useTrailsStore } from '@/src/core/stores/trailStores/trailsStore';
import { formatDate } from '@/src/core/utility/date';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UpcomingHikesModalProps {
    visible: boolean;
    onClose: () => void;
    bookings: IBooking[];
    activeBooking: IBooking | null;
    onSelectBooking: (booking: IBooking) => void;
}

const UpcomingHikesModal: React.FC<UpcomingHikesModalProps> = ({ 
    visible, 
    onClose, 
    bookings, 
    activeBooking,
    onSelectBooking 
}) => {
    const insets = useSafeAreaInsets();
    const trailsDb = useTrailsStore(s => s.data); // Fetch to cross-reference locations

    // ✅ Animation States (Matching CustomFilterModal)
    const [renderModal, setRenderModal] = useState(visible);
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setRenderModal(true);
            Animated.timing(animValue, {
                toValue: 1,
                duration: 300,
                useNativeDriver: Platform.OS !== 'web',
            }).start();
        } else {
            Animated.timing(animValue, {
                toValue: 0,
                duration: 250,
                useNativeDriver: Platform.OS !== 'web',
            }).start(() => setRenderModal(false));
        }
    }, [visible, animValue]);

    // ✅ Group Bookings by Month for the SectionList
    const sections = useMemo(() => {
        if (!bookings) return [];
        const grouped: Record<string, any[]> = {};

        bookings.forEach((b) => {
            const date = new Date(b.offer?.date || new Date());
            const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' }); // e.g., "May 2026"
            
            if (!grouped[monthYear]) {
                grouped[monthYear] = [];
            }
            grouped[monthYear].push(b);
        });

        // Convert to SectionList format
        return Object.keys(grouped).map(key => ({
            title: key,
            data: grouped[key]
        }));
    }, [bookings]);

    if (!renderModal) return null;

    return (
        <Modal 
            transparent={true} 
            visible={renderModal} 
            animationType="none" 
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                
                {/* 🌑 Background Fade Overlay */}
                <Animated.View style={[styles.backdrop, { opacity: animValue }]}>
                    <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />
                </Animated.View>

                {/* ⬜ Bottom Sheet Slide */}
                <Animated.View
                    style={[
                        styles.modalContent,
                        { paddingBottom: Math.max(insets.bottom + 24, 24) },
                        {
                            transform: [
                                {
                                    translateY: animValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [SCREEN_HEIGHT, 0],
                                    })
                                }
                            ]
                        }
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <CustomText variant="h2" style={styles.headerTitle}>My Upcoming Hikes</CustomText>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                            <CustomIcon library="Feather" name="x" size={24} color={Colors.TEXT_PRIMARY} />
                        </TouchableOpacity>
                    </View>

                    {/* Timeline List */}
                    <SectionList
                        sections={sections}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollBody}
                        stickySectionHeadersEnabled={false}
                        
                        // 🗓️ Month Divider Header
                        renderSectionHeader={({ section: { title } }) => (
                            <View style={styles.sectionHeader}>
                                <CustomText variant="label" style={styles.sectionTitle}>{title}</CustomText>
                                <View style={styles.sectionLine} />
                            </View>
                        )}
                        
                        // 🎟️ Booking Cards
                        renderItem={({ item }) => {
                            const isActive = activeBooking?.id === item.id;
                            
                            // Cross-reference trail database for location/province
                            const fullTrail = trailsDb.find(t => t.id === item.trail?.id);
                            const provinceStr = fullTrail?.general?.province?.join(', ');
                            const location = provinceStr || fullTrail?.general?.address || 'Location TBA';

                            return (
                                <TouchableOpacity 
                                    style={[styles.card, isActive && styles.cardActive]} 
                                    onPress={() => onSelectBooking(item)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.cardInfo}>
                                        <View style={styles.row}>
                                            <CustomIcon 
                                                library={isActive ? "Feather" : "FontAwesome6"} 
                                                name={isActive ? "check-circle" : "mountain"} 
                                                size={16} 
                                                color={isActive ? Colors.PRIMARY : Colors.TEXT_SECONDARY} 
                                            />
                                            <CustomText variant="body" style={[styles.title, isActive && styles.titleActive]} numberOfLines={1}>
                                                {item.trail?.name}
                                            </CustomText>
                                        </View>
                                        <CustomText variant="caption" style={styles.locationText} numberOfLines={1}>
                                            <CustomIcon library="Feather" name="map-pin" size={10} color={Colors.TEXT_SECONDARY} /> {location}
                                        </CustomText>
                                        <CustomText variant="caption" style={styles.subtitle} numberOfLines={1}>
                                            {formatDate(item.offer.date)} • {item.business?.name}
                                        </CustomText>
                                    </View>
                                    
                                    <TouchableOpacity 
                                        style={styles.detailsBtn}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            onClose();
                                            setTimeout(() => {
                                                router.push({
                                                    pathname: '/(main)/book/list',
                                                    params: { bookingId: item.id, view: 'overview' }
                                                });
                                            }, 200); // Slight delay ensures smooth modal closing
                                        }}
                                    >
                                        <CustomText variant="caption" style={styles.detailsText}>View Details</CustomText>
                                        <CustomIcon library="Feather" name="chevron-right" size={14} color={Colors.PRIMARY} />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <CustomIcon library="Feather" name="calendar" size={40} color={Colors.GRAY_LIGHT} />
                                <CustomText style={styles.emptyText}>You have no upcoming bookings.</CustomText>
                            </View>
                        }
                    />
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.MODAL_OVERLAY || 'rgba(0, 0, 0, 0.5)' },
    backdropTouch: { flex: 1 },
    modalContent: { 
        backgroundColor: Colors.WHITE, 
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24, 
        maxHeight: '75%',
        shadowColor: Colors.SHADOW, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12,...GlobalStyles.dropShadow(),},
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 0 },
    headerTitle: { fontSize: 18, color: Colors.TEXT_PRIMARY, marginBottom: 0 },
    closeBtn: { padding: 4, backgroundColor: Colors.GRAY_ULTRALIGHT, borderRadius: 16 },
    scrollBody: { paddingHorizontal: 24, paddingBottom: 24 },
    
    // Timeline Header
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 12 },
    sectionTitle: { color: Colors.TEXT_SECONDARY, letterSpacing: 1, fontWeight: 'bold', textTransform: 'uppercase', marginRight: 12 },
    sectionLine: { flex: 1, height: 1, backgroundColor: Colors.GRAY_LIGHT },
    
    // Booking Cards
    card: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingVertical: 16, 
        paddingHorizontal: 16,
        backgroundColor: Colors.WHITE,
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 16,
        marginBottom: 12
    },
    cardActive: {
        backgroundColor: Colors.STATUS_APPROVED_BG, // E8F5E9
        borderColor: Colors.STATUS_APPROVED_BORDER, // C8E6C9
    },
    cardInfo: { flex: 1, marginRight: 12 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    title: { fontWeight: 'bold', color: Colors.TEXT_PRIMARY, fontSize: 16 },
    titleActive: { color: Colors.PRIMARY },
    locationText: { color: Colors.TEXT_SECONDARY, fontWeight: '600', marginBottom: 2 },
    subtitle: { color: Colors.TEXT_SECONDARY },
    
    // Details Button
    detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingLeft: 8 },
    detailsText: { color: Colors.PRIMARY, fontWeight: '700' },
    
    // Empty State
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    emptyText: { textAlign: 'center', marginTop: 12, color: Colors.TEXT_SECONDARY }
});

export default UpcomingHikesModal;