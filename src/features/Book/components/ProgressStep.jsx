import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const ProgressStep = ({ stepNum, title, libraryName, iconName, currentView, onStepPress }) => {
    const isActive = currentView >= stepNum;

    const isClickable = stepNum < currentView && currentView !== 4; 
    
    return (
        <TouchableOpacity 
            style={styles.stepContainer}
            activeOpacity={1}
            onPress={() => isClickable && onStepPress(stepNum)}
            disabled={!isClickable}
        >
            <View 
                style={[
                    styles.iconCircle, 
                    isActive ? styles.activeIconCircle : styles.inactiveIconCircle
                ]}
            >
                <CustomIcon 
                    library={libraryName}
                    name={iconName} 
                    size={20} 
                    color={isActive ? Colors.WHITE : Colors.GRAY_MEDIUM} 
                />
            </View>

            <CustomText 
                variant="caption" 
                style={[
                    styles.stepText, 
                    isActive ? styles.activeStepText : styles.inactiveStepText
                ]}
            >
                {title}
            </CustomText>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    stepContainer: {
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.BACKGROUND,
        paddingHorizontal: 4,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.BACKGROUND,
    },
    activeIconCircle: {
        backgroundColor: Colors.PRIMARY,
        borderWidth: 0,
        borderColor: 'transparent',
    },
    inactiveIconCircle: {
        backgroundColor: Colors.BACKGROUND,
        borderWidth: 1.5,
        borderColor: Colors.GRAY_LIGHT,
    },
    stepText: {
        fontSize: 12,
    },
    activeStepText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    inactiveStepText: {
        color: Colors.GRAY_MEDIUM,
        fontWeight: '500',
    },
});

export default ProgressStep;