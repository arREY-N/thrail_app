/**
 * @file PointDetailsModal.tsx
 * @description Dedicated modal sheet component for inspecting offline trail map waypoint details.
 * Implements smooth slide-up and fade animations matching CustomFilterModal, with adaptive layout
 * for desktop modal and mobile bottom-sheet with safe-area insets for Android 3-button navigation.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IOfflinePoint } from '@/src/core/models/Trail/Trail.types';
import { PIN_TYPES } from '@/src/features/Map/map.types';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Properties for the PointDetailsModal component.
 *
 * @param visible - Flag indicating whether the details modal is visible.
 * @param point - The active offline waypoint point object being inspected.
 * @param isEditable - Flag indicating if edit and delete actions are available.
 * @param onClose - Callback invoked to dismiss the modal.
 * @param onEdit - Callback invoked when user triggers point editing.
 * @param onDelete - Callback invoked when user triggers point deletion.
 */
interface PointDetailsModalProps {
    visible: boolean;
    point: IOfflinePoint | null;
    isEditable?: boolean;
    onClose: () => void;
    onEdit: (point: IOfflinePoint) => void;
    onDelete: (point: IOfflinePoint) => void;
}

/**
 * PointDetailsModal component.
 * 
 * @param props - Component properties.
 * @returns {React.JSX.Element | null} The rendered modal component.
 */
const PointDetailsModal = ({
    visible,
    point,
    isEditable = false,
    onClose,
    onEdit,
    onDelete,
}: PointDetailsModalProps): React.JSX.Element | null => {
    const insets = useSafeAreaInsets();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const [renderModal, setRenderModal] = useState<boolean>(visible);
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

    if (!renderModal || !point) return null;

    const pinConfig = PIN_TYPES.find((t) => t.value === point.type) || PIN_TYPES[1];

    const handleEditPress = () => {
        onEdit(point);
        onClose();
    };

    const handleDeletePress = () => {
        onDelete(point);
        onClose();
    };

    return (
        <Modal
            transparent={true}
            visible={renderModal}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                {/* Animated Backdrop */}
                <Animated.View style={[styles.backdrop, { opacity: animValue }]}>
                    <TouchableOpacity
                        style={styles.backdropTouch}
                        activeOpacity={1}
                        onPress={onClose}
                    />
                </Animated.View>

                {/* Animated Modal Content Panel */}
                <Animated.View
                    style={[
                        styles.modalContent,
                        isWideScreen ? styles.modalContentDesktop : styles.modalContentMobile,
                        { paddingBottom: isWideScreen ? 24 : Math.max(insets.bottom + 24, 24) },
                        {
                            transform: [
                                {
                                    translateY: animValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: isWideScreen ? [50, 0] : [SCREEN_HEIGHT, 0],
                                    }),
                                },
                            ],
                            opacity: isWideScreen ? animValue : 1,
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <View style={[styles.iconBadge, { backgroundColor: pinConfig.color }]}>
                                <CustomIcon
                                    library="Feather"
                                    name={pinConfig.icon}
                                    size={18}
                                    color={Colors.WHITE}
                                />
                            </View>
                            <View style={styles.titleTextWrapper}>
                                <CustomText variant="subtitle" style={styles.titleText}>
                                    {point.name}
                                </CustomText>
                                <CustomText variant="caption" style={styles.subtitleText}>
                                    {pinConfig.label}
                                </CustomText>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={onClose}
                            activeOpacity={0.7}
                        >
                            <CustomIcon library="Feather" name="x" size={20} color={Colors.TEXT_SECONDARY} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    {/* Body Content */}
                    <View style={styles.bodyContent}>
                        <CustomText variant="body" style={styles.descriptionText}>
                            {point.description || 'No description provided for this point.'}
                        </CustomText>
                    </View>

                    {/* Action Buttons */}
                    {isEditable && (
                        <View style={styles.actionsRow}>
                            <CustomButton
                                title="Edit Info"
                                onPress={handleEditPress}
                                variant="primary"
                                style={styles.actionBtn}
                            />
                            <CustomButton
                                title="Delete"
                                onPress={handleDeletePress}
                                variant="outline"
                                style={[styles.actionBtn, styles.deleteActionBorder]}
                                textStyle={{ color: Colors.ERROR }}
                            />
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        position: 'relative',
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: Colors.MODAL_OVERLAY,
    },
    backdropTouch: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: Colors.WHITE,
        width: '100%',
        ...GlobalStyles.dropShadow(4),
    },
    modalContentMobile: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    modalContentDesktop: {
        alignSelf: 'center',
        width: 480,
        borderRadius: 24,
        marginBottom: 'auto',
        marginTop: 'auto',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconBadge: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleTextWrapper: {
        flex: 1,
    },
    titleText: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        fontSize: 16,
    },
    subtitleText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    closeBtn: {
        padding: 6,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 18,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        width: '100%',
    },
    bodyContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    descriptionText: {
        fontSize: 14,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 20,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    actionBtn: {
        flex: 1,
    },
    deleteActionBorder: {
        borderColor: Colors.ERROR,
    },
});

export default PointDetailsModal;
