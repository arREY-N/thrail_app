import React from 'react';
import { Image, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import { Colors } from '@/src/constants/colors';

const ImagePreviewModal = ({ visible, imageUrl, onClose }) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity 
                    style={styles.modalCloseButton} 
                    onPress={onClose}
                    activeOpacity={0.7}
                >
                    <CustomIcon library="Feather" name="x" size={32} color={Colors.WHITE} />
                </TouchableOpacity>
                
                {imageUrl && (
                    <Image 
                        source={{ uri: imageUrl }} 
                        style={styles.modalImage} 
                        resizeMode="contain" 
                    />
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 24,
    },
    modalImage: {
        width: '100%',
        height: '80%',
    }
});

export default ImagePreviewModal;