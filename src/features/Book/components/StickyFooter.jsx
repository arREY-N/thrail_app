import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import { Colors } from '@/src/constants/colors';

const StickyFooter = ({ 
    title, 
    onPress, 
    isDisabled, 
    
    secondaryTitle,
    secondaryOnPress,
    secondaryIsDisabled,
    secondaryVariant = "outline",
    secondaryButtonStyle,
    secondaryTextStyle
}) => {
    return (
        <View style={styles.footer}>
            {secondaryTitle ? (
                <View style={styles.buttonRow}>
                    <CustomButton 
                        title={secondaryTitle}
                        onPress={secondaryIsDisabled ? undefined : secondaryOnPress}
                        variant={secondaryVariant}
                        style={[styles.flexButton, secondaryButtonStyle, secondaryIsDisabled && styles.disabledButton]}
                        textStyle={secondaryTextStyle}
                    />
                    <CustomButton 
                        title={title} 
                        onPress={isDisabled ? undefined : onPress}
                        style={[styles.flexButton, isDisabled && styles.disabledButton]}
                    />
                </View>
            ) : (
                <CustomButton 
                    title={title} 
                    onPress={isDisabled ? undefined : onPress}
                    style={isDisabled ? styles.disabledButton : undefined}
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
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: Colors.WHITE,
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
        gap: 12,
    },
    flexButton: {
        flex: 1,
    },
    disabledButton: {
        opacity: 0.5,
    }
});

export default StickyFooter;