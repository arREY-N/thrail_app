/**
 * @file useNavigationTutorial.ts
 * @description Custom hook encapsulating tutorial tour state, element measurement refs,
 * registration callbacks, and layout handlers for the Navigation lobby screen.
 * Sequences the native device location permission dialog first, ensuring the tutorial
 * guide only mounts once device permissions have settled.
 */

import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, View } from 'react-native';

import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    type TutorialTourId,
    useTutorialGuide,
} from '@/src/components/Tutorial/Tutorial';
import {
    getNavigationDiyTourSteps,
    navigationBookedTourSteps,
} from '@/src/components/Tutorial/constants/navigationTour';
import { Booking } from '@/src/core/models/Booking/Booking';
import { Trail } from '@/src/core/models/Trail/Trail';

interface UseNavigationTutorialParams {
    upcomingBookings: Booking[];
    activeBooking?: Booking | null;
    selectedTrail: Trail | null;
    isLoading: boolean;
    isFullscreen?: boolean;
}

/**
 * Hook to manage navigation tutorial walkthrough lifecycle, measurement callbacks, and target refs.
 *
 * @param params - Configuration parameters containing upcoming bookings, active booking, selected trail, and loading status
 * @returns Tutorial state, target element refs, and onLayout event handlers
 */
export const useNavigationTutorial = ({
    upcomingBookings,
    activeBooking,
    selectedTrail,
    isLoading,
    isFullscreen = false,
}: UseNavigationTutorialParams) => {
    const activeTourId: TutorialTourId =
        activeBooking && !selectedTrail
            ? 'navigation_booked'
            : 'navigation_diy';

    // Gate tutorial launch until native location permission prompt is resolved
    const [isPermissionSettled, setIsPermissionSettled] = useState<boolean>(
        Platform.OS === 'web'
    );

    useEffect(() => {
        if (Platform.OS === 'web') return;

        let isMounted = true;
        let settleTimer: ReturnType<typeof setTimeout> | null = null;

        const markSettledWithDelay = () => {
            if (settleTimer) clearTimeout(settleTimer);
            settleTimer = setTimeout(() => {
                if (isMounted) {
                    setIsPermissionSettled(true);
                }
            }, 400);
        };

        const checkPermissionStatus = async () => {
            try {
                const { status } = await Location.getForegroundPermissionsAsync();
                if (status === 'granted' || status === 'denied') {
                    if (isMounted) {
                        setIsPermissionSettled(true);
                    }
                }
            } catch {
                if (isMounted) {
                    setIsPermissionSettled(true);
                }
            }
        };

        checkPermissionStatus();

        // Listen for AppState changes when the native OS permission modal closes
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                markSettledWithDelay();
            }
        });

        // Safety fallback timer so the tutorial is never indefinitely stalled
        const fallbackTimer = setTimeout(() => {
            if (isMounted) {
                setIsPermissionSettled(true);
            }
        }, 3500);

        return () => {
            isMounted = false;
            if (settleTimer) clearTimeout(settleTimer);
            clearTimeout(fallbackTimer);
            subscription.remove();
        };
    }, []);

    const hasBookings = upcomingBookings.length > 0;
    const dynamicSteps = useMemo(() => {
        if (activeTourId === 'navigation_booked') {
            return navigationBookedTourSteps;
        }
        return getNavigationDiyTourSteps(hasBookings);
    }, [activeTourId, hasBookings]);

    const isReady = Platform.OS !== 'web' && !isLoading && isPermissionSettled && !isFullscreen;
    const tutorial = useTutorialGuide(activeTourId, isReady, dynamicSteps);

    const searchBarRef = useRef<View>(null);
    const bookedCardRef = useRef<View>(null);
    const diyCardRef = useRef<View>(null);
    const fullscreenBtnRef = useRef<View>(null);
    const ticketBtnRef = useRef<View>(null);
    const cardChatBtnRef = useRef<View>(null);
    const columnChatBtnRef = useRef<View>(null);
    const mapStyleBtnRef = useRef<View>(null);
    const recenterBtnRef = useRef<View>(null);
    const startBtnRef = useRef<View>(null);

    const measureSearchBarNow = useCallback(() => {
        searchBarRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('navigation_search_bar', { x, y, width, height });
            }
        });
    }, []);

    const measureBookedCardNow = useCallback(() => {
        bookedCardRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('navigation_booked_card', { x, y, width, height });
            }
        });
    }, []);

    const measureDiyCardNow = useCallback(() => {
        diyCardRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('navigation_diy_card', { x, y, width, height });
            }
        });
    }, []);

    const measureFullscreenBtnNow = useCallback(() => {
        fullscreenBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('navigation_fullscreen_btn', { x, y, width, height });
            }
        });
    }, []);

    const measureTicketBtnNow = useCallback(() => {
        ticketBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('navigation_upcoming_tickets_btn', { x, y, width, height });
            }
        });
    }, []);

    const measureCardChatBtnNow = useCallback(() => {
        cardChatBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('navigation_card_chat_btn', { x, y, width, height });
            }
        });
    }, []);

    const measureColumnChatBtnNow = useCallback(() => {
        columnChatBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('navigation_column_chat_btn', { x, y, width, height });
            }
        });
    }, []);

    const measureMapStyleBtnNow = useCallback(() => {
        mapStyleBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('navigation_map_style_btn', { x, y, width, height });
            }
        });
    }, []);

    const measureRecenterBtnNow = useCallback(() => {
        recenterBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('navigation_recenter_btn', { x, y, width, height });
            }
        });
    }, []);

    const measureStartBtnNow = useCallback(() => {
        startBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('navigation_start_hike_btn', { x, y, width, height });
            }
        });
    }, []);

    const measureAllTargetsNow = useCallback(() => {
        measureSearchBarNow();
        measureBookedCardNow();
        measureDiyCardNow();
        measureFullscreenBtnNow();
        measureTicketBtnNow();
        measureCardChatBtnNow();
        measureColumnChatBtnNow();
        measureMapStyleBtnNow();
        measureRecenterBtnNow();
        measureStartBtnNow();
    }, [
        measureSearchBarNow,
        measureBookedCardNow,
        measureDiyCardNow,
        measureFullscreenBtnNow,
        measureTicketBtnNow,
        measureCardChatBtnNow,
        measureColumnChatBtnNow,
        measureMapStyleBtnNow,
        measureRecenterBtnNow,
        measureStartBtnNow,
    ]);

    // Pre-measure all target elements immediately when the tutorial becomes visible
    useEffect(() => {
        if (!tutorial.isVisible) return;
        requestAnimationFrame(() => {
            measureAllTargetsNow();
        });
    }, [tutorial.isVisible, measureAllTargetsNow]);

    useEffect(() => {
        const cleanups = [
            registerMeasureCallback('navigation_search_bar', measureSearchBarNow),
            registerMeasureCallback('navigation_booked_card', measureBookedCardNow),
            registerMeasureCallback('navigation_diy_card', measureDiyCardNow),
            registerMeasureCallback('navigation_fullscreen_btn', measureFullscreenBtnNow),
            registerMeasureCallback('navigation_upcoming_tickets_btn', measureTicketBtnNow),
            registerMeasureCallback('navigation_card_chat_btn', measureCardChatBtnNow),
            registerMeasureCallback('navigation_column_chat_btn', measureColumnChatBtnNow),
            registerMeasureCallback('navigation_map_style_btn', measureMapStyleBtnNow),
            registerMeasureCallback('navigation_recenter_btn', measureRecenterBtnNow),
            registerMeasureCallback('navigation_start_hike_btn', measureStartBtnNow),
        ];
        return () => {
            cleanups.forEach((cleanup) => cleanup());
        };
    }, [
        measureSearchBarNow,
        measureBookedCardNow,
        measureDiyCardNow,
        measureFullscreenBtnNow,
        measureTicketBtnNow,
        measureCardChatBtnNow,
        measureColumnChatBtnNow,
        measureMapStyleBtnNow,
        measureRecenterBtnNow,
        measureStartBtnNow,
    ]);

    const handleSearchBarLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureSearchBarNow();
    }, [measureSearchBarNow]);

    const handleBookedCardLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureBookedCardNow();
    }, [measureBookedCardNow]);

    const handleDiyCardLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureDiyCardNow();
    }, [measureDiyCardNow]);

    const handleFullscreenBtnLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureFullscreenBtnNow();
    }, [measureFullscreenBtnNow]);

    const handleTicketBtnLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureTicketBtnNow();
    }, [measureTicketBtnNow]);

    const handleCardChatBtnLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureCardChatBtnNow();
    }, [measureCardChatBtnNow]);

    const handleColumnChatBtnLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureColumnChatBtnNow();
    }, [measureColumnChatBtnNow]);

    const handleMapStyleBtnLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureMapStyleBtnNow();
    }, [measureMapStyleBtnNow]);

    const handleRecenterBtnLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureRecenterBtnNow();
    }, [measureRecenterBtnNow]);

    const handleStartBtnLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureStartBtnNow();
    }, [measureStartBtnNow]);

    return {
        tutorial,
        searchBarRef,
        bookedCardRef,
        diyCardRef,
        fullscreenBtnRef,
        ticketBtnRef,
        cardChatBtnRef,
        columnChatBtnRef,
        mapStyleBtnRef,
        recenterBtnRef,
        startBtnRef,
        handlers: {
            handleSearchBarLayout,
            handleBookedCardLayout,
            handleDiyCardLayout,
            handleFullscreenBtnLayout,
            handleTicketBtnLayout,
            handleCardChatBtnLayout,
            handleColumnChatBtnLayout,
            handleMapStyleBtnLayout,
            handleRecenterBtnLayout,
            handleStartBtnLayout,
        },
    };
};
