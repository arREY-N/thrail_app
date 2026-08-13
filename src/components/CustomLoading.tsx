import React, { ReactNode } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View
} from 'react-native';

import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

/**
 * A full-screen loading overlay to block interaction while tasks process.
 */
interface CustomLoadingProps {
    visible?: boolean;
    message?: string;
    children?: ReactNode;
}

const CustomLoading: React.FC<CustomLoadingProps> = ({ 
    visible = true, 
    message = "Loading...", 
    children
}) => {
    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                <ActivityIndicator size="large" color={Colors.PRIMARY || Colors.BLACK} />
                
                {children ? (
                    children
                ) : (
                    <CustomText variant="body" style={styles.text}>
                        {message}
                    </CustomText>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: Colors.MODAL_OVERLAY,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    container: {
        backgroundColor: Colors.WHITE,
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        ...GlobalStyles.dropShadow(5, 0.1, Colors.SHADOW, { radius: 12 }),
        minWidth: 150,
    },
    text: {
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    }
});

export default CustomLoading;
