/**
 * @file SplashScreenView.tsx
 * @description Canonical splash screen component for Thrail.
 * Displays the Forest Green background, centered white Logo Idea 2 glyph,
 * and official typography ("THRAIL" + "FIND THRILL IN YOUR TRAIL").
 * Reused across Web cold launch, fallback transitions, and animated overlays.
 */

import React from 'react';
import {
    Image,
    StatusBar,
    StyleProp,
    StyleSheet,
    useWindowDimensions,
    View,
    ViewStyle,
} from 'react-native';

import CustomText from '@/src/components/CustomText';
import { BRAND } from '@/src/constants/branding';

export interface SplashScreenViewProps {
    /** Optional custom background color (defaults to BRAND.SPLASH_BG) */
    backgroundColor?: string;

    /** Optional custom logo scale in pixels (defaults to responsive calculation up to BRAND.SPLASH_GLYPH_SIZE) */
    glyphSize?: number;

    /** Whether to show the THRAIL wordmark and slogan (defaults to true) */
    showTypography?: boolean;

    /** Optional container style overrides */
    style?: StyleProp<ViewStyle>;

    /** Optional test identifier */
    testID?: string;
}

const SplashScreenView: React.FC<SplashScreenViewProps> = ({
    backgroundColor = BRAND.SPLASH_BG,
    glyphSize,
    showTypography = true,
    style,
    testID,
}) => {
    const { width: screenWidth } = useWindowDimensions();
    const effectiveGlyphSize = glyphSize ?? Math.min(BRAND.SPLASH_GLYPH_SIZE, Math.max(100, Math.round(screenWidth * 0.34)));
    const [isImageReady, setIsImageReady] = React.useState(false);

    React.useEffect(() => {
        // Safety timeout so content is guaranteed visible even if image decode is delayed
        const timer = setTimeout(() => {
            setIsImageReady(true);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View
            testID={testID}
            style={[
                styles.container,
                { backgroundColor },
                style,
            ]}
        >
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
            />

            <View style={[styles.content, { opacity: isImageReady ? 1 : 0 }]}>
                {/* Centered Logo Glyph */}
                <View style={[styles.glyphWrapper, { width: effectiveGlyphSize, height: effectiveGlyphSize }]}>
                    <Image
                        source={BRAND.ASSETS.GLYPH_WHITE}
                        style={styles.fullImage}
                        resizeMode="contain"
                        fadeDuration={0}
                        onLoad={() => setIsImageReady(true)}
                    />
                </View>

                {/* Brand Typography */}
                {showTypography && (
                    <View style={styles.typographyGroup}>
                        <CustomText
                            variant="h1"
                            style={styles.brandTitle}
                        >
                            {BRAND.NAME}
                        </CustomText>
                        <CustomText
                            variant="caption"
                            style={styles.brandSlogan}
                        >
                            {BRAND.SLOGAN.toUpperCase()}
                        </CustomText>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glyphWrapper: {
        marginBottom: 16,
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    typographyGroup: {
        alignItems: 'center',
    },
    brandTitle: {
        color: BRAND.TEXT_INVERSE,
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 4,
        textAlign: 'center',
    },
    brandSlogan: {
        color: BRAND.TEXT_INVERSE_SUBTLE,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
        marginTop: 6,
        textAlign: 'center',
    },
});

export default SplashScreenView;
