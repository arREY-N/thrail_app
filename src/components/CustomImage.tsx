import React, { useEffect, useState } from 'react';
import { Image, ImageProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import { Colors } from '@/src/constants/colors';

/**
 * Props for the CustomImage component.
 * @param {StyleProp<ViewStyle>} [containerStyle] - Optional custom styling for the outer container.
 */
export interface CustomImageProps extends ImageProps {
    containerStyle?: StyleProp<ViewStyle>;
}

/**
 * CustomImage
 * A wrapper around React Native's Image component that displays a solid gray 
 * background while the image is loading, preventing messy progressive rendering.
 * @param {CustomImageProps} props - The props for the component.
 */
const CustomImage: React.FC<CustomImageProps> = ({ 
    style, 
    containerStyle, 
    onLoadStart, 
    onLoadEnd, 
    source,
    ...props 
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const sourceUri = typeof source === 'object' && source !== null && 'uri' in source 
        ? (source as any).uri 
        : source;

    useEffect(() => {
        setIsLoaded(false);
        setHasError(false);
    }, [sourceUri]);

    const flatStyle = StyleSheet.flatten(style) || {};
    const { backgroundColor, ...layoutStyle } = flatStyle;

    return (
        <View style={[styles.container, layoutStyle as StyleProp<ViewStyle>, containerStyle]}>
            {!isLoaded && !hasError && (
                <View 
                    style={[
                        StyleSheet.absoluteFillObject, 
                        { backgroundColor: backgroundColor || Colors.GRAY_ULTRALIGHT }
                    ]} 
                />
            )}

            {hasError && (
                <View style={styles.errorContainer}>
                    <CustomIcon library="Ionicons" name="image" size={32} color={Colors.GRAY} />
                </View>
            )}
            <Image
                source={source}
                {...props}
                style={[
                    layoutStyle, 
                    { 
                        opacity: isLoaded ? 1 : 0,
                        width: '100%', 
                        height: '100%',
                        margin: 0,
                        marginVertical: 0,
                        marginHorizontal: 0,
                        marginTop: 0,
                        marginBottom: 0,
                        marginLeft: 0,
                        marginRight: 0,
                    }
                ]}
                onLoadStart={() => {
                    if (onLoadStart) (onLoadStart as any)();
                }}
                onLoad={(e) => {
                    setIsLoaded(true);
                    if (props.onLoad) props.onLoad(e);
                }}
                onLoadEnd={() => {
                    setIsLoaded(true);
                    if (onLoadEnd) (onLoadEnd as any)();
                }}
                onError={(e) => {
                    setHasError(true);
                    setIsLoaded(true);
                    if (props.onError) props.onError(e);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    }
});

export default CustomImage;
