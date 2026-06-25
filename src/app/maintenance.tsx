/**
 * @file maintenance.tsx
 * @description Screen component shown when the application is under maintenance.
 */

import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import useMaintenance from '@/src/core/hook/useMaintenance';

/**
 * Component representing the Maintenance Screen.
 */
export const MaintenanceScreen = () => {
    const { url, handlePress } = useMaintenance();

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <ResponsiveScrollView
                minHeight={600}
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.card}>
                    <View style={styles.iconOuter}>
                        <View style={styles.iconInner}>
                            <CustomIcon
                                library="Feather"
                                name="tool"
                                size={44}
                                color={Colors.STATUS_MAINTENANCE_TEXT}
                            />
                        </View>
                    </View>

                    <CustomText variant="title" style={styles.title}>
                        Under Maintenance
                    </CustomText>

                    <CustomText variant="body" style={styles.message}>
                        Sorry, but the site is currently under maintenance. We'll be back soon!
                    </CustomText>

                    <View style={styles.buttonContainer}>
                        <CustomButton
                            title="Download Mobile App"
                            onPress={() => handlePress('https://expo.dev/accounts/thrail/projects/thrail_app/builds/d73b6843-8ed1-4e79-b228-017b7d9aad8c')}
                            variant="primary"
                        />
                    </View>

                    <TouchableOpacity 
                        onPress={() => handlePress(url)}
                        style={styles.watermarkContainer}
                        activeOpacity={0.7}
                    >
                        <CustomText variant="caption" style={styles.watermarkText}>
                            Thrail 2026
                        </CustomText>
                    </TouchableOpacity>
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 440,
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        paddingVertical: 48,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        ...GlobalStyles.dropShadow(3),
        elevation: 3,
    },
    iconOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.STATUS_MAINTENANCE_BG,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        ...GlobalStyles.dropShadow(2),
        elevation: 2,
    },
    iconInner: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: Colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 12,
    },
    message: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        lineHeight: 24,
        marginBottom: 32,
        maxWidth: 380,
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 320,
        marginBottom: 48,
    },
    watermarkContainer: {
        padding: 8,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    watermarkText: {
        color: Colors.TEXT_SECONDARY,
        textDecorationLine: 'underline',
        opacity: 0.8,
    },
});

export default MaintenanceScreen;

