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

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SelectionOption {
    id?: string | number;
    value?: string | number;
    label: string;
    subLabel?: string;
}

/**
 * A generic bottom-sheet style modal for selecting from a list of options.
 */
interface CustomSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    options?: SelectionOption[];
    selectedValue?: string | number | null;
    onSelect: (option: SelectionOption) => void;
}

const CustomSelectionModal: React.FC<CustomSelectionModalProps> = ({ 
    visible, 
    onClose, 
    title = "Select Option", 
    options = [], 
    selectedValue, 
    onSelect 
}) => {
    const insets = useSafeAreaInsets();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const [renderModal, setRenderModal] = useState<boolean>(visible);
    if (visible && !renderModal) {
        setRenderModal(true);
    }
    const [animValue] = useState(() => new Animated.Value(0));

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
            }).start(() => setRenderModal(false));
        }
    }, [visible, animValue]);

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
                    <View style={styles.modalHeader}>
                        <CustomText variant="h3">{title}</CustomText>
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
                            <CustomIcon library="Feather" name="x" size={24} color={Colors.TEXT_PRIMARY} />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
                        {options.length > 0 ? options.map((option: SelectionOption) => {
                            const optionKey = option.value !== undefined ? option.value : option.id;
                            const isSelected = selectedValue === optionKey;
                            
                            return (
                                <TouchableOpacity 
                                    key={optionKey}
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
        ...StyleSheet.absoluteFill,
        backgroundColor: Colors.MODAL_OVERLAY,
    },
    backdropTouch: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: Colors.WHITE,
        width: '100%',
        maxHeight: '85%',
        ...GlobalStyles.dropShadow(10, 0.08, Colors.SHADOW, {
            offset: { width: 0, height: -4 },
            radius: 20
        }),
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
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    closeBtn: {
        padding: 4,
    },
    scrollArea: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    modalOptionSelected: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderColor: Colors.PRIMARY,
        borderRadius: 12,
        borderBottomWidth: 0,
        paddingHorizontal: 16, 
        marginVertical: 4,
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

export default CustomSelectionModal;
