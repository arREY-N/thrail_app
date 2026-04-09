import React from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const CustomSelectModal = ({ 
    visible, 
    onClose, 
    title = "Select Option", 
    options = [], 
    selectedValue, 
    onSelect 
}) => {
    return (
        <Modal visible={visible} animationType="fade" transparent={true}>
            <TouchableOpacity 
                style={styles.modalOverlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <CustomText variant="h3">{title}</CustomText>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <CustomIcon library="Feather" name="x" size={24} color={Colors.TEXT_PRIMARY} />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
                        {options.length > 0 ? options.map(option => {
                            const isSelected = selectedValue === option.id;
                            return (
                                <TouchableOpacity 
                                    key={option.id}
                                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                                    onPress={() => {
                                        onSelect(option);
                                        onClose();
                                    }}
                                >
                                    <View style={styles.leftContent}>
                                        <CustomText style={isSelected ? styles.modalTextSelected : styles.modalText}>
                                            {option.label}
                                        </CustomText>
                                    </View>
                                    
                                    <View style={styles.rightContent}>
                                        {option.subLabel && (
                                            <CustomText style={isSelected ? styles.modalSubTextSelected : styles.modalSubText}>
                                                {option.subLabel}
                                            </CustomText>
                                        )}
                                        {isSelected && (
                                            <CustomIcon library="Feather" name="check" size={20} color={Colors.PRIMARY} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        }) : (
                            <CustomText style={{textAlign: 'center', marginTop: 20, color: Colors.TEXT_SECONDARY}}>
                                No options available.
                            </CustomText>
                        )}
                    </ScrollView>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    scrollArea: {
        maxHeight: 400,
    },
    closeBtn: {
        padding: 4,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    modalOptionSelected: {
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        borderBottomWidth: 0,
    },
    leftContent: {
        flex: 1,
        paddingRight: 12,
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalText: {
        fontSize: 16,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '500',
    },
    modalTextSelected: {
        fontSize: 16,
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    modalSubText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    modalSubTextSelected: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    }
});

export default CustomSelectModal;