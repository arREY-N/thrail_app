/**
 * @file +not-found.tsx
 * @description Screen shown when the requested page or route cannot be found.
 */

import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { auth } from '@/src/core/config/Firebase';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Component representing the Not Found Screen.
 */
export default function notFound() {
    const router = useRouter();
    const { isMobile } = useBreakpoints();
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
            <Stack.Screen options={{ headerShown: false }} />
            
            <CustomHeader 
                title="Page Not Found" 
                onBackPress={handleBackAction}
            />

            <ResponsiveScrollView
                minHeight={600}
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={[styles.card, !isMobile && styles.desktopCard]}>
                    <View style={styles.iconOuter}>
                        <View style={styles.iconInner}>
                            <CustomIcon
                                library="Feather"
                                name="compass"
                                size={44}
                                color={Colors.PRIMARY}
                            />
                        </View>
                    </View>

                    <CustomText variant="title" style={styles.title}>
                        Page Not Found
                    </CustomText>

                    <CustomText variant="body" style={styles.message}>
                        Sorry, but the page you requested is unavailable or does not exist.
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
        paddingBottom: 80,
    },
    card: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    desktopCard: {
        maxWidth: Layout.MAX_WIDTH,
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(3),
        elevation: 3,
    },
    iconOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.BUTTON_OUTLINE_BG,
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
