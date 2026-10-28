/**
 * @file apply.tsx
 * @description Controller route for partner business registration.
 * Composes useApplyWrite, manages existing user application state checks,
 * handles submission toasts, and coordinates screen transitions to Profile.
 */

import React, { useEffect, useMemo } from 'react';

import LoadingScreen from '@/src/app/loading';
import { useToast } from '@/src/components/Toast/Toast';
import useApplyWrite from '@/src/core/hook/apply/useApplyWrite';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useApplicationsStore } from '@/src/core/models/Application/Application';
import { useAuthStore } from '@/src/core/models/User/User';
import ApplyScreen from '@/src/features/SuperAdmin/screens/tabs/ApplyScreen';

/**
 * Controller managing data orchestration, toast notifications, and submission flow
 * for the business partner application screen.
 */
export default function ApplyBusiness(): React.JSX.Element {
    const { onBackPress } = useAppNavigation();
    const { showToast } = useToast();

    const profile = useAuthStore(s => s.profile);
    const applications = useApplicationsStore(s => s.data);
    const fetchAllApplications = useApplicationsStore(s => s.fetchAll);

    useEffect(() => {
        fetchAllApplications();
    }, [fetchAllApplications]);

    const existingApplication = useMemo(() => {
        if (!profile?.id) return null;
        return applications.find(a => a.owner?.id === profile.id) || null;
    }, [applications, profile]);

    const {
        object: application,
        options,
        isLoading,
        onSubmitPress,
        onUpdatePress,
    } = useApplyWrite({ userId: profile?.id });

    const handleSubmit = async () => {
        try {
            await onSubmitPress();
            showToast.success('Application submitted successfully! Our team will review your credentials.');
            onBackPress();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to submit application. Please check your fields.';
            showToast.error(message);
        }
    };

    if (!application) {
        return <LoadingScreen />;
    }

    return (
        <ApplyScreen
            application={application}
            options={options}
            existingApplication={existingApplication}
            isLoading={isLoading}
            onUpdatePress={onUpdatePress}
            onSubmitPress={handleSubmit}
            onBackPress={onBackPress}
        />
    );
}
