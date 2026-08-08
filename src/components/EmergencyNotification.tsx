/* eslint-disable i18next/no-literal-string */
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomToast from '@/src/components/CustomToast';
import EmergencyModal from '@/src/components/EmergencyModal';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { useAuthStore } from '@/src/core/stores/authStores/authStore';

/**
 * EmergencyNotification — A component that displays a notification banner if the user
 * has not yet set up an emergency contact, prompting them to open the EmergencyModal.
 */
const EmergencyNotification: React.FC = () => {
    const profile = useAuthStore(s => s.profile);
    
    const [showNotifBanner, setShowNotifBanner] = useState(false);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const slideAnim = useRef(new Animated.Value(-150)).current;

    useEffect(() => {
        const checkEmergency = async () => {
            if (!profile) return;
            
            if (!profile.emergencyContact?.name) {
                // 24-HOUR SKIP LOGIC
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
        // 24-HOUR SKIP LOGIC
        /*
        const nextTime = Date.now() + (24 * 60 * 60 * 1000); 
        await AsyncStorage.setItem('skipEmergencyModal', nextTime.toString());
        */
        setToastMessage("Setup skipped. We will remind you later.");
        setToastVisible(true);
        hideBanner();
        setShowEmergencyModal(false);
    };

    const handleFillUp = () => {
        hideBanner();
        setShowEmergencyModal(true);
    };

    return (
        <>
            {showNotifBanner && (
                <Animated.View 
                    style={[
                        styles.notifBanner, 
                        { 
                            transform: [
                                { translateY: slideAnim }
                            ] 
                        }
                    ]}
                >
                    <View style={styles.notifBannerContent}>
                        <View style={styles.notifHeader}>
                            <View style={styles.iconBox}>
                                <CustomIcon 
                                    library="Feather" 
                                    name="shield" 
                                    size={20} 
                                    color={Colors.WHITE} 
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <CustomText style={styles.notifTitle}>
                                    Action Required
                                </CustomText>
                                <CustomText style={styles.notifMessage}>
                                    Please set up your Emergency Contact to unlock the SOS feature for your hikes.
                                </CustomText>
                            </View>
                        </View>
                        <View style={styles.notifActions}>
                            <TouchableOpacity 
                                onPress={handleSkipEmergency} 
                                style={styles.notifBtnOutline}
                            >
                                <CustomText style={styles.notifBtnTextOutline}>
                                    Skip for Now
                                </CustomText>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={handleFillUp} 
                                style={styles.notifBtnPrimary}
                            >
                                <CustomText style={styles.notifBtnTextPrimary}>
                                    Set Up
                                </CustomText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            )}

            <EmergencyModal 
                visible={showEmergencyModal}
                onClose={() => setShowEmergencyModal(false)}
                onSkip={handleSkipEmergency}
                mode="emergency_only"
            />

            <CustomToast 
                visible={toastVisible}
                message={toastMessage}
                onHide={() => setToastVisible(false)}
                type="info"
            />
        </>
    );
};

const styles = StyleSheet.create({
    notifBanner: { 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 100, 
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    notifBannerContent: {
        backgroundColor: Colors.WHITE, 
        borderRadius: 20, 
        padding: 16, 
        width: '100%',
        maxWidth: Layout.MAX_WIDTH - 32,
        ...GlobalStyles.dropShadow(3),
    },
    notifHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 16 
    },
    iconBox: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        backgroundColor: Colors.ERROR, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    notifTitle: { 
        fontSize: 15, 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY 
    },
    notifMessage: { 
        fontSize: 13, 
        color: Colors.TEXT_SECONDARY, 
        marginTop: 2, 
        lineHeight: 18 
    },
    notifActions: { 
        flexDirection: 'row', 
        gap: 12 
    },
    notifBtnOutline: { 
        flex: 1, 
        paddingVertical: 10, 
        borderRadius: 12, 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        alignItems: 'center' 
    },
    notifBtnPrimary: { 
        flex: 1, 
        paddingVertical: 10, 
        borderRadius: 12, 
        backgroundColor: Colors.PRIMARY, 
        alignItems: 'center' 
    },
    notifBtnTextOutline: { 
        color: Colors.TEXT_SECONDARY, 
        fontWeight: 'bold', 
        fontSize: 13 
    },
    notifBtnTextPrimary: { 
        color: Colors.WHITE, 
        fontWeight: 'bold', 
        fontSize: 13 
    }
});

export default EmergencyNotification;
