/**
 * @file unauthorized.tsx
 * @description Screen component shown when a user attempts to access an unauthorized route.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { auth } from '@/src/core/config/Firebase';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Component representing the Unauthorized Access Screen.
 */
export default function unauthorized() {
    const router = useRouter();
    const isLoggedIn = !!auth.currentUser;

    const handleBackAction = () => {
        if (isLoggedIn) {
            router.replace('/(tabs)' as any);
        } else {
            router.replace('/' as any);
        }
    };

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
                                name="shield-off"
                                size={44}
                                color={Colors.ERROR}
                            />
                        </View>
                    </View>

                    <CustomText variant="title" style={styles.title}>
                        Access Denied
                    </CustomText>

                    <CustomText variant="body" style={styles.message}>
                        You do not have the proper authorization to access this page. Please return to a valid page.
                    </CustomText>

                    <View style={styles.buttonContainer}>
                        <CustomButton
                            title={isLoggedIn ? "Go to Home" : "Back to Login"}
                            onPress={handleBackAction}
                            variant="primary"
                        />
                    </View>
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
        backgroundColor: Colors.ERROR_BG,
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
    },
});