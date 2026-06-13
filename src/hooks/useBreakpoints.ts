import { useWindowDimensions } from 'react-native';

/**
 * Interface defining the returned breakpoints state.
 */
export interface Breakpoints {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    width: number;
}

/**
 * Hook to retrieve screen width and active breakpoint booleans.
 * 
 * @returns {Breakpoints} An object containing boolean flags for current screen size
 */
export const useBreakpoints = (): Breakpoints => {
    const { width } = useWindowDimensions();

    const isMobile  = width < 768;
    const isTablet  = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;

    return {
        isMobile,
        isTablet,
        isDesktop,
        width,
    };
};
