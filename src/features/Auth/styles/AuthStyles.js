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
        paddingTop: 0, 
        paddingBottom: 16,
    },
    formConstrainer: {
        width: '100%',
        maxWidth: 400,
    },

    pageTitle: {
        textAlign: 'center',
        marginBottom: 32, 
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
        marginBottom: 16, 
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
});