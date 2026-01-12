import { StyleSheet } from 'react-native';
import { Colors } from '../../../constants/colors';

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
        flex: 1,
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 16, 
        paddingTop: 32, 
    },
    formConstrainer: {
        width: '100%',
        maxWidth: 400,
    },

    pageTitle: {
        textAlign: 'center',
        marginBottom: 32, 
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.BLACK,
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
        fontSize: 14,
        flex: 1,
    },

    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 16, 
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rememberText: {
        fontSize: 14,
        color: Colors.GRAY,
    },
    forgotText: {
        fontWeight: '600',
        fontSize: 14,
        color: Colors.PRIMARY,
    },

    buttonContainer: {
        width: '100%',
        marginBottom: 24, 
        marginTop: 8,
    },

    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 24, 
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    dividerText: {
        marginHorizontal: 16, 
        color: Colors.GRAY_MEDIUM,
        fontSize: 14,
    },

    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        paddingVertical: 16,
        borderRadius: 12,
        width: '100%',
        gap: 12,
        marginBottom: 40, 
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.BLACK,
    },

    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    footerText: {
        fontSize: 14,
        color: Colors.GRAY,
    },
    signUpLink: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginLeft: 4,
    },
});