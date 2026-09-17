/**
 * @file Drawer.tsx
 * @description Mobile left slide-in navigation drawer for the Superadmin Dashboard shell with animated entrance/exit and backdrop tap-to-dismiss.
 */

import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 280);

/**
 * Interface representing the properties of the Drawer component.
 * 
 * @param visible - Flag indicating whether the mobile drawer is visible.
 * @param onClose - Callback handler to close/dismiss the drawer.
 * @param children - The sidebar component content to render inside the drawer.
 */
interface Props {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

/**
 * Drawer component providing a smooth left-to-right animated drawer with smooth exit animation.
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement | null} The rendered drawer component or null.
 */
const Drawer = ({
    visible,
    onClose,
    children,
}: Props): React.JSX.Element | null => {
    const [renderModal, setRenderModal] = useState<boolean>(visible);
    if (visible && !renderModal) {
        setRenderModal(true);
    }
    const [slideAnim] = useState(() => new Animated.Value(-DRAWER_WIDTH));
    const [fadeAnim] = useState(() => new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 220,
                    easing: Easing.out(Easing.poly(4)),
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 220,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -DRAWER_WIDTH,
                    duration: 200,
                    easing: Easing.out(Easing.poly(4)),
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setRenderModal(false);
            });
        }
    }, [visible, slideAnim, fadeAnim]);

    if (!renderModal) return null;

    return (
        <Modal
            transparent
            visible={renderModal}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Backdrop overlay (tap to close) */}
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                    <Pressable style={styles.backdropPressable} onPress={onClose} />
                </Animated.View>

                {/* Animated Left Slide Panel */}
                <Animated.View 
                    style={[
                        styles.drawerPanel, 
                        { 
                            width: DRAWER_WIDTH,
                            transform: [{ translateX: slideAnim }] 
                        }
                    ]}
                >
                    {children}

                    {/* Seamless Extended Rounded Pull Tab Handle (<) at Vertical Center */}
                    <TouchableOpacity
                        style={styles.extendedPullTabBtn}
                        onPress={onClose}
                        activeOpacity={0.85}
                    >
                        <CustomIcon library="Feather" name="chevron-left" size={18} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: Colors.MODAL_OVERLAY,
    },
    backdropPressable: {
        flex: 1,
    },
    drawerPanel: {
        height: '100%',
        backgroundColor: Colors.WHITE,
        position: 'relative',
        ...GlobalStyles.dropShadow(5),
        elevation: 5,
        zIndex: 100,
    },
    extendedPullTabBtn: {
        position: 'absolute',
        top: '50%',
        marginTop: -24,
        right: -24,
        width: 24,
        height: 48,
        borderTopRightRadius: 24,
        borderBottomRightRadius: 24,
        backgroundColor: Colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 200,
    },
});

export default Drawer;
