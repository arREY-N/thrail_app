/**
 * @file EditPointModal.tsx
 * @description Modal dialog component for adding or editing trail map pins/waypoints.
 * Uses Animated timing with translateY and opacity matching CustomFilterModal on ExploreScreen.
 * Adapts layout between centered modal on Desktop/Web and bottom sheet with safe-area insets on Mobile.
 */

import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '@/src/components/CustomButton';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ErrorMessage from '@/src/components/ErrorMessage';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IOfflinePoint } from '@/src/core/models/Trail/Trail';
import { PIN_TYPES, PinType } from '@/src/features/Map/map.types';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const WAYPOINT_SUGGESTIONS = [
    "Clean water source",
    "Strong wind area",
    "Resting spot / campsite",
    "High incline / steep path",
    "Scenic photo spot",
];

/**
 * Interface representing the properties of the EditPointModal component.
 *
 * @param visible - Flag indicating modal visibility.
 * @param onClose - Callback to dismiss the modal.
 * @param onSave - Callback triggered with point metadata when saving.
 * @param editingPoint - Optional existing point data to pre-fill for editing.
 */
interface EditPointModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (pointData: { name: string; type: PinType; description: string }) => void;
    editingPoint?: IOfflinePoint | null;
}

/**
 * EditPointModal component.
 * Provides interactive pin metadata editing with responsive mobile bottom-sheet and web centered overlay.
 * Uses `Animated.Value` slide-up and fade transitions matching `CustomFilterModal`.
 *
 * @param props - Component properties.
 * @returns {React.JSX.Element | null} The rendered modal component.
 */
const EditPointModal = ({
    visible,
    onClose,
    onSave,
    editingPoint,
}: EditPointModalProps): React.JSX.Element | null => {
    const insets = useSafeAreaInsets();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const [renderModal, setRenderModal] = useState<boolean>(visible);
    if (visible && !renderModal) {
        setRenderModal(true);
    }
    const [animValue] = useState(() => new Animated.Value(0));

    const [draftName, setDraftName] = useState<string>('');
    const [draftType, setDraftType] = useState<PinType>('checkpoint');
    const [draftDescription, setDraftDescription] = useState<string>('');
    const [nameError, setNameError] = useState<string | null>(null);

    const [prevVisibleKey, setPrevVisibleKey] = useState({ visible, editingPoint });
    if (prevVisibleKey.visible !== visible || prevVisibleKey.editingPoint !== editingPoint) {
        setPrevVisibleKey({ visible, editingPoint });
        if (visible) {
            if (editingPoint) {
                setDraftName(editingPoint.name || '');
                setDraftType((editingPoint.type as PinType) || 'checkpoint');
                setDraftDescription(editingPoint.description || '');
            } else {
                setDraftName('');
                setDraftType('checkpoint');
                setDraftDescription('');
            }
            setNameError(null);
        }
    }

    useEffect(() => {
        if (visible) {
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

    if (!renderModal) return null;

    const handleSavePress = () => {
        if (!draftName.trim()) {
            setNameError('Please enter a name for this map point.');
            return;
        }

        onSave({
            name: draftName.trim(),
            type: draftType,
            description: draftDescription.trim(),
        });
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
                        <CustomText variant="subtitle" style={styles.headerTitle}>
                            {editingPoint ? 'Edit Map Point' : 'Add Map Point'}
                        </CustomText>
                        <TouchableOpacity
                            onPress={onClose}
                            activeOpacity={0.7}
                            style={styles.closeBtn}
                        >
                            <CustomIcon
                                library="Feather"
                                name="x"
                                size={22}
                                color={Colors.TEXT_PRIMARY}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollBody}
                    >
                        {/* Validation Error Banner */}
                        <ErrorMessage error={nameError} style={styles.errorMargin} />

                        {/* Name Input */}
                        <CustomTextInput
                            label="Point Name *"
                            placeholder="e.g. Campsite 1, Summit Flag, Water Source"
                            value={draftName}
                            onChangeText={(val) => {
                                setDraftName(val);
                                if (nameError) setNameError(null);
                            }}
                            style={styles.noBottomMargin}
                        />

                        {/* Point Type Selection */}
                        <View style={styles.fieldSection}>
                            <CustomText variant="caption" style={styles.inputLabel}>
                                Point Type
                            </CustomText>
                            <View style={styles.typeSelectorContainer}>
                                {PIN_TYPES.map((typeOption) => {
                                    const isSelected = draftType === typeOption.value;
                                    return (
                                        <TouchableOpacity
                                            key={typeOption.value}
                                            style={[
                                                styles.typePill,
                                                { borderColor: typeOption.color },
                                                isSelected && { backgroundColor: typeOption.color },
                                            ]}
                                            onPress={() => setDraftType(typeOption.value as PinType)}
                                            activeOpacity={0.7}
                                        >
                                            <CustomIcon
                                                library="Feather"
                                                name={typeOption.icon}
                                                size={14}
                                                color={isSelected ? Colors.WHITE : typeOption.color}
                                            />
                                            <CustomText
                                                variant="caption"
                                                style={[
                                                    styles.typePillText,
                                                    { color: isSelected ? Colors.WHITE : Colors.TEXT_PRIMARY },
                                                ]}
                                            >
                                                {typeOption.label}
                                            </CustomText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Description Field with Feedback Suggestions */}
                        <CustomFeedbackInput
                            label="Description"
                            placeholder="Enter details for hikers (e.g. clean drinking water, steep incline)"
                            value={draftDescription}
                            onChangeText={setDraftDescription}
                            suggestions={WAYPOINT_SUGGESTIONS}
                        />
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.buttonRow}>
                        <CustomButton
                            title="Cancel"
                            onPress={onClose}
                            variant="secondary"
                            style={styles.modalActionBtn}
                        />
                        <CustomButton
                            title={editingPoint ? 'Save Changes' : 'Add Point'}
                            onPress={handleSavePress}
                            variant="primary"
                            style={styles.modalActionBtn}
                        />
                    </View>
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
        maxHeight: '85%',
        ...GlobalStyles.dropShadow(4),
    },
    modalContentMobile: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    modalContentDesktop: {
        alignSelf: 'center',
        width: 500,
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
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
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
    scrollBody: {
        padding: 20,
        gap: 16,
    },
    noBottomMargin: {
        marginBottom: 0,
    },
    errorMargin: {
        marginBottom: 8,
    },
    fieldSection: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    typeSelectorContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: Colors.WHITE,
    },
    typePillText: {
        fontSize: 12,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    modalActionBtn: {
        flex: 1,
    },
});

export default EditPointModal;
