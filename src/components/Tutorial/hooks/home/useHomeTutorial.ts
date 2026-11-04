/**
 * @file useHomeTutorial.ts
 * @description Hook managing the Tabs / Web Navigation walkthrough tutorial for HomeScreen.
 */

import { useTutorialGuide } from '../useTutorialGuide';

export interface UseHomeTutorialParams {
  /** Flag indicating whether the HomeScreen has finished loading its initial data */
  isReady: boolean;
}

/**
 * Hook to manage the Home screen onboarding tutorial tour ('tabs').
 * Adapts automatically between Mobile (5 bottom tabs + messages FAB) and
 * Web (sidebar navigation drawer) depending on runtime platform.
 *
 * @param params - Configuration parameters including data readiness flag.
 * @returns Tutorial state, step progression handlers, and replay callbacks.
 */
export const useHomeTutorial = ({ isReady }: UseHomeTutorialParams) => {
  const tutorial = useTutorialGuide('tabs', isReady);

  return tutorial;
};

