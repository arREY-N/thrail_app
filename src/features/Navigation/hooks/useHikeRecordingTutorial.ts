/**
 * @file useHikeRecordingTutorial.ts
 * @description Custom hook encapsulating tutorial tour state, element measurement refs,
 * registration callbacks, and layout handlers for the Live Hike Recording screen (HikeRecordingScreen).
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';

import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    type TutorialTourId,
    useTutorialGuide,
} from '@/src/components/Tutorial/Tutorial';
import { getRecordingDiyTourSteps } from '@/src/components/Tutorial/constants/recordingTour';
import { Booking } from '@/src/core/models/Booking/Booking';

interface UseHikeRecordingTutorialParams {
    booking: Booking | null;
    hikeStatus: string;
    isLoading: boolean;
    hasEmergencyChat?: boolean;
}

/**
 * Hook to manage hike recording tutorial walkthrough lifecycle, measurement callbacks, and target refs.
 *
 * @param params - Configuration parameters containing current booking, hike status, loading state, and optional chat presence
 * @returns Tutorial state, target element refs, and onLayout event handlers
 */
export const useHikeRecordingTutorial = ({
    booking,
    hikeStatus,
    isLoading,
    hasEmergencyChat = false,
}: UseHikeRecordingTutorialParams) => {
    const activeTourId: TutorialTourId = booking
        ? 'recording_booked'
        : 'recording_diy';

    const dynamicSteps = useMemo(() => {
        if (!booking) {
            return getRecordingDiyTourSteps(hasEmergencyChat);
        }
        return undefined;
    }, [booking, hasEmergencyChat]);

    // The tutorial only auto-launches on initial unhiked state when screen is fully ready
    const isReady = Platform.OS !== 'web' && hikeStatus === 'unhiked' && !isLoading;
    const tutorial = useTutorialGuide(activeTourId, isReady, dynamicSteps);

    const headerTrailRef = useRef<View>(null);
    const headerSosRef = useRef<View>(null);
    const trailInfoBtnRef = useRef<View>(null);
    const groupChatBtnRef = useRef<View>(null);
    const teamStatusBtnRef = useRef<View>(null);
    const mapOptionsBtnRef = useRef<View>(null);
    const mapStyleBtnRef = useRef<View>(null);
    const recenterBtnRef = useRef<View>(null);
    const metricsHudRef = useRef<View>(null);
    const startBtnRef = useRef<View>(null);
    const helpBtnRef = useRef<View>(null);

    const measureHeaderTrailNow = useCallback(() => {
        headerTrailRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('recording_header_trail', { x, y, width, height });
            }
        });
    }, []);

    const measureHeaderSosNow = useCallback(() => {
        headerSosRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('recording_header_sos', { x, y, width, height });
            }
        });
    }, []);

    const measureTrailInfoBtnNow = useCallback(() => {
        trailInfoBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('recording_trail_info_btn', { x, y, width, height });
            }
        });
    }, []);

    const measureGroupChatBtnNow = useCallback(() => {
        groupChatBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('recording_group_chat_btn', { x, y, width, height });
            }
        });
    }, []);

    const measureTeamStatusBtnNow = useCallback(() => {
        teamStatusBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('recording_team_status_btn', { x, y, width, height });
            }
        });
    }, []);

    const measureMapOptionsBtnNow = useCallback(() => {
        mapOptionsBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('recording_map_options_btn', { x, y, width, height });
            }
        });
    }, []);

    const measureMapStyleBtnNow = useCallback(() => {
        mapStyleBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('recording_map_style_btn', { x, y, width, height });
            }
        });
    }, []);

    const measureRecenterBtnNow = useCallback(() => {
        recenterBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('recording_recenter_btn', { x, y, width, height });
            }
        });
    }, []);

    const measureMetricsHudNow = useCallback(() => {
        metricsHudRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('recording_metrics_hud', { x, y, width, height });
            }
        });
    }, []);

    const measureStartBtnNow = useCallback(() => {
        startBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('recording_start_btn', { x, y, width, height });
            }
        });
    }, []);

    const measureHelpBtnNow = useCallback(() => {
        helpBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('recording_help_btn', { x, y, width, height });
            }
        });
    }, []);

    const measureAllTargetsNow = useCallback(() => {
        measureHeaderTrailNow();
        measureHeaderSosNow();
        measureTrailInfoBtnNow();
        measureGroupChatBtnNow();
        measureTeamStatusBtnNow();
        measureMapOptionsBtnNow();
        measureMapStyleBtnNow();
        measureRecenterBtnNow();
        measureMetricsHudNow();
        measureStartBtnNow();
        measureHelpBtnNow();
    }, [
        measureHeaderTrailNow,
        measureHeaderSosNow,
        measureTrailInfoBtnNow,
        measureGroupChatBtnNow,
        measureTeamStatusBtnNow,
        measureMapOptionsBtnNow,
        measureMapStyleBtnNow,
        measureRecenterBtnNow,
        measureMetricsHudNow,
        measureStartBtnNow,
        measureHelpBtnNow,
    ]);

    // Pre-measure all target elements when the tutorial becomes visible
    useEffect(() => {
        if (!tutorial.isVisible) return;
        requestAnimationFrame(() => {
            measureAllTargetsNow();
        });
    }, [tutorial.isVisible, measureAllTargetsNow]);

    useEffect(() => {
        const cleanups = [
            registerMeasureCallback('recording_header_trail', measureHeaderTrailNow),
            registerMeasureCallback('recording_header_sos', measureHeaderSosNow),
            registerMeasureCallback('recording_trail_info_btn', measureTrailInfoBtnNow),
            registerMeasureCallback('recording_group_chat_btn', measureGroupChatBtnNow),
            registerMeasureCallback('recording_team_status_btn', measureTeamStatusBtnNow),
            registerMeasureCallback('recording_map_options_btn', measureMapOptionsBtnNow),
            registerMeasureCallback('recording_map_style_btn', measureMapStyleBtnNow),
            registerMeasureCallback('recording_recenter_btn', measureRecenterBtnNow),
            registerMeasureCallback('recording_metrics_hud', measureMetricsHudNow),
            registerMeasureCallback('recording_start_btn', measureStartBtnNow),
            registerMeasureCallback('recording_help_btn', measureHelpBtnNow),
        ];
        return () => {
            cleanups.forEach((cleanup) => cleanup());
        };
    }, [
        measureHeaderTrailNow,
        measureHeaderSosNow,
        measureTrailInfoBtnNow,
        measureGroupChatBtnNow,
        measureTeamStatusBtnNow,
        measureMapOptionsBtnNow,
        measureMapStyleBtnNow,
        measureRecenterBtnNow,
        measureMetricsHudNow,
        measureStartBtnNow,
        measureHelpBtnNow,
    ]);

    const handleHeaderTrailLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureHeaderTrailNow();
    }, [measureHeaderTrailNow]);

    const handleHeaderSosLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureHeaderSosNow();
    }, [measureHeaderSosNow]);

    const handleTrailInfoBtnLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureTrailInfoBtnNow();
    }, [measureTrailInfoBtnNow]);

    const handleGroupChatBtnLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureGroupChatBtnNow();
    }, [measureGroupChatBtnNow]);

    const handleTeamStatusBtnLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureTeamStatusBtnNow();
    }, [measureTeamStatusBtnNow]);

    const handleMapOptionsBtnLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureMapOptionsBtnNow();
    }, [measureMapOptionsBtnNow]);

    const handleMapStyleBtnLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureMapStyleBtnNow();
    }, [measureMapStyleBtnNow]);

    const handleRecenterBtnLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureRecenterBtnNow();
    }, [measureRecenterBtnNow]);

    const handleMetricsHudLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureMetricsHudNow();
    }, [measureMetricsHudNow]);

    const handleStartBtnLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureStartBtnNow();
    }, [measureStartBtnNow]);

    const handleHelpBtnLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureHelpBtnNow();
    }, [measureHelpBtnNow]);

    return {
        tutorial,
        headerTrailRef,
        headerSosRef,
        trailInfoBtnRef,
        groupChatBtnRef,
        teamStatusBtnRef,
        mapOptionsBtnRef,
        mapStyleBtnRef,
        recenterBtnRef,
        metricsHudRef,
        startBtnRef,
        helpBtnRef,
        handlers: {
            handleHeaderTrailLayout,
            handleHeaderSosLayout,
            handleTrailInfoBtnLayout,
            handleGroupChatBtnLayout,
            handleTeamStatusBtnLayout,
            handleMapOptionsBtnLayout,
            handleMapStyleBtnLayout,
            handleRecenterBtnLayout,
            handleMetricsHudLayout,
            handleStartBtnLayout,
            handleHelpBtnLayout,
        },
    };
};
