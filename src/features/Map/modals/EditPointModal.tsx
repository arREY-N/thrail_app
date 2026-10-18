/**
 * @file EditPointModal.tsx
 * @description Modal dialog component for adding or editing trail map pins/waypoints.
 * Uses Animated timing with translateY and opacity matching CustomFilterModal on ExploreScreen.
 * Adapts layout between centered modal on Desktop/Web and bottom sheet with safe-area insets on Mobile.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { CustomToast, ToastType } from '@/src/components/Toast/Toast';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IOfflinePoint } from '@/src/core/models/Trail/Trail';
import {
    IWaypointPoint,
    PinIconName,
} from '@/src/features/Map/interfaces/Map.types';
import {
    PIN_COLOR_SWATCHES,
    PIN_ICON_OPTIONS,
    PIN_TYPES,
    PinType,
} from '@/src/features/Map/utils/pinConfig';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const WAYPOINT_SUGGESTIONS = [
    "Clean water source",
    "Strong wind area",
    "Resting spot / campsite",
    "High incline / steep path",
    "Scenic photo spot",
];

const PRESET_NAMES = [
    'summit',
    'checkpoint',
    'viewpoint',
    'water source',
    'water',
    'shelter',
    'hazard warning',
    'hazard',
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
    onSave: (pointData: {
        name: string;
        type: PinType;
        description: string;
        customCategory?: string;
        color?: string;
        icon?: PinIconName;
    }) => void;
    editingPoint?: (IOfflinePoint | IWaypointPoint) | null;
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
    const [draftType, setDraftType] = useState<PinType | null>(null);
    const [draftCustomCategory, setDraftCustomCategory] = useState<string>('');
    const [draftColor, setDraftColor] = useState<string>(Colors.PIN_TEAL);
    const [draftIcon, setDraftIcon] = useState<PinIconName>('tag');
    const [draftDescription, setDraftDescription] = useState<string>('');
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const [toastState, setToastState] = useState<{
        visible: boolean;
        message: string;
        type: ToastType;
    }>({
        visible: false,
        message: '',
        type: 'error',
    });

    const showModalToast = (message: string, type: ToastType = 'error') => {
        setHasAttemptedSubmit(true);
        setToastState({
            visible: true,
            message,
            type,
        });
    };

    const [prevVisibleKey, setPrevVisibleKey] = useState({ visible, editingPoint });
    if (prevVisibleKey.visible !== visible || prevVisibleKey.editingPoint !== editingPoint) {
        setPrevVisibleKey({ visible, editingPoint });
        if (visible) {
            if (editingPoint) {
                const waypoint = editingPoint as IWaypointPoint;
                setDraftName(waypoint.name || '');
                setDraftType((waypoint.type as PinType) || null);
                setDraftCustomCategory(waypoint.customCategory || '');
                setDraftColor(waypoint.color || Colors.PIN_TEAL);
                setDraftIcon(waypoint.icon || 'tag');
                setDraftDescription(waypoint.description || '');
            } else {
                setDraftName('');
                setDraftType(null);
                setDraftCustomCategory('');
                setDraftColor(Colors.PIN_TEAL);
                setDraftIcon('tag');
                setDraftDescription('');
            }
            setHasAttemptedSubmit(false);
            setShowConfirmModal(false);
            setToastState({ visible: false, message: '', type: 'error' });
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

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, () => {
            setIsKeyboardVisible(true);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setIsKeyboardVisible(false);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    if (!renderModal) return null;

    const initialName = (editingPoint as IWaypointPoint | undefined)?.name || '';
    const initialType = ((editingPoint as IWaypointPoint | undefined)?.type as PinType | undefined) || null;
    const initialCustomCategory = (editingPoint as IWaypointPoint | undefined)?.customCategory || '';
    const initialColor = (editingPoint as IWaypointPoint | undefined)?.color || Colors.PIN_TEAL;
    const initialIcon = (editingPoint as IWaypointPoint | undefined)?.icon || 'tag';
    const initialDescription = (editingPoint as IWaypointPoint | undefined)?.description || '';

    const isPointDirty = Boolean(
        editingPoint && (
            draftName.trim() !== initialName.trim() ||
            draftType !== initialType ||
            draftDescription.trim() !== initialDescription.trim() ||
            (draftType === 'other' && (
                draftCustomCategory.trim() !== initialCustomCategory.trim() ||
                draftColor !== initialColor ||
                draftIcon !== initialIcon
            ))
        )
    );

    const isFormFilled = Boolean(draftName.trim() && draftType);
    const isReadyToSave = editingPoint ? isPointDirty : isFormFilled;

    const isDuplicatePreset = (categoryText: string): boolean => {
        const normalized = categoryText.trim().toLowerCase();
        return PRESET_NAMES.includes(normalized);
    };

    const handleCustomCategoryChange = (val: string) => {
        setDraftCustomCategory(val);
        if (hasAttemptedSubmit) setHasAttemptedSubmit(false);
        if (toastState.visible) setToastState((prev) => ({ ...prev, visible: false }));
    };

    const executeSave = () => {
        if (!draftType) return;
        const payload: {
            name: string;
            type: PinType;
            description: string;
            customCategory?: string;
            color?: string;
            icon?: PinIconName;
        } = {
            name: draftName.trim(),
            type: draftType,
            description: draftDescription.trim(),
        };
        if (draftType === 'other') {
            if (draftCustomCategory.trim()) {
                payload.customCategory = draftCustomCategory.trim();
            }
            if (draftColor) {
                payload.color = draftColor;
            }
            if (draftIcon) {
                payload.icon = draftIcon;
            }
        }
        onSave(payload);
        onClose();
    };

    const handleSavePress = () => {
        if (editingPoint && !isPointDirty) {
            showModalToast('No changes made to this map point.');
            return;
        }

        if (!draftName.trim()) {
            showModalToast('Please enter a name for this map point before saving.');
            return;
        }

        if (!draftType) {
            showModalToast('Please select a point type before saving.');
            return;
        }

        if (draftType === 'other' && isDuplicatePreset(draftCustomCategory)) {
            showModalToast(`"${draftCustomCategory.trim()}" is already an existing point type. Please select the preset above or enter a custom name.`);
            return;
        }

        if (editingPoint) {
            setShowConfirmModal(true);
        } else {
            executeSave();
        }
    };

    return (
        <Modal
            transparent={true}
            visible={renderModal}
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalContainer}
            >
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
                        {
                            paddingBottom: isWideScreen
                                ? 24
                                : (isKeyboardVisible ? 16 : Math.max(insets.bottom + 24, 24)),
                            maxHeight: isKeyboardVisible
                                ? (isWideScreen ? '85%' : '90%')
                                : '85%',
                        },
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
                        ref={scrollViewRef}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollBody}
                    >
                        {/* Name Input */}
                        <CustomTextInput
                            label="Point Name *"
                            placeholder="e.g. Campsite 1, Summit Flag, Water Source"
                            value={draftName}
                            onChangeText={(val: string) => {
                                setDraftName(val);
                                if (hasAttemptedSubmit) setHasAttemptedSubmit(false);
                                if (toastState.visible) setToastState((prev) => ({ ...prev, visible: false }));
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
                                    const isOther = typeOption.value === 'other';

                                    // Dynamic reflection for 'other' option
                                    const activeColor = isOther && isSelected ? draftColor : typeOption.color;
                                    const activeIcon = isOther && isSelected ? draftIcon : typeOption.icon;
                                    const displayLabel = isOther && isSelected && draftCustomCategory.trim()
                                        ? draftCustomCategory.trim()
                                        : typeOption.label;

                                    const pillBtn = (
                                        <TouchableOpacity
                                            key={typeOption.value}
                                            style={[
                                                styles.typePill,
                                                isSelected && {
                                                    backgroundColor: `${activeColor}15`,
                                                    borderColor: activeColor,
                                                },
                                            ]}
                                            onPress={() => {
                                                setDraftType(typeOption.value as PinType);
                                                if (hasAttemptedSubmit) setHasAttemptedSubmit(false);
                                                if (toastState.visible) setToastState((prev) => ({ ...prev, visible: false }));
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <CustomIcon
                                                library="Feather"
                                                name={activeIcon}
                                                size={15}
                                                color={isSelected ? activeColor : Colors.TEXT_SECONDARY}
                                            />
                                            <CustomText
                                                variant="caption"
                                                numberOfLines={1}
                                                style={[
                                                    styles.typePillText,
                                                    isSelected && [
                                                        styles.typePillTextSelected,
                                                        { color: activeColor },
                                                    ],
                                                ]}
                                            >
                                                {displayLabel}
                                            </CustomText>
                                        </TouchableOpacity>
                                    );

                                    if (isOther) {
                                        return (
                                            <View key={typeOption.value} style={styles.otherPillWrapper}>
                                                {pillBtn}
                                                {isSelected && (
                                                    <View style={styles.miniMapPinBesidePill}>
                                                        <View style={[styles.pinCirclePreview, { backgroundColor: draftColor }]}>
                                                            <CustomIcon library="Feather" name={draftIcon} size={11} color={Colors.WHITE} />
                                                        </View>
                                                        <View style={[styles.pinTrianglePreview, { borderTopColor: draftColor }]} />
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    }

                                    return pillBtn;
                                })}
                            </View>

                            {/* Custom Category Configuration Section */}
                            {draftType === 'other' && (
                                <View style={styles.otherFieldsSection}>
                                    {/* Custom Category Input with Character Limit */}
                                    <View style={styles.customCategoryInputBlock}>
                                        <View style={styles.customCategoryLabelRow}>
                                            <CustomText variant="caption" style={styles.customCategoryLabel}>
                                                Category Name
                                            </CustomText>
                                            <CustomText variant="caption" style={styles.charCounterText}>
                                                {`${draftCustomCategory.length}/24`}
                                            </CustomText>
                                        </View>
                                        <CustomTextInput
                                            placeholder="e.g. Campsite, Cave, Ranger Post"
                                            value={draftCustomCategory}
                                            onChangeText={handleCustomCategoryChange}
                                            maxLength={24}
                                            style={styles.noBottomMargin}
                                        />
                                    </View>

                                    {/* Curated Feather Icon Picker */}
                                    <View style={styles.iconSection}>
                                        <CustomText variant="caption" style={styles.swatchTitle}>
                                            Choose Pin Icon
                                        </CustomText>
                                        <View style={styles.iconSelectorRow}>
                                            {PIN_ICON_OPTIONS.map((iconOpt) => {
                                                const isIconActive = draftIcon === iconOpt;
                                                return (
                                                    <TouchableOpacity
                                                        key={iconOpt}
                                                        style={[
                                                             styles.iconOptionBtn,
                                                             isIconActive && {
                                                                 backgroundColor: `${draftColor}18`,
                                                                 borderColor: draftColor,
                                                             },
                                                        ]}
                                                        onPress={() => setDraftIcon(iconOpt)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <CustomIcon
                                                            library="Feather"
                                                            name={iconOpt}
                                                            size={18}
                                                            color={isIconActive ? draftColor : Colors.TEXT_SECONDARY}
                                                        />
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>

                                    {/* Curated Color Swatches */}
                                    <View style={styles.swatchSection}>
                                        <CustomText variant="caption" style={styles.swatchTitle}>
                                            Choose Pin Color
                                        </CustomText>
                                        <View style={styles.swatchRow}>
                                            {PIN_COLOR_SWATCHES.map((swatch) => {
                                                const isSwatchActive = draftColor === swatch.color;
                                                return (
                                                    <TouchableOpacity
                                                        key={swatch.id}
                                                        style={[
                                                            styles.swatchCircle,
                                                            { backgroundColor: swatch.color },
                                                            isSwatchActive && styles.swatchCircleActive,
                                                        ]}
                                                        onPress={() => setDraftColor(swatch.color)}
                                                        activeOpacity={0.7}
                                                    >
                                                        {isSwatchActive && (
                                                            <CustomIcon
                                                                library="Feather"
                                                                name="check"
                                                                size={14}
                                                                color={Colors.WHITE}
                                                            />
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                </View>
                            )}
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
                            style={[
                                styles.modalActionBtn,
                                hasAttemptedSubmit
                                    ? styles.saveBtnError
                                    : (!isReadyToSave ? styles.saveBtnIdle : undefined),
                            ]}
                            textStyle={
                                hasAttemptedSubmit
                                    ? styles.saveBtnTextError
                                    : (!isReadyToSave ? styles.saveBtnTextIdle : undefined)
                            }
                        />
                    </View>

                    {/* Toast Notification Above Action Buttons */}
                    <CustomToast
                        visible={toastState.visible}
                        message={toastState.message}
                        type={toastState.type}
                        mode="dismissible"
                        position="sticky_footer"
                        bottomOffset={isWideScreen ? 96 : (isKeyboardVisible ? 88 : Math.max(insets.bottom + 96, 96))}
                        onHide={() => {
                            setToastState((prev) => ({ ...prev, visible: false }));
                            setHasAttemptedSubmit(false);
                        }}
                    />
                </Animated.View>
            </KeyboardAvoidingView>

            {/* Save Changes Confirmation Modal */}
            <ConfirmationModal
                visible={showConfirmModal}
                title="Save Point Changes?"
                message={`Are you sure you want to save the changes made to "${draftName.trim()}"?`}
                confirmText="Save Changes"
                cancelText="Keep Editing"
                iconName="map-pin"
                onConfirm={() => {
                    setShowConfirmModal(false);
                    executeSave();
                }}
                onClose={() => setShowConfirmModal(false)}
            />
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
        gap: 8,
        borderWidth: 1.5,
        borderColor: Colors.GRAY_LIGHT,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: Colors.BACKGROUND,
    },
    typePillText: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.TEXT_SECONDARY,
    },
    typePillTextSelected: {
        fontWeight: 'bold',
    },
    otherPillWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    miniMapPinBesidePill: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    otherFieldsSection: {
        marginTop: 12,
        gap: 14,
    },
    pinCirclePreview: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.WHITE,
        alignItems: 'center',
        justifyContent: 'center',
        ...GlobalStyles.dropShadow(2),
    },
    pinTrianglePreview: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 4,
        borderRightWidth: 4,
        borderTopWidth: 5,
        borderBottomWidth: 0,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginTop: -0.5,
    },
    customCategoryInputBlock: {
        gap: 4,
    },
    customCategoryLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    customCategoryLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    charCounterText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    iconSection: {
        gap: 8,
    },
    iconSelectorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    iconOptionBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        backgroundColor: Colors.WHITE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    swatchSection: {
        gap: 8,
    },
    swatchTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    swatchRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    swatchCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(2),
    },
    swatchCircleActive: {
        borderWidth: 2.5,
        borderColor: Colors.TEXT_PRIMARY,
        transform: [{ scale: 1.15 }],
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
    saveBtnIdle: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderColor: Colors.GRAY_LIGHT,
        borderWidth: 1.5,
    },
    saveBtnTextIdle: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
    },
    saveBtnError: {
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        borderColor: Colors.STATUS_CANCELLED_TEXT,
        borderWidth: 1.5,
    },
    saveBtnTextError: {
        color: Colors.STATUS_CANCELLED_TEXT,
        fontWeight: 'bold',
    },
});

export default EditPointModal;
