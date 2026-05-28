import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';

const AdminRefundModal = ({ visible, onClose, onSelect, amountPaid = 0 }) => {
    const fullRefundAmount = amountPaid;
    const partialRefundAmount = amountPaid * 0.10;

    return (
        <Modal 
            transparent={true} 
            visible={visible} 
            animationType="fade" 
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={styles.overlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <View style={styles.bottomSheetWrapper}>
                    <TouchableOpacity activeOpacity={1} style={styles.bottomSheet}>
                        <View style={styles.headerRow}>
                            <CustomText variant="h2" style={styles.title}>
                                Select Refund Amount
                            </CustomText>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <CustomIcon library="Feather" name="x" size={24} color={Colors.TEXT_SECONDARY} />
                            </TouchableOpacity>
                        </View>

                        <CustomText variant="caption" style={styles.subtitle}>
                            Please choose the appropriate refund policy to apply to this cancellation.
                        </CustomText>

                        <TouchableOpacity 
                            style={styles.optionCard} 
                            onPress={() => onSelect('full')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconWrapper, { backgroundColor: Colors.STATUS_APPROVED_BG }]}>
                                <CustomIcon library="Feather" name="refresh-ccw" size={20} color={Colors.STATUS_APPROVED_TEXT} />
                            </View>
                            
                            <View style={styles.optionContent}>
                                <CustomText variant="body" style={styles.optionLabel}>
                                    Full Refund (100%)
                                </CustomText>
                                <CustomText variant="caption" style={styles.optionSubLabel}>
                                    Return the entire amount paid.
                                </CustomText>
                            </View>
                            
                            <CustomText variant="h3" style={styles.amountText}>
                                ₱{fullRefundAmount.toFixed(2)}
                            </CustomText>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.optionCard} 
                            onPress={() => onSelect('partial')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconWrapper, { backgroundColor: Colors.STATUS_WARNING_BG }]}>
                                <CustomIcon library="Feather" name="pie-chart" size={20} color={Colors.STATUS_WARNING_TEXT} />
                            </View>

                            <View style={styles.optionContent}>
                                <CustomText variant="body" style={styles.optionLabel}>
                                    Partial Refund (10%)
                                </CustomText>
                                <CustomText variant="caption" style={styles.optionSubLabel}>
                                    Standard cancellation policy.
                                </CustomText>
                            </View>
                            
                            <CustomText variant="h3" style={styles.amountText}>
                                ₱{partialRefundAmount.toFixed(2)}
                            </CustomText>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: Colors.MODAL_OVERLAY,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    bottomSheetWrapper: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
    },
    bottomSheet: {
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        width: '100%',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        color: Colors.TEXT_PRIMARY,
    },
    subtitle: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 24,
    },
    closeBtn: {
        padding: 4,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: Colors.GRAY_LIGHT,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    iconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionContent: {
        flex: 1,
        paddingRight: 8,
    },
    optionLabel: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4,
    },
    optionSubLabel: {
        color: Colors.TEXT_SECONDARY,
    },
    amountText: {
        color: Colors.ERROR,
        fontWeight: '700',
    }
});

export default AdminRefundModal;