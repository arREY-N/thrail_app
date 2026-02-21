import React, { useRef, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import { Colors } from '../constants/colors';
import CustomIcon from './CustomIcon';
import CustomText from './CustomText';

const CustomDropdown = ({ 
    options = [], 
    value, 
    onSelect, 
    placeholder = "Select an option",
    label,
    children
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownLayout, setDropdownLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const buttonRef = useRef(null);

    const toggleDropdown = () => {
        if (isOpen) {
            setIsOpen(false);
        } else {
            buttonRef.current.measure((fx, fy, width, height, px, py) => {
                setDropdownLayout({ x: px, y: py + height + 8, width, height });
                setIsOpen(true);
            });
        }
    };

    const handleSelect = (item) => {
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
                style={[styles.dropdownButton, isOpen && styles.activeBorder]} 
                onPress={toggleDropdown}
                activeOpacity={0.8}
            >
                {children ? children : (
                    <CustomText style={[styles.text, !value && styles.placeholder]}>
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
                    <View style={[
                        styles.dropdownList, 
                        { 
                            top: dropdownLayout.y, 
                            left: dropdownLayout.x, 
                            width: dropdownLayout.width 
                        }
                    ]}>
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
                                        <CustomText style={[
                                            styles.optionText, 
                                            isSelected && styles.selectedOptionText
                                        ]}>
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
        color: "#9ca3af",
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
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
        backgroundColor: '#F3F4F6',
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