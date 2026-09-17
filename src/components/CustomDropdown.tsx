import React, { ReactNode, useRef, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

/**
 * A dropdown selector component allowing single or multiple selections.
 */
interface CustomDropdownProps {
    options?: string[];
    value?: string;
    onSelect: (item: string) => void;
    placeholder?: string;
    label?: string;
    children?: ReactNode;
}

interface DropdownLayout {
    x: number;
    y: number;
    width: number;
    height: number;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
    options = [], 
    value, 
    onSelect, 
    placeholder = "Select an option",
    label,
    children
}) => {
    
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [dropdownLayout, setDropdownLayout] = useState<DropdownLayout>({ x: 0, y: 0, width: 0, height: 0 });
    const buttonRef = useRef<View>(null);

    const toggleDropdown = (): void => {
        if (isOpen) {
            setIsOpen(false);
        } else {
            buttonRef.current!.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
                setDropdownLayout({ x: px, y: py + height + 8, width, height });
                setIsOpen(true);
            });
        }
    };

    const handleSelect = (item: string): void => {
        onSelect(item);
        setIsOpen(false);
    };

    return (
        <View style={styles.container}>
            {label && (
                <CustomText variant="label" style={styles.label}>
                    {label}
                </CustomText>
            )}
            
            <TouchableOpacity 
                ref={buttonRef}
                style={[
                    styles.dropdownButton, 
                    isOpen && styles.activeBorder
                ]} 
                onPress={toggleDropdown}
                activeOpacity={0.8}
            >
                {children ? children : (
                    <CustomText 
                        style={[
                            styles.text, 
                            !value && styles.placeholder
                        ]}
                    >
                        {value || placeholder}
                    </CustomText>
                )}
                
                <CustomIcon 
                    library="Feather"
                    name={isOpen ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={Colors.TEXT_SECONDARY} 
                />
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setIsOpen(false)}
                >
                    <View 
                        style={[
                            styles.dropdownList, 
                            { 
                                top: dropdownLayout.y, 
                                left: dropdownLayout.x, 
                                width: dropdownLayout.width 
                            }
                        ]}
                    >
                        <ScrollView 
                            nestedScrollEnabled 
                            style={styles.scrollList}
                            contentContainerStyle={{ paddingVertical: 4 }}
                        >
                            {options.map((option, index) => {
                                const isSelected = option === value;
                                return (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={[
                                            styles.optionItem, 
                                            isSelected && styles.selectedOption
                                        ]}
                                        onPress={() => handleSelect(option)}
                                    >
                                        <CustomText 
                                            style={[
                                                styles.optionText, 
                                                isSelected && styles.selectedOptionText
                                            ]}
                                        >
                                            {option}
                                        </CustomText>
                                        
                                        {isSelected && (
                                            <CustomIcon 
                                                library="Feather"
                                                name="check" 
                                                size={16} 
                                                color={Colors.PRIMARY} 
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
        marginLeft: 2,
    },
    dropdownButton: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 54,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activeBorder: {
        borderColor: Colors.PRIMARY,
    },
    text: {
        fontSize: 16,
        color: Colors.TEXT_PRIMARY,
    },
    placeholder: {
        color: Colors.TEXT_PLACEHOLDER,
        fontSize: 16,
    },
    
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    dropdownList: {
        position: 'absolute',
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        overflow: 'hidden', 
        ...GlobalStyles.dropShadow(5, 0.1, Colors.SHADOW, { radius: 8 }),
        maxHeight: 200,
    },
    scrollList: {
        flexGrow: 0,
    },
    optionItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedOption: {
        backgroundColor: Colors.GRAY_LIGHT,
    },
    optionText: {
        fontSize: 14,
        color: Colors.TEXT_PRIMARY,
    },
    selectedOptionText: {
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
});

export default CustomDropdown;