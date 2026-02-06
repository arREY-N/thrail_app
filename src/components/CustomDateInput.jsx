import React, { useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const CustomDateInput = ({ 
    value, 
    onChangeText, 
    label 
}) => {
    const [activePicker, setActivePicker] = useState(null);

    const [mm, setMm] = useState('');
    const [dd, setDd] = useState('');
    const [yyyy, setYyyy] = useState('');

    useEffect(() => {
        if (value instanceof Date && !isNaN(value)) {
            setMm((value.getMonth() + 1).toString().padStart(2, '0'));
            setDd(value.getDate().toString().padStart(2, '0'));
            setYyyy(value.getFullYear().toString());
        } else {
            if (value === null || value === undefined) {
                setMm('');
                setDd('');
                setYyyy('');
            }
        }
    }, [value]);

    const daysData = useMemo(() => {
        let daysInMonth = 31;
        if (mm && yyyy) {
            daysInMonth = new Date(parseInt(yyyy), parseInt(mm), 0).getDate();
        } else if (mm) {
            const monthInt = parseInt(mm);
            if (monthInt === 2) daysInMonth = 29;
            else if ([4, 6, 9, 11].includes(monthInt)) daysInMonth = 30;
        }
        return Array.from({ length: daysInMonth }, (_, i) => {
            const val = (i + 1).toString().padStart(2, '0');
            return { label: val, value: val };
        });
    }, [mm, yyyy]);

    const monthsData = useMemo(() => {
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        return months.map((m, i) => ({ 
            label: m, 
            value: (i + 1).toString().padStart(2, '0') 
        }));
    }, []);

    const yearsData = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 100 }, (_, i) => ({ 
            label: (currentYear - i).toString(), 
            value: (currentYear - i).toString() 
        }));
    }, []);

    const handleSelect = (category, val) => {
        let newMM = mm;
        let newDD = dd;
        let newYYYY = yyyy;

        if (category === 'MM') newMM = val;
        if (category === 'DD') newDD = val;
        if (category === 'YYYY') newYYYY = val;

        if (newMM && newYYYY && newDD) {
             const maxDays = new Date(parseInt(newYYYY), parseInt(newMM), 0).getDate();
             if (parseInt(newDD) > maxDays) {
                 newDD = '';
             }
        }

        setMm(newMM);
        setDd(newDD);
        setYyyy(newYYYY);

        if (newMM && newDD && newYYYY) {
            const dateObj = new Date(parseInt(newYYYY), parseInt(newMM) - 1, parseInt(newDD));
            onChangeText(dateObj);
        }

        setActivePicker(null);
    };

    return (
        <View style={styles.container}>
            {label && 
                <CustomText variant="label" style={styles.label}> 
                    {label} 
                </CustomText>
            }

            <View style={styles.dateGroupContainer}>
                <DropdownPicker 
                    label="Month" 
                    value={mm} 
                    options={monthsData} 
                    flex={2} 
                    isMonth={true}
                    isActive={activePicker === 'MM'} 
                    onOpen={() => setActivePicker('MM')} 
                    onClose={() => setActivePicker(null)}
                    onSelect={(val) => handleSelect('MM', val)}
                />

                <DropdownPicker 
                    label="Day" 
                    value={dd} 
                    options={daysData} 
                    flex={1}
                    isActive={activePicker === 'DD'} 
                    onOpen={() => setActivePicker('DD')} 
                    onClose={() => setActivePicker(null)}
                    onSelect={(val) => handleSelect('DD', val)}
                />
                
                <DropdownPicker 
                    label="Year" 
                    value={yyyy} 
                    options={yearsData} 
                    flex={1.5}
                    isActive={activePicker === 'YYYY'} 
                    onOpen={() => setActivePicker('YYYY')} 
                    onClose={() => setActivePicker(null)}
                    onSelect={(val) => handleSelect('YYYY', val)}
                />
            </View>
        </View>
    );
};

const DropdownPicker = ({ 
    label, 
    value, 
    options, 
    onSelect, 
    flex, 
    isMonth, 
    isActive,
    onOpen, 
    onClose 
}) => {

    let displayValue = value;
    if (isMonth && value) {
        const monthObj = options.find(o => o.value === value);
        if (monthObj) displayValue = monthObj.label;
    }

    const textColor = value ? Colors.TEXT_PRIMARY : Colors.TEXT_PLACEHOLDER;

    return (
        <>
            <TouchableOpacity 
                style={[
                    styles.dropdownBox, 
                    { 
                        flex: flex || 1,
                        backgroundColor: isActive ? Colors.WHITE : Colors.BACKGROUND,
                        borderColor: isActive ? Colors.PRIMARY : Colors.GRAY_LIGHT
                    }
                ]} 
                onPress={onOpen} 
                activeOpacity={0.7}
            >
                <CustomText 
                    variant="body" 
                    style={[styles.dropdownText, { color: textColor }]}
                >
                    {displayValue || label}
                </CustomText>
                
                <CustomIcon 
                    library="Feather" 
                    name="chevron-down" 
                    size={16} 
                    color={Colors.GRAY_MEDIUM} 
                />
            </TouchableOpacity>

            <Modal 
                transparent={true} 
                visible={isActive} 
                animationType="fade" 
                onRequestClose={onClose}
            >
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>

                            <CustomText variant="subtitle" style={styles.modalTitle}>
                                Select {label}
                            </CustomText>

                            <FlatList 
                                data={options} 
                                keyExtractor={(item) => item.value}
                                showsVerticalScrollIndicator={true} 
                                persistentScrollbar={true}
                                initialNumToRender={15}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={styles.optionItem} 
                                        onPress={() => onSelect(item.value)}
                                    >
                                        <CustomText 
                                            variant="body"
                                            style={[
                                                styles.optionText, 
                                                item.value === value && { color: Colors.PRIMARY, fontWeight: '700' }
                                            ]}
                                        >
                                            {item.label}
                                        </CustomText>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    label: {
        marginBottom: 8,
        marginLeft: 2,
    },
    dateGroupContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    dropdownBox: {
        borderWidth: 1,
        borderRadius: 12,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    dropdownText: {
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.MODAL_OVERLAY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        maxHeight: '50%',
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
    },
    optionItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    optionText: {
        textAlign: 'center',
    }
});

export default CustomDateInput;