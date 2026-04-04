import React, { useState } from 'react';
import {
    LayoutAnimation,
    Platform,
    StyleSheet,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AccordionItem = ({ title, subtitle, icon, library = "Feather", children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleAccordion = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsOpen(!isOpen);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                style={styles.header} 
                onPress={toggleAccordion}
                activeOpacity={0.7}
            >
                <View style={styles.titleRow}>
                    <CustomIcon 
                        library={library} 
                        name={icon} 
                        size={20} 
                        color={Colors.PRIMARY} 
                    />
                    <View style={styles.textColumn}>
                        <CustomText variant="label" style={styles.title}>
                            {title}
                        </CustomText>
                        {subtitle && (
                            <CustomText variant="caption" style={styles.subtitle}>
                                {subtitle}
                            </CustomText>
                        )}
                    </View>
                </View>
                <CustomIcon 
                    library="Feather" 
                    name={isOpen ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={Colors.TEXT_SECONDARY} 
                />
            </TouchableOpacity>

            {isOpen && (
                <View style={styles.content}>
                    {children}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginHorizontal: 20,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    textColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    subtitle: {
        color: Colors.PRIMARY,
        marginTop: 2,
        fontWeight: '500',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
});

export default AccordionItem;