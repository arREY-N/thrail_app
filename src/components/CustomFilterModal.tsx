import React, { useEffect, useState } from 'react';
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
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FilterOption {
    label: string;
    value: string;
}

interface FilterSection {
    id: string;
    title: string;
    type: 'radio' | 'pill';
    multiSelect?: boolean;
    options: FilterOption[];
}

interface CustomFilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (values: Record<string, any>) => void;
    title?: string;
    sections?: FilterSection[];
    initialValues?: Record<string, any>;
    defaultValues?: Record<string, any>;
}

/**
 * Universal Data-Driven Filter Modal
 */
const CustomFilterModal: React.FC<CustomFilterModalProps> = ({ 
    visible, 
    onClose, 
    onApply, 
    title = "Sort & Filter",
    sections = [],
    initialValues = {},
    defaultValues = {} 
}) => {
    const insets = useSafeAreaInsets();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const [renderModal, setRenderModal] = useState<boolean>(visible);
    const [localValues, setLocalValues] = useState<Record<string, any>>(initialValues);
    const [animValue] = useState(() => new Animated.Value(0));

    const currentVisibleKey = visible ? `open_${JSON.stringify(initialValues)}` : 'closed';
    const [prevVisibleKey, setPrevVisibleKey] = useState(currentVisibleKey);
    if (currentVisibleKey !== prevVisibleKey) {
        setPrevVisibleKey(currentVisibleKey);
        if (visible) {
            setRenderModal(true);
            setLocalValues(initialValues);
        }
    }

    useEffect(() => {
        if (visible) {
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
            }).start(({ finished }) => {
                if (finished) setRenderModal(false);
            });
        }
    }, [visible, animValue]);

    const handleReset = () => setLocalValues(defaultValues);
    
    const handleApply = () => {
        onApply(localValues);
        onClose();
    };

    const toggleValue = (sectionId: string, value: string, isMulti?: boolean): void => {
        setLocalValues(prev => {
            if (!isMulti) {
                return { 
                    ...prev, 
                    [sectionId]: prev[sectionId] === value ? null : value 
                };
            }
            
            const currentArray = prev[sectionId] || [];
            
            if (currentArray.includes(value)) {
                return { 
                    ...prev, 
                    [sectionId]: currentArray.filter((v: string) => v !== value) 
                };
            }
            
            return { 
                ...prev, 
                [sectionId]: [...currentArray, value] 
            };
        });
    };

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
                    <TouchableOpacity 
                        style={styles.backdropTouch} 
                        activeOpacity={1} 
                        onPress={onClose} 
                    />
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
                                    })
                                }
                            ],
                            opacity: isWideScreen ? animValue : 1,
                        }
                    ]}
                >
                    <View style={styles.header}>
                        <TouchableOpacity 
                            onPress={handleReset} 
                            activeOpacity={0.7} 
                            style={styles.headerSide}
                        >
                            <CustomText style={styles.resetText}>
                                Reset
                            </CustomText>
                        </TouchableOpacity>
                        
                        <CustomText variant="h2" style={styles.headerTitle}>
                            {title}
                        </CustomText>
                        
                        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
                            <TouchableOpacity 
                                onPress={onClose} 
                                activeOpacity={0.7} 
                                style={styles.closeBtn}
                            >
                                <CustomIcon 
                                    library="Feather" 
                                    name="x" 
                                    size={24} 
                                    color={Colors.TEXT_PRIMARY} 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <ScrollView 
                        showsVerticalScrollIndicator={false} 
                        contentContainerStyle={styles.scrollBody}
                    >
                        {sections.map((section: FilterSection, index: number) => {
                            const isMulti = section.multiSelect;
                            const currentValue = localValues[section.id];
                            
                            return (
                                <View key={section.id}>
                                    <CustomText variant="caption" style={styles.sectionHeader}>
                                        {section.title}
                                    </CustomText>
                                    
                                    {section.type === 'radio' && (
                                        <View style={styles.radioGroup}>
                                            {section.options.map(opt => {
                                                const isSelected = currentValue === opt.value;
                                                return (
                                                    <TouchableOpacity 
                                                        key={opt.value} 
                                                        style={styles.radioRow} 
                                                        onPress={() => toggleValue(section.id, opt.value, false)}
                                                    >
                                                        <CustomText 
                                                            variant="body" 
                                                            style={[
                                                                styles.radioText, 
                                                                isSelected && styles.radioTextActive
                                                            ]}
                                                        >
                                                            {opt.label}
                                                        </CustomText>
                                                        
                                                        <View style={styles.radioOuter}>
                                                            {isSelected && (
                                                                <View style={styles.radioInner} />
                                                            )}
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    )}

                                    {section.type === 'pill' && (
                                        <View style={styles.pillGrid}>
                                            {section.options.map(opt => {
                                                const isSelected = isMulti 
                                                    ? (currentValue || []).includes(opt.value)
                                                    : currentValue === opt.value;
                                                return (
                                                    <TouchableOpacity
                                                        key={opt.value}
                                                        style={[
                                                            styles.pill, 
                                                            isSelected && styles.pillActive
                                                        ]}
                                                        onPress={() => toggleValue(section.id, opt.value, isMulti)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <CustomText 
                                                            style={[
                                                                styles.pillText, 
                                                                isSelected && styles.pillTextActive
                                                            ]}
                                                        >
                                                            {opt.label}
                                                        </CustomText>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    )}

                                    {index < sections.length - 1 && (
                                        <View style={styles.sectionDivider} />
                                    )}
                                </View>
                            );
                        })}
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

const styles = StyleSheet.create({
    modalContainer: { 
        flex: 1, 
        justifyContent: 'flex-end' 
    },
    backdrop: { 
        ...StyleSheet.absoluteFill, 
        backgroundColor: 'rgba(0, 0, 0, 0.4)' 
    },
    backdropTouch: { 
        flex: 1 
    },
    modalContent: { 
        backgroundColor: Colors.WHITE, 
        width: '100%', 
        maxHeight: '85%', 
        ...GlobalStyles.dropShadow(3)
    },
    modalContentMobile: { 
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24 
    },
    modalContentDesktop: { 
        alignSelf: 'center', 
        marginBottom: 'auto', 
        marginTop: 'auto', 
        width: 500, 
        borderRadius: 24 
    },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingTop: 20, 
        paddingBottom: 16 
    },
    headerSide: { 
        flex: 1 
    },
    resetText: { 
        color: Colors.TEXT_SECONDARY, 
        fontSize: 16, 
        fontWeight: '600' 
    },
    headerTitle: { 
        fontSize: 18, 
        marginBottom: 0, 
        textAlign: 'center' 
    },
    closeBtn: { 
        padding: 4, 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        borderRadius: 16 
    },
    divider: { 
        height: 1, 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        width: '100%' 
    },
    scrollBody: { 
        padding: 24 
    },
    sectionHeader: { 
        color: Colors.TEXT_SECONDARY, 
        letterSpacing: 1, 
        fontWeight: 'bold', 
        marginBottom: 12, 
        textTransform: 'uppercase' 
    },
    radioGroup: { 
        gap: 4 
    },
    radioRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingVertical: 12 
    },
    radioText: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: '500' 
    },
    radioTextActive: { 
        color: Colors.PRIMARY, 
        fontWeight: 'bold' 
    },
    radioOuter: { 
        width: 20, 
        height: 20, 
        borderRadius: 10, 
        borderWidth: 2, 
        borderColor: Colors.GRAY_LIGHT, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    radioInner: { 
        width: 10, 
        height: 10, 
        borderRadius: 5, 
        backgroundColor: Colors.PRIMARY 
    },
    pillGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: 10 
    },
    pill: { 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        paddingVertical: 10, 
        paddingHorizontal: 16, 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT 
    },
    pillActive: { 
        backgroundColor: Colors.STATUS_APPROVED_BG, 
        borderColor: Colors.PRIMARY 
    },
    pillText: { 
        color: Colors.TEXT_SECONDARY, 
        fontWeight: '600', 
        fontSize: 13 
    },
    pillTextActive: { 
        color: Colors.PRIMARY, 
        fontWeight: 'bold' 
    },
    sectionDivider: { 
        height: 1, 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        marginVertical: 20 
    },
    footer: { 
        paddingHorizontal: 24, 
        paddingTop: 16 
    },
    applyBtn: { 
        width: '100%', 
        borderRadius: 16 
    }
});

export default CustomFilterModal;