/**
 * @file useScrollFades.ts
 * @description Reusable React hook to manage measurements and visibility flags for left/right scroll fade overlays.
 */

import { useState } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/**
 * Hook to manage scroll position and dimensions, determining if left/right fade overlays should be shown.
 * 
 * @returns An object containing:
 * - `showLeftFade`: Whether content has scrolled right enough to require a left fade overlay.
 * - `showRightFade`: Whether there is more content to the right to require a right fade overlay.
 * - `scrollProps`: Props to spread onto the ScrollView (`onScroll`, `onLayout`, `onContentSizeChange`, `scrollEventThrottle`).
 */
export function useScrollFades() {
    const [contentWidth, setContentWidth] = useState(0);
    const [layoutWidth, setLayoutWidth] = useState(0);
    const [scrollX, setScrollX] = useState(0);

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        setScrollX(e.nativeEvent.contentOffset.x);
    };

    const onContentSizeChange = (width: number) => {
        setContentWidth(width);
    };

    const onLayout = (e: LayoutChangeEvent) => {
        setLayoutWidth(e.nativeEvent.layout.width);
    };

    const showLeftFade = scrollX > 5;
    const showRightFade = scrollX < contentWidth - layoutWidth - 5 && contentWidth > layoutWidth;

    return {
        showLeftFade,
        showRightFade,
        contentWidth,
        layoutWidth,
        scrollX,
        scrollProps: {
            scrollEventThrottle: 16 as const,
            onScroll,
            onContentSizeChange,
            onLayout,
        }
    };
}
