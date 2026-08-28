
import { useApplicationsStore } from '@/src/core/models/Application/Application';
import { useBusinessesStore } from '@/src/core/models/Business/Business';
import { useMountainsStore } from '@/src/core/models/Mountain/Mountain';
import { useTrailsStore } from "@/src/core/models/Trail/Trail";
import { Role, useUserStore } from '@/src/core/models/User/User';
import { useEffect } from 'react';

export type SuperadminParams = {
    role: Role | null;
}

export function useSuperadmin(params: SuperadminParams | null) {
    const loadBusinesses = useBusinessesStore(s => s.fetchAll);
    const reloadBusinesses = useBusinessesStore(s => s.refresh);
    const businessLoading = useBusinessesStore(s => s.isLoading);
    const businesses = useBusinessesStore(s => s.data);
    const businessCount = businesses.length;
    const deleteBusiness = useBusinessesStore(s => s.delete);

    const trails = useTrailsStore(s => s.data);
    const loadAllTrails = useTrailsStore(s => s.fetchAll);
    const trailCount = trails.length;
    const trailLoading = useTrailsStore(s => s.isLoading);

    const mountains = useMountainsStore(s => s.data);
    const loadAllMountains = useMountainsStore(s => s.fetchAll);
    const mountainCount = mountains.length;

    const users = useUserStore(s => s.data);
    const loadAllUsers = useUserStore(s => s.fetchAll);
    const userCount = users.filter(u => u.role === 'user').length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const superadminCount = users.filter(u => u.role === 'superadmin').length;

    const applications = useApplicationsStore(s => s.data);
    const loadAllApplications = useApplicationsStore(s => s.fetchAll);
    const reloadApplications = useApplicationsStore(s => s.refresh);
    const applicationCount = applications.length;
    const approvedApplicationCount = applications.filter((a: any) => a.approved === true).length;
    const pendingApplicationCount = applications.filter((a: any) => a.approved === null).length;
    const rejectedApplications = applications.filter((a: any) => a.approved === false).length;
    const applicationLoading = useApplicationsStore(s => s.isLoading);
    const approveApplication = useApplicationsStore(s => s.approveApplication);

    useEffect(() => {
        // console.log('in hook')
        if (params && params.role === 'superadmin') {
            loadBusinesses();
            loadAllTrails();
            loadAllUsers();
            loadAllMountains();
            loadAllApplications();
        }
    }, [loadAllApplications, loadAllMountains, loadAllTrails, loadAllUsers, loadBusinesses, params, params?.role]);

    useEffect(() => {
        if (__DEV__ && users.length > 0) {
            console.log(`[Superadmin] Initialized dashboard with ${users.length} users, ${businesses.length} businesses, ${mountains.length} mountains.`);
        }
    }, [businesses.length, mountains.length, users.length]);

    async function onApproveApplicationPress(applicationData: any) {
        await approveApplication(applicationData);
        // await addBusiness(applicationData);
        await reloadBusinesses();
    }

    async function onDeleteBusinessPress(id: string) {
        await deleteBusiness(id);
    }

    return {
        role: params?.role,
        businesses,
        businessCount,
        trails,
        trailCount,
        users,
        userCount,
        adminCount,
        superadminCount,
        mountains,
        mountainCount,
        applications,
        applicationCount,
        rejectedApplications,
        approvedApplicationCount,
        pendingApplicationCount,
        // loaded,
        applicationLoading,
        businessLoading,
        trailLoading,
        reloadBusinesses,
        reloadApplications,

        onApproveApplicationPress,
        onDeleteBusinessPress,
    }

}