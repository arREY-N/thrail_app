/**
 * @file index.tsx
 * @description Controller for the about settings page.
 */
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import AboutScreen from '@/src/features/Settings/screens/AboutScreen';

/**
 * AboutPage coordinates callbacks for displaying the about screen.
 */
export default function About() {
    const { 
        onBackPress, 
        onHelpSettingsPress,
        onTermsSettingsPress,
        onPrivacyPolicySettingsPress,
        onPoliciesSettingsPress,
    } = useAppNavigation();

    return (
        <AboutScreen
            onBackPress={onBackPress}
            onHelpPress={onHelpSettingsPress}
            onTerms={onTermsSettingsPress}
            onPrivacy={onPrivacyPolicySettingsPress}
            onPolicies={onPoliciesSettingsPress}
        />
    );
}
