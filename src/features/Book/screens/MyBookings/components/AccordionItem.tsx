import React, { ReactNode, useState } from 'react';
import {
    LayoutAnimation,
    Platform,
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    UIManager,
    View,
    ViewStyle
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IconLibrary } from '@/src/types/ui.types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface AccordionItemProps {
    /** Title of the accordion */
    title: string;
    /** Optional subtitle */
    subtitle?: string;
    /** Icon name */
    icon: string;
    /** Icon library, defaults to Feather */
    library?: IconLibrary;
    /** Children elements to render inside */
    children: ReactNode;
    /** Initial open state */
    defaultOpen?: boolean;
    /** Optional container styles */
    style?: StyleProp<ViewStyle>;
}

/**
 * Accordion component to display expandable content.
 * 
 * @param {AccordionItemProps} props - Component props
 */
const AccordionItem = ({ 
    title, 
    subtitle, 
    icon, 
    library = "Feather", 
    children, 
    defaultOpen = false,
    style
}: AccordionItemProps) => {
    const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

    const toggleAccordion = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsOpen(!isOpen);
    };

    return (
        <View style={[styles.container, style]}>
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
        
        
        
        
        ...GlobalStyles.dropShadow(3),
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
