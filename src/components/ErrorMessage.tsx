import React, { ReactNode } from 'react';
import {
    ActivityIndicator,
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

interface ErrorMessageProps {
    error?: string | null;
    style?: StyleProp<ViewStyle>;
    children?: ReactNode;
    onRetry?: () => void;
    isRetrying?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
    error, 
    style,
    children,
    onRetry,
    isRetrying = false,
}) => {
    
    if (!error && !children) return null;

    return (
        <View style={[styles.container, style]}>
            <CustomIcon 
                library="Feather" 
                name="alert-circle" 
                size={18} 
                color={Colors.ERROR} 
                style={styles.icon}
            />
            
            <View style={styles.textContainer}>
                {children ? (
                    children
                ) : onRetry ? (
                    <View style={styles.errorRow}>
                        <CustomText variant="caption" style={styles.text}>
                            {error}
                        </CustomText>
                        <TouchableOpacity
                            onPress={onRetry}
                            disabled={isRetrying}
                            style={styles.retryButton}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            {isRetrying ? (
                                <ActivityIndicator size="small" color={Colors.ERROR} />
                            ) : (
                                <View style={styles.retryButtonInner}>
                                    <CustomIcon
                                        library="Feather"
                                        name="rotate-cw"
                                        size={13}
                                        color={Colors.ERROR}
                                    />
                                    <CustomText variant="caption" style={styles.retryButtonText}>
                                        Retry
                                    </CustomText>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <CustomText variant="caption" style={styles.text}>
                        {error}
                    </CustomText>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.ERROR_BG, 
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,    
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        width: '100%',
        gap: 8,
    },
    icon: {
        marginTop: 2,
    },
    textContainer: {
        flex: 1,
    },
    text: {
        flex: 1,
        color: Colors.ERROR,
        fontWeight: '500',
        lineHeight: 20,
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 72,
        height: 32,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: Colors.ERROR_BG,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
    },
    retryButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    retryButtonText: {
        color: Colors.ERROR,
        fontWeight: '600',
    },
});

export default ErrorMessage;