import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const PROVINCES = ['Rizal', 'Batangas', 'Laguna', 'Cavite', 'Quezon'];
const ELEVATIONS = ['< 500 masl', '500 - 1000 masl', '> 1000 masl'];

const DEFAULT_FILTERS = {
    provinces: [],
    elevation: null
};

const FilterModal = ({ visible, onClose, onApply, initialFilters = DEFAULT_FILTERS }) => {
    const insets = useSafeAreaInsets();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const [selectedProvinces, setSelectedProvinces] = useState(initialFilters.provinces || []);
    const [selectedElevation, setSelectedElevation] = useState(initialFilters.elevation || null);

    const [renderModal, setRenderModal] = useState(visible);
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setRenderModal(true);
            setSelectedProvinces(initialFilters.provinces || []);
            setSelectedElevation(initialFilters.elevation || null);
            
            Animated.timing(animValue, {
                toValue: 1,
                duration: 300,
                useNativeDriver: Platform.OS !== 'web',
            }).start();
        } else {
            Animated.timing(animValue, {
                toValue: 0,
                duration: 250,
                useNativeDriver: Platform.OS !== 'web',
            }).start(() => setRenderModal(false));
        }
    }, [visible, initialFilters, animValue]);

    const handleReset = () => {
        setSelectedProvinces([]);
        setSelectedElevation(null);
    };

    const handleApply = () => {
        onApply({
            provinces: selectedProvinces,
            elevation: selectedElevation,
        });
        onClose();
    };

    const toggleProvince = (prov) => {
        setSelectedProvinces(prev => 
            prev.includes(prov) ? prev.filter(p => p !== prov) : [...prev, prov]
        );
    };

    const FilterSection = ({ title, options, selected, onSelect, multiSelect = false }) => (
        <View style={styles.sectionContainer}>
            <CustomText variant="h3" style={styles.sectionTitle}>{title}</CustomText>
            <View style={styles.pillGrid}>
                {options.map((option) => {
                    const isSelected = multiSelect ? selected.includes(option) : selected === option;
                    return (
                        <TouchableOpacity
                            key={option}
                            style={[styles.pill, isSelected && styles.pillActive]}
                            onPress={() => onSelect(option)}
                            activeOpacity={0.7}
                        >
                            <CustomText 
                                style={[styles.pillText, isSelected && styles.pillTextActive]}
                            >
                                {option}
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
                        isWideScreen ? styles.modalContentDesktop : styles.modalContentMobile,
                        { paddingBottom: isWideScreen ? 24 : Math.max(insets.bottom + 24, 24) },
                        {
                            transform: [
                                {
                                    translateY: animValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: isWideScreen ? [50, 0] : [SCREEN_HEIGHT, 0],
                                    }),
                                },
                            ],
                            opacity: isWideScreen ? animValue : 1,
                        }
                    ]}
                >
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
                            <CustomText style={styles.resetText}>Reset</CustomText>
                        </TouchableOpacity>
                        
                        <CustomText variant="h2" style={styles.headerTitle}>Filters</CustomText>
                        
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
                            <CustomIcon library="Feather" name="x" size={24} color={Colors.TEXT_PRIMARY} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    <ScrollView 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollBody}
                    >
                        <FilterSection 
                            title="Province" 
                            options={PROVINCES} 
                            selected={selectedProvinces} 
                            onSelect={toggleProvince} 
                            multiSelect={true}
                        />

                        <FilterSection 
                            title="Elevation Range" 
                            options={ELEVATIONS} 
                            selected={selectedElevation} 
                            onSelect={(val) => setSelectedElevation(prev => prev === val ? null : val)} 
                        />
                    </ScrollView>

                    <View style={styles.footer}>
                        <CustomButton 
                            title="Apply Filters" 
                            onPress={handleApply} 
                            style={styles.applyBtn} 
                        />
                    </View>

                </Animated.View>
            </View>
        </Modal>
    );
};

const dropShadow = Platform.select({
    ios: {
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    android: {
        elevation: 10,
    },
    web: {
        boxShadow: '0px -4px 20px rgba(0, 0, 0, 0.08)',
    }
});

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end', 
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    backdropTouch: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: Colors.WHITE,
        width: '100%',
        maxHeight: '85%',
        ...dropShadow,
    },
    modalContentMobile: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    modalContentDesktop: {
        alignSelf: 'center',
        marginBottom: 'auto',
        marginTop: 'auto',
        width: 500,
        borderRadius: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    resetText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 18,
        marginBottom: 0,
    },
    closeBtn: {
        padding: 4,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 16,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        width: '100%',
    },
    scrollBody: {
        padding: 24,
        gap: 32,
    },
    sectionContainer: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 16,
        marginBottom: 4,
        color: Colors.TEXT_PRIMARY,
    },
    pillGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    pill: {
        backgroundColor: Colors.BACKGROUND,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Colors.GRAY_LIGHT,
    },
    pillActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    pillText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
        fontSize: 14,
    },
    pillTextActive: {
        color: Colors.WHITE,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    applyBtn: {
        width: '100%',
        borderRadius: 16,
    }
});

export default FilterModal;