/**
 * @file useAdminDashboardTutorial.ts
 * @description Hook managing layout measurement, spotlight registration, and tutorial guide for DashboardScreen.
 */

import { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';

import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
} from '../../utils/tutorialLayoutRegistry';
import { useTutorialGuide } from '../useTutorialGuide';

export interface UseAdminDashboardTutorialParams {
    /** Flag indicating whether the DashboardScreen has finished loading data and has no error */
    isReady: boolean;
}

/**
 * Encapsulates tutorial state, element measurement, and spotlight coordinates
 * for the Admin Dashboard (overview cards and quick action sticky footer).
 *
 * @param params - Configuration parameters including data readiness flag.
 * @returns Ref objects, layout event handlers, and tutorial controller.
 */
export const useAdminDashboardTutorial = ({
    isReady,
}: UseAdminDashboardTutorialParams) => {
    const overviewRef = useRef<View>(null);

    const tutorial = useTutorialGuide('admin_dashboard', isReady);

    const measureOverviewNow = useCallback(() => {
        overviewRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('admin_dash_overview', { x, y, width, height });
            }
        });
    }, []);

    useEffect(() => {
        return registerMeasureCallback('admin_dash_overview', measureOverviewNow);
    }, [measureOverviewNow]);

    const handleOverviewLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureOverviewNow();
    }, [measureOverviewNow]);

    return {
        overviewRef,
        handleOverviewLayout,
        tutorial,
    };
};

