/**
 * @file HikingPreferencesScreen.tsx
 * @description View for displaying user hiking preferences.
 */
import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { IPreference } from '@/src/core/models/User/interfaces/User.types';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

/**
 * Props for the HikingPreferencesScreen component
 * @param preferences - The user's hiking preferences
 * @param onBackPress - Callback to navigate back
 * @param onEditPress - Callback triggered when the user confirms they want to edit preferences
 */
export interface HikingPreferencesScreenProps {
    preferences?: IPreference;
    onBackPress: () => void;
    onEditPress?: () => void;
}

/**
 * HikingPreferencesScreen component displays the hiker's preferences (level, length, locations, provinces).
 */
const HikingPreferencesScreen = ({ preferences, onBackPress, onEditPress }: HikingPreferencesScreenProps) => {
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const { isMobile } = useBreakpoints();

    const handleConfirmEdit = (): void => {
        setShowEditModal(false);
        if (onEditPress) {
            onEditPress();
        }
    };

    const getExperienceStyles = (exp?: string) => {
        const level = exp?.toLowerCase() || '';
        if (level.includes('begin') || level.includes('novice')) {
            return {
                bg: Colors.STATUS_PENDING_BG,
                border: Colors.STATUS_PENDING_BORDER,
                text: Colors.STATUS_PENDING_TEXT,
                icon: 'compass',
            };
        } else if (level.includes('intermed') || level.includes('mod')) {
            return {
                bg: Colors.STATUS_DOWNPAYMENT_BG,
                border: Colors.STATUS_DOWNPAYMENT_BORDER,
                text: Colors.STATUS_DOWNPAYMENT_TEXT,
                icon: 'trending-up',
            };
        } else if (level.includes('adv') || level.includes('expert') || level.includes('pro')) {
            return {
                bg: Colors.STATUS_APPROVED_BG,
                border: Colors.STATUS_APPROVED_BORDER,
                text: Colors.STATUS_APPROVED_TEXT,
                icon: 'award',
            };
        }
        return {
            bg: Colors.CHIP_INACTIVE,
            border: Colors.GRAY_LIGHT,
            text: Colors.TEXT_SECONDARY,
            icon: 'star',
        };
    };

    const renderChips = (items?: string[]) => {
        if (!items || items.length === 0) {
            return (
                <View style={styles.emptyChip}>
                    <CustomIcon library="Feather" name="plus-circle" size={14} color={Colors.GRAY_MEDIUM} />
                    <CustomText variant="caption" style={styles.emptyChipText}>Not specified</CustomText>
                </View>
            );
        }
        return (
            <View style={styles.chipContainer}>
                {items.map((item, index) => (
                    <View key={index} style={styles.chip}>
                        <CustomIcon library="Feather" name="check" size={12} color={Colors.PRIMARY} style={styles.chipIcon} />
                        <CustomText variant="caption" style={styles.chipText}>{item}</CustomText>
                    </View>
                ))}
            </View>
        );
    };

    const expStyles = getExperienceStyles(preferences?.experience);

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <ConfirmationModal
                visible={showEditModal}
                title="Edit Preferences"
                message="Are you sure you want to edit your hiking preferences?"
                confirmText="Edit"
                cancelText="Cancel"
                onConfirm={handleConfirmEdit}
                onClose={() => setShowEditModal(false)}
            />

            <CustomHeader
                title="Hiking Preferences"
                centerTitle
                onBackPress={onBackPress}
                rightActions={
                    <TouchableOpacity onPress={() => setShowEditModal(true)} style={styles.headerIcon}>
                        <CustomIcon library="Feather" name="edit-2" size={20} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                }
            />

            <ScrollView contentContainerStyle={[styles.content, !isMobile && styles.desktopContent]} showsVerticalScrollIndicator={false}>

                <View style={[styles.layoutContainer, !isMobile && styles.desktopLayoutContainer]}>

                    {/* Hiker Profile Summary Header block */}
                    <View style={[styles.experienceCard, !isMobile && styles.experienceCardDesktop]}>
                        <View style={[styles.experienceIconCircle, { backgroundColor: expStyles.bg, borderColor: expStyles.border }]}>
                            <CustomIcon library="Feather" name={expStyles.icon} size={28} color={expStyles.text} />
                        </View>
                        <CustomText variant="caption" style={styles.experienceLabel}>HIKER PROFILE LEVEL</CustomText>
                        <CustomText variant="h2" style={[styles.experienceLevelText, { color: expStyles.text }]}>
                            {preferences?.experience || 'Not set'}
                        </CustomText>
                        <CustomText variant="caption" style={styles.description}>
                            Thrail personalizes routes, weather advisory checks, and trail guidance listings in CALABARZON to fit this profile level.
                        </CustomText>
                    </View>

                    {/* Unified preferences rows inside a single clean container card */}
                    <View style={[styles.detailsBlock, !isMobile && styles.detailsBlockDesktop]}>

                        {/* Hike length / Duration */}
                        <View style={styles.detailsRow}>
                            <View style={styles.rowHeader}>
                                <CustomIcon library="Feather" name="map" size={16} color={Colors.PRIMARY} />
                                <CustomText variant="body" style={styles.rowLabel}>Hike Duration</CustomText>
                            </View>
                            {renderChips(preferences?.hike_length)}
                        </View>

                        {/* Favorite Locations */}
                        <View style={styles.detailsRow}>
                            <View style={styles.rowHeader}>
                                <CustomIcon library="Feather" name="map-pin" size={16} color={Colors.PRIMARY} />
                                <CustomText variant="body" style={styles.rowLabel}>Favorite Destinations</CustomText>
                            </View>
                            {renderChips(preferences?.location)}
                        </View>

                        {/* Favorite Provinces */}
                        <View style={[styles.detailsRow, styles.noBorder]}>
                            <View style={styles.rowHeader}>
                                <CustomIcon library="Feather" name="navigation" size={16} color={Colors.PRIMARY} />
                                <CustomText variant="body" style={styles.rowLabel}>Preferred Provinces</CustomText>
                            </View>
                            {renderChips(preferences?.province)}
                        </View>
                    </View>

                </View>

            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 20,
        gap: 20,
        paddingBottom: 48,
    },
    desktopContent: {
        alignSelf: 'center',
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
    },
    layoutContainer: {
        gap: 20,
        width: '100%',
    },
    desktopLayoutContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    experienceCard: {
        backgroundColor: Colors.WHITE,
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        alignItems: 'center',
        ...GlobalStyles.dropShadow(2),
    },
    experienceCardDesktop: {
        flex: 1.2,
        minWidth: 280,
    },
    experienceIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    experienceLabel: {
        fontWeight: 'bold',
        color: Colors.GRAY_MEDIUM,
        letterSpacing: 1,
        fontSize: 10,
        marginBottom: 4,
    },
    experienceLevelText: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        lineHeight: 18,
        paddingHorizontal: 16,
    },
    detailsBlock: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 20,
        paddingVertical: 8,
        ...GlobalStyles.dropShadow(2),
    },
    detailsBlockDesktop: {
        flex: 2,
    },
    detailsRow: {
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        gap: 12,
    },
    noBorder: {
        borderBottomWidth: 0,
    },
    rowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    rowLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.BUTTON_OUTLINE_BG,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    chipIcon: {
        marginRight: 2,
    },
    chipText: {
        color: Colors.PRIMARY,
        fontWeight: '600',
    },
    emptyChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: Colors.GRAY_LIGHT,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
        alignSelf: 'flex-start',
    },
    emptyChipText: {
        color: Colors.GRAY_MEDIUM,
        fontWeight: '500',
    },
    headerIcon: {
        padding: 8,
    },
});

export default HikingPreferencesScreen;
