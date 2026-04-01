import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import { Colors } from '@/src/constants/colors';

const CustomStickyFooter = ({ primaryButton, secondaryButton }) => {
    if (!primaryButton) return null;

    return (
        <View style={styles.footer}>
            {secondaryButton ? (
                <View style={styles.buttonRow}>
                    <View style={styles.buttonWrapper}>
                        <CustomButton 
                            title={secondaryButton.title}
                            onPress={secondaryButton.onPress}
                            variant={secondaryButton.variant || 'outline'}
                            style={secondaryButton.style}
                            textStyle={secondaryButton.textStyle}
                            disabled={secondaryButton.disabled}
                        />
                    </View>
                    <View style={styles.buttonWrapper}>
                        <CustomButton 
                            title={primaryButton.title}
                            onPress={primaryButton.onPress}
                            variant={primaryButton.variant || 'primary'}
                            style={primaryButton.style}
                            textStyle={primaryButton.textStyle}
                            disabled={primaryButton.disabled}
                        />
                    </View>
                </View>
            ) : (
                <CustomButton 
                    title={primaryButton.title}
                    onPress={primaryButton.onPress}
                    variant={primaryButton.variant || 'primary'}
                    style={primaryButton.style}
                    textStyle={primaryButton.textStyle}
                    disabled={primaryButton.disabled}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        
        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        
        elevation: 10, 
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 16, 
    },
    buttonWrapper: {
        flex: 1,
    }
});

export default CustomStickyFooter;