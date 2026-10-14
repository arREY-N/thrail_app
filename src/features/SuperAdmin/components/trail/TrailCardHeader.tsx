/**
 * @file TrailCardHeader.tsx
 * @description Header component for trail form cards.
 * Provides a responsive layout (right-anchored badge on desktop vs. inline title badge on mobile)
 * and interactive status badges (ready green, required neutral/red error, optional neutral).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { IconLibrary } from '@/src/types/ui.types';

export interface TrailCardHeaderProps {
    title: string;
    subtitle: string;
    iconName: string;
    iconLibrary?: IconLibrary;
    status: 'ready' | 'required' | 'optional';
    hasError?: boolean;
    isDesktop: boolean;
    isMobile: boolean;
}

const TrailCardHeader: React.FC<TrailCardHeaderProps> = ({
    title,
    subtitle,
    iconName,
    iconLibrary = 'Feather',
    status,
    hasError = false,
    isDesktop,
    isMobile,
}) => {
    const isErrorState = status === 'required' && hasError;

    const renderBadge = () => {
        if (status === 'ready') {
            return (
                <View style={styles.readyBadge}>
                    <CustomIcon
                        library="Feather"
                        name="check"
                        size={12}
                        color={Colors.PRIMARY}
                    />
                    <CustomText variant="caption" style={styles.readyBadgeText}>
                        Ready
                    </CustomText>
                </View>
            );
        }

        if (status === 'optional') {
            return (
                <View style={styles.optionalBadge}>
                    <CustomText variant="caption" style={styles.optionalBadgeText}>
                        Optional
                    </CustomText>
                </View>
            );
        }

        // status === 'required'
        if (isErrorState) {
            return (
                <View style={styles.errorBadge}>
                    <CustomIcon
                        library="Feather"
                        name="alert-circle"
                        size={12}
                        color={Colors.STATUS_CANCELLED_TEXT}
                    />
                    <CustomText variant="caption" style={styles.errorBadgeText}>
                        Required
                    </CustomText>
                </View>
            );
        }

        return (
            <View style={styles.requiredBadge}>
                <CustomText variant="caption" style={styles.requiredBadgeText}>
                    Required
                </CustomText>
            </View>
        );
    };

    return (
        <View style={styles.headerContainer}>
            <View style={styles.leftGroup}>
                <View style={[styles.iconCircle, isMobile && styles.iconCircleMobile]}>
                    <CustomIcon
                        library={iconLibrary}
                        name={iconName}
                        size={isMobile ? 18 : 20}
                        color={Colors.PRIMARY}
                    />
                </View>
                <View style={styles.textWrapper}>
                    <CustomText variant="subtitle" style={styles.sectionTitle}>
                        {title}
                    </CustomText>
                    <CustomText variant="caption" style={styles.sectionSubtitle}>
                        {subtitle}
                    </CustomText>
                </View>
            </View>
            <View style={styles.badgeWrapper}>
                {renderBadge()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
    },
    leftGroup: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        flex: 1,
        paddingRight: 8,
    },
    textWrapper: {
        flex: 1,
        gap: 2,
    },
    badgeWrapper: {
        alignSelf: 'flex-start',
        paddingTop: 2,
        flexShrink: 0,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    iconCircleMobile: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        fontSize: 16,
        lineHeight: 20,
        marginBottom: 0,
    },
    sectionSubtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        lineHeight: 16,
    },
    readyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    readyBadgeText: {
        color: Colors.PRIMARY,
        fontWeight: '600',
        fontSize: 11,
    },
    requiredBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    requiredBadgeText: {
        color: Colors.PRIMARY,
        fontWeight: '600',
        fontSize: 11,
    },
    errorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        borderWidth: 1,
        borderColor: Colors.STATUS_CANCELLED_TEXT,
    },
    errorBadgeText: {
        color: Colors.STATUS_CANCELLED_TEXT,
        fontWeight: '600',
        fontSize: 11,
    },
    optionalBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    optionalBadgeText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
        fontSize: 11,
    },
});

export default TrailCardHeader;
