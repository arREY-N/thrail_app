import { useWindowDimensions } from 'react-native';

/**
 * Interface defining the returned breakpoints state.
 */
export interface Breakpoints {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isLargeScreen: boolean;
    width: number;
}

/**
 * Hook to retrieve screen width and active breakpoint booleans.
 * 
 * @returns {Breakpoints} An object containing boolean flags for current screen size
 */
export const useBreakpoints = (): Breakpoints => {
    const { width, height } = useWindowDimensions();

    const isMobile  = width < 768;
    const isTablet  = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    const isLargeScreen = width >= 1024 && height >= 600;

    return {
        isMobile,
        isTablet,
        isDesktop,
        isLargeScreen,
        width,
    };
};
