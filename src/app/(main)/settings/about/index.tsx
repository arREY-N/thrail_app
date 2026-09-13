/**
 * @file index.tsx
 * @description Controller for the about settings page.
 */
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useLandingNavigation from '@/src/core/hook/navigation/useLandingNavigation';
import AboutScreen from '@/src/features/Settings/screens/AboutScreen';

/**
 * AboutPage coordinates callbacks for displaying the about screen.
 */
export default function About() {
    const { onBackPress, onHelpSettingsPress } = useAppNavigation();
    const { onTerms, onPrivacy } = useLandingNavigation();

    return (
        <AboutScreen
            onBackPress={onBackPress}
            onHelpPress={onHelpSettingsPress}
            onTerms={onTerms}
            onPrivacy={onPrivacy}
        />
    );
}
