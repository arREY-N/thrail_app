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
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    formConstrainer: {
        width: '100%',
        maxWidth: 400,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 15,
        backgroundColor: Colors.GRAY_LIGHT,
        width: '100%',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
    backButton: {
        padding: 4,
        marginLeft: -4,
    },

    pageTitle: {
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 28,
    },

    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        borderWidth: 1,
        borderColor: '#FFCDD2',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
        width: '100%',
        gap: 8,
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 14,
        flex: 1,
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_MEDIUM,
        borderRadius: 8,
        marginBottom: 16,
        paddingHorizontal: 12,
        height: 54,
    },
    inputFocused: {
        borderColor: Colors.BLACK,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.BLACK,
        height: '100%',
        outlineStyle: 'none',
        minWidth: 0,
    },
    eyeIcon: {
        padding: 16,
    },

    buttonContainer: {
        width: '100%',
        gap: 0,
        marginTop: 10,
    },

    forgotContainer: {
        alignSelf: 'flex-start',
        marginBottom: 30,
        marginTop: -5,
    },
    forgotText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: Colors.BLACK,
    },
});