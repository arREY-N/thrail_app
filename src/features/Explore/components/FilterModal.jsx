import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FilterModal = ({ visible, onClose, onApply }) => {
    const [selectedDifficulty, setSelectedDifficulty] = useState('Any');
    const [selectedDistance, setSelectedDistance] = useState('Any');

    const [renderModal, setRenderModal] = useState(visible);
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setRenderModal(true);
            Animated.timing(animValue, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(animValue, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start(() => setRenderModal(false));
        }
    }, [visible]);

    const handleApply = () => {
        if (onApply) onApply({ selectedDifficulty, selectedDistance });
        onClose();
    };

    const handleClear = () => {
        setSelectedDifficulty('Any');
        setSelectedDistance('Any');
    };

    const FilterSection = ({ title, options, selected, onSelect }) => (
        <View style={styles.section}>
            <CustomText variant="h3" style={styles.sectionTitle}>
                {title}
            </CustomText>
            <View style={styles.chipContainer}>
                {options.map((opt) => {
                    const isActive = selected === opt;
                    return (
                        <TouchableOpacity 
                            key={opt}
                            onPress={() => onSelect(opt)}
                            style={[
                                styles.chip,
                                isActive && styles.activeChip
                            ]}
                            activeOpacity={0.7}
                        >
                            <CustomText style={[
                                styles.chipText,
                                isActive && styles.activeChipText
                            ]}>
                                {opt}
                            </CustomText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    if (!renderModal) return null;

    return (
        <Modal
            transparent={true}
            visible={renderModal}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                
                <Animated.View style={[styles.backdrop, { opacity: animValue }]}>
                    <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.modalContent,
                        {
                            transform: [
                                {
                                    translateY: animValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [SCREEN_HEIGHT, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <View style={styles.header}>
                        <CustomText variant="h2">Filters</CustomText>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <CustomIcon 
                                library="Feather" 
                                name="x" 
                                size={24} 
                                color={Colors.TEXT_PRIMARY} 
                            />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <FilterSection 
                            title="Difficulty" 
                            options={['Any', 'Beginner', 'Intermediate', 'Expert']}
                            selected={selectedDifficulty}
                            onSelect={setSelectedDifficulty}
                        />

                        <FilterSection 
                            title="Distance" 
                            options={['Any', '< 5 km', '5 - 10 km', '> 10 km']}
                            selected={selectedDistance}
                            onSelect={setSelectedDistance}
                        />
                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        <CustomButton 
                            title="Clear All" 
                            variant="outline" 
                            onPress={handleClear} 
                            style={styles.footerBtn}
                        />
                        <CustomButton 
                            title="Apply Filters" 
                            variant="primary" 
                            onPress={handleApply} 
                            style={styles.footerBtn}
                        />
                    </View>

                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdropTouch: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingTop: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    closeBtn: {
        padding: 4,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        gap: 24,
    },
    section: {
        width: '100%',
    },
    sectionTitle: {
        marginBottom: 12,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    activeChip: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.TEXT_SECONDARY,
    },
    activeChipText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        padding: 24,
        paddingBottom: 36, 
        backgroundColor: Colors.WHITE,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
        gap: 16,
    },
    footerBtn: {
        flex: 1,
    }
});

export default FilterModal;