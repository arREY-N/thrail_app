import React, { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Image, ImageSourcePropType, Modal, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';

const TypedImageZoom = ImageZoom as unknown as React.FC<any>;

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

/**
 * Props for the ImagePreviewModal component.
 */
interface ImagePreviewModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Single image URL to preview */
    imageUrl?: string;
    /** Array of image URLs to preview (supports carousel navigation) */
    images?: (string | { uri: string })[];
    /** Callback fired when the modal is closed */
    onClose: () => void;
    /** Callback fired when the delete button is pressed */
    onDelete?: (index: number) => void;
}

/**
 * ImagePreviewModal — A full-screen modal component that allows users to 
 * view, pan, and zoom images. Supports single images or an array of images.
 */
const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ 
    visible, 
    imageUrl, 
    images, 
    onClose, 
    onDelete 
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isImageLoading, setIsImageLoading] = useState(true);

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

    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const cropHeight = windowHeight * 0.8;

    const getSource = (img: unknown): ImageSourcePropType | null => {
        if (!img) return null;
        if (typeof img === 'string') return { uri: img };
        if (typeof img === 'number') return img;
        return img; 
    };

    const currentImage = imageList[currentIndex];
    const memoizedSource = useMemo(() => getSource(currentImage), [currentImage]);

    useEffect(() => {
        setIsImageLoading(true);
    }, [memoizedSource]);

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
                
                {currentImage && (
                    <View style={styles.zoomWrapper}>
                        {isImageLoading && (
                            <ActivityIndicator 
                                size="large" 
                                color={Colors.WHITE} 
                                style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -18 }, { translateY: -18 }], zIndex: 10 }} 
                            />
                        )}
                        <TypedImageZoom 
                            cropWidth={windowWidth}
                            cropHeight={cropHeight}
                            imageWidth={windowWidth}
                            imageHeight={cropHeight}
                        >
                            <Image 
                                source={memoizedSource as any} 
                                style={{ width: windowWidth, height: cropHeight, opacity: isImageLoading ? 0 : 1 }} 
                                resizeMode="contain" 
                                onLoadEnd={() => setIsImageLoading(false)}
                                onError={() => setIsImageLoading(false)}
                            />
                        </TypedImageZoom>
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
        backgroundColor: Colors.MODAL_OVERLAY,
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
        backgroundColor: `${Colors.BLACK}99`,
        borderRadius: 24,
    },
    modalDeleteButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 10,
        backgroundColor: `${Colors.BLACK}99`,
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
        backgroundColor: `${Colors.BLACK}99`, 
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
        backgroundColor: `${Colors.BLACK}99`,
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
