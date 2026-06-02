import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ImagePreviewModal = ({ visible, imageUrl, images, onClose, onDelete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const imageList = images && images.length > 0 ? images : (imageUrl ? [imageUrl] : []);

    useEffect(() => {
        if (visible) {
            setCurrentIndex(0);
        }
    }, [visible]);

    const handleNext = () => {
        if (currentIndex < imageList.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleDeleteClick = () => {
        if (onDelete) {
            const newLength = imageList.length - 1;
            if (newLength === 0) {
                onClose();
            } else if (currentIndex >= newLength) {
                setCurrentIndex(newLength - 1);
            }
            onDelete(currentIndex);
        }
    };

    const getSource = (img) => {
        if (!img) return null;
        if (typeof img === 'string') return { uri: img };
        return img; 
    };

    const currentImage = imageList[currentIndex];

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                
                {onDelete && imageList.length > 0 && (
                    <TouchableOpacity 
                        style={styles.modalDeleteButton} 
                        onPress={handleDeleteClick}
                        activeOpacity={0.7}
                    >
                        <CustomIcon library="Feather" name="trash-2" size={26} color={Colors.ERROR} />
                    </TouchableOpacity>
                )}

                <TouchableOpacity 
                    style={styles.modalCloseButton} 
                    onPress={onClose}
                    activeOpacity={0.7}
                >
                    <CustomIcon library="Feather" name="x" size={30} color={Colors.WHITE} />
                </TouchableOpacity>

                {imageList.length > 1 && currentIndex > 0 && (
                    <TouchableOpacity 
                        style={[styles.navButton, styles.navLeft]} 
                        onPress={handlePrev}
                        activeOpacity={0.7}
                    >
                        <CustomIcon library="Feather" name="chevron-left" size={36} color={Colors.WHITE} />
                    </TouchableOpacity>
                )}
                
                {/* THE MAGIC HAPPENS HERE
                  We maintain your exact 80% height layout using Dimensions 
                */}
                {currentImage && (
                    <View style={styles.zoomWrapper}>
                        <ImageZoom 
                            cropWidth={SCREEN_WIDTH}
                            cropHeight={SCREEN_HEIGHT * 0.8}
                            imageWidth={SCREEN_WIDTH}
                            imageHeight={SCREEN_HEIGHT * 0.8}
                        >
                            <Image 
                                source={getSource(currentImage)} 
                                style={styles.modalImage} 
                                resizeMode="contain" 
                            />
                        </ImageZoom>
                    </View>
                )}

                {imageList.length > 1 && currentIndex < imageList.length - 1 && (
                    <TouchableOpacity 
                        style={[styles.navButton, styles.navRight]} 
                        onPress={handleNext}
                        activeOpacity={0.7}
                    >
                        <CustomIcon library="Feather" name="chevron-right" size={36} color={Colors.WHITE} />
                    </TouchableOpacity>
                )}

                {imageList.length > 1 && (
                    <View style={styles.counterBadge}>
                        <CustomText style={styles.counterText}>
                            {currentIndex + 1} / {imageList.length}
                        </CustomText>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    zoomWrapper: {
        width: '100%',
        height: '80%',
        zIndex: 1,
    },
    modalCloseButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 24,
    },
    modalDeleteButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 24,
    },
    modalImage: {
        width: '100%',
        height: '100%',
    },
    navButton: {
        position: 'absolute',
        top: '50%',
        transform: [{ translateY: -24 }],
        width: 48,
        height: 48,
        borderRadius: 24, 
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', 
        zIndex: 10,
    },
    navLeft: {
        left: 16,
    },
    navRight: {
        right: 16,
    },
    counterBadge: {
        position: 'absolute',
        bottom: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 16,
        zIndex: 10,
    },
    counterText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default ImagePreviewModal;