import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import EmergencySetupModal from '@/src/components/EmergencySetupModal';
import { Colors } from '@/src/constants/colors';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useReview from '@/src/core/hook/review/useReview';
import useTrailDomain from '@/src/core/hook/trail/useTrailDomain';
import { useAuthStore } from '@/src/core/stores/authStores/authStore';
import HomeScreen from '@/src/features/Home/screens/HomeScreen';

const dropShadow = Platform.select({ ios: { shadowColor: Colors.SHADOW, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }, android: { elevation: 8 } });

export default function home(){
    const profile = useAuthStore(s => s.profile);

    const { 
        trails, 
        onViewTrail 
    } = useTrailDomain();

    const {
        onDownloadPress, 
        onWeatherPress, 
        onViewAllRecommendationPress, 
        onViewAllTrendingPress,
        onGroupPress
    } = useAppNavigation();

    const {
        getItemRating,
    } = useReview();

    const [showNotifBanner, setShowNotifBanner] = useState(false);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const slideAnim = useRef(new Animated.Value(-150)).current;

    useEffect(() => {
        const checkEmergency = async () => {
            if (!profile) return;
            
            if (!profile.emergencyContact?.name) {
                /*
                const skipTime = await AsyncStorage.getItem('skipEmergencyModal');
                if (skipTime && Date.now() < parseInt(skipTime, 10)) return;
                */
                
                setShowNotifBanner(true);
                Animated.spring(slideAnim, {
                    toValue: 50,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }).start();
            }
        };
        checkEmergency();
    }, [profile, slideAnim]);

    const hideBanner = () => {
        Animated.timing(slideAnim, {
            toValue: -150,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setShowNotifBanner(false));
    };

    const handleSkipEmergency = async () => {
        /*
        const nextTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        await AsyncStorage.setItem('skipEmergencyModal', nextTime.toString());
        */

        hideBanner();
        setShowEmergencyModal(false);
    };

    const handleFillUp = () => {
        hideBanner();
        setShowEmergencyModal(true);
    };

    return (
        <View style={{ flex: 1 }}>
            <HomeScreen 
                locationTemp={{}} 
                onWeatherPress={onWeatherPress}
                onViewAllRecommendationPress={onViewAllRecommendationPress}
                onViewAllTrendingPress={onViewAllTrendingPress}
                recommendedTrails={[]}
                discoverTrails={trails}
                onMountainPress={onViewTrail}
                onDownloadPress={onDownloadPress}
                onGroupPress={onGroupPress}
                getItemRating={getItemRating}
            />

            {showNotifBanner && (
                <Animated.View style={[styles.notifBanner, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.notifHeader}>
                        <View style={styles.iconBox}>
                            <CustomIcon library="Feather" name="shield" size={20} color={Colors.WHITE} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <CustomText style={styles.notifTitle}>Action Required</CustomText>
                            <CustomText style={styles.notifMessage}>Please set up your Emergency Contact to unlock the SOS feature for your hikes.</CustomText>
                        </View>
                    </View>
                    <View style={styles.notifActions}>
                        <TouchableOpacity onPress={handleSkipEmergency} style={styles.notifBtnOutline}>
                            <CustomText style={styles.notifBtnTextOutline}>Skip for Now</CustomText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleFillUp} style={styles.notifBtnPrimary}>
                            <CustomText style={styles.notifBtnTextPrimary}>Set Up</CustomText>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}

            <EmergencySetupModal 
                visible={showEmergencyModal}
                onClose={() => setShowEmergencyModal(false)}
                onSkip={handleSkipEmergency}
                mode="emergency_only"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    notifBanner: { position: 'absolute', top: 0, left: 16, right: 16, backgroundColor: Colors.WHITE, borderRadius: 20, padding: 16, zIndex: 100, ...dropShadow },
    notifHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.ERROR, justifyContent: 'center', alignItems: 'center' },
    notifTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.TEXT_PRIMARY },
    notifMessage: { fontSize: 13, color: Colors.TEXT_SECONDARY, marginTop: 2, lineHeight: 18 },
    notifActions: { flexDirection: 'row', gap: 12 },
    notifBtnOutline: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.GRAY_ULTRALIGHT, alignItems: 'center' },
    notifBtnPrimary: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.PRIMARY, alignItems: 'center' },
    notifBtnTextOutline: { color: Colors.TEXT_SECONDARY, fontWeight: 'bold', fontSize: 13 },
    notifBtnTextPrimary: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 13 },
});