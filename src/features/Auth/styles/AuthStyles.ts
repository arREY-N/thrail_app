/**
 * @file AuthStyles.ts
 * @description Standard layout, typography, form control, and responsive split-screen styles shared across all authentication screens.
 */

import { StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/colors';

export const AuthStyles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        width: '100%',
    },
    contentContainer: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 16, 
        paddingTop: 0, 
        paddingBottom: 48,
    },
    formConstrainer: {
        width: '100%',
        maxWidth: 380,
    },

    pageTitle: {
        textAlign: 'center',
        marginBottom: 20, 
    },

    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.ERROR_BG,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
        padding: 12,
        borderRadius: 8,
        marginBottom: 24, 
        width: '100%',
        gap: 8,
    },
    errorText: {
        color: Colors.ERROR,
        flex: 1,
    },

    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 10, 
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rememberText: {

    },
    forgotText: {
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },

    buttonContainer: {
        width: '100%',
        marginBottom: 16, 
        marginTop: 4,
    },

    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 16, 
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    dividerText: {
        marginHorizontal: 16, 
        color: Colors.GRAY_MEDIUM,
    },

    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        paddingVertical: 12,
        borderRadius: 12,
        width: '100%',
        gap: 12,
        marginBottom: 24, 
    },
    googleButtonText: {
        fontWeight: '600',
    },

    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 0,
    },
    footerText: {

    },
    signUpLink: {
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginLeft: 4,
    },

    pageContent: {
        padding: 16,
    },

    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    strengthBar: {
        flex: 1,           
        height: 4,         
        borderRadius: 2,   
    },

    passwordHint: {
        fontSize: 12,
        paddingHorizontal: 4,
        marginTop: 8,
        marginBottom: 16,
    },

    // ─── Split-Screen (isSplitScreen=true) compact overrides ─────────────────
    // Applied ONLY when screens are embedded in the LandingScreen split panel.
    // Does NOT affect standalone mobile routes.

    splitScreenScrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 32,
        paddingBottom: 16,
    },
    splitScreenTitle: {
        // Smaller title for desktop — overrides variant="title" default size
        fontSize: 24,
        marginBottom: 12,
        textAlign: 'center',
    },
    splitScreenSection: {
        // Tighter vertical rhythm between form rows in split-screen
        marginBottom: 16,
    },
    termsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        width: '100%',
    },
    termsText: {
        textAlign: 'center',
        lineHeight: 20,
        color: Colors.TEXT_SECONDARY,
    },
    termsLink: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
});
