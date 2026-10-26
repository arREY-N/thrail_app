import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ImageSourcePropType,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import ImageZoom, { ImageZoomProps } from 'react-native-image-pan-zoom';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const TypedImageZoom = ImageZoom as unknown as React.ComponentType<React.PropsWithChildren<ImageZoomProps>>;

/**
 * Props for the ImagePreviewModal component.
 */
interface ImagePreviewModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Single image URL to preview */
    imageUrl?: string;
    /** Array of image URLs or sources to preview (supports carousel navigation) */
    images?: (string | { uri: string } | ImageSourcePropType)[];
    /** Optional initial image index to display when opening the modal (defaults to 0) */
    initialIndex?: number;
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
    initialIndex = 0,
    onClose, 
    onDelete 
}) => {
    const insets = useSafeAreaInsets();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isImageLoading, setIsImageLoading] = useState(true);

    const imageList = images && images.length > 0 ? images : (imageUrl ? [imageUrl] : []);

    const [prevVisible, setPrevVisible] = useState(visible);
    if (visible !== prevVisible) {
        setPrevVisible(visible);
        if (visible) {
            const safeIndex = (
                typeof initialIndex === 'number' && initialIndex >= 0 && initialIndex < imageList.length
                    ? initialIndex
                    : 0
            );
            setCurrentIndex(safeIndex);
            setIsImageLoading(true);
        }
    }

    const handleNext = () => {
        if (currentIndex < imageList.length - 1) {
            setIsImageLoading(true);
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsImageLoading(true);
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
        return img as ImageSourcePropType; 
    };

    const currentImage = imageList[currentIndex];
    const memoizedSource = useMemo(() => getSource(currentImage), [currentImage]);

    const currentImageKey = useMemo(() => {
        if (!currentImage) return 'empty';
        if (typeof currentImage === 'string') return currentImage;
        if (typeof currentImage === 'number') return `asset-${currentImage}`;
        if (typeof currentImage === 'object' && currentImage !== null && 'uri' in currentImage) {
            return (currentImage as { uri: string }).uri;
        }
        return `img-${currentIndex}`;
    }, [currentImage, currentIndex]);

    const topOffset = Math.max(insets.top + 16, 24);

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
                        style={[styles.modalDeleteButton, { top: topOffset }]} 
                        onPress={handleDeleteClick}
                        activeOpacity={0.7}
                        accessibilityLabel="Delete image"
                        accessibilityRole="button"
                    >
                        <CustomIcon library="Feather" name="trash-2" size={18} color={Colors.ERROR} />
                    </TouchableOpacity>
                )}

                <TouchableOpacity 
                    style={[styles.modalCloseButton, { top: topOffset }]} 
                    onPress={onClose}
                    activeOpacity={0.7}
                    accessibilityLabel="Close image preview"
                    accessibilityRole="button"
                >
                    <CustomIcon library="Feather" name="x" size={20} color={Colors.WHITE} />
                </TouchableOpacity>

                {imageList.length > 1 && currentIndex > 0 && (
                    <TouchableOpacity 
                        style={[styles.navButton, styles.navLeft]} 
                        onPress={handlePrev}
                        activeOpacity={0.7}
                        accessibilityLabel="Previous image"
                        accessibilityRole="button"
                    >
                        <CustomIcon library="Feather" name="chevron-left" size={22} color={Colors.WHITE} />
                    </TouchableOpacity>
                )}
                
                {currentImage && (
                    <View style={styles.zoomWrapper}>
                        {isImageLoading && (
                            <ActivityIndicator 
                                size="large" 
                                color={Colors.WHITE} 
                                style={styles.loadingIndicator} 
                            />
                        )}
                        <TypedImageZoom 
                            cropWidth={windowWidth}
                            cropHeight={cropHeight}
                            imageWidth={windowWidth}
                            imageHeight={cropHeight}
                        >
                            <Image 
                                key={`preview-image-${currentIndex}-${currentImageKey}`}
                                source={memoizedSource ?? { uri: '' }} 
                                style={[
                                    styles.previewImage,
                                    { width: windowWidth, height: cropHeight, opacity: isImageLoading ? 0 : 1 }
                                ]} 
                                resizeMode="contain" 
                                onLoad={() => setIsImageLoading(false)}
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
                        accessibilityLabel="Next image"
                        accessibilityRole="button"
                    >
                        <CustomIcon library="Feather" name="chevron-right" size={22} color={Colors.WHITE} />
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
    loadingIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -18 }, { translateY: -18 }],
        zIndex: 10,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    modalCloseButton: {
        position: 'absolute',
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.IMAGE_PREVIEW_BUTTON_BG,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    modalDeleteButton: {
        position: 'absolute',
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.IMAGE_PREVIEW_BUTTON_BG,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    navButton: {
        position: 'absolute',
        top: '50%',
        transform: [{ translateY: -20 }],
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.IMAGE_PREVIEW_BUTTON_BG,
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
        backgroundColor: Colors.IMAGE_PREVIEW_COUNTER_BG,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 16,
        zIndex: 10,
    },
    counterText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default ImagePreviewModal;
