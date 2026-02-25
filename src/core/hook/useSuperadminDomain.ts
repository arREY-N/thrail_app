import { router } from "expo-router";
import { useEffect } from "react";
import { useApplicationsStore } from "../stores/applicationsStore";
import { useBusinessesStore } from "../stores/businessesStore";
import { useMountainsStore } from "../stores/mountainsStore";
import { useTrailsStore } from "../stores/trailsStore";
import { useUsersStore } from "../stores/usersStore";
import { SuperadminParams } from "./useSuperadmin";

export default function useSuperadminDomain(params: SuperadminParams | null){
    const loadBusinesses = useBusinessesStore(s => s.fetchAll);
    const businesses = useBusinessesStore(s => s.data);

    const loadTrails = useTrailsStore(s => s.fetchAll);
    const trails = useTrailsStore(s => s.data);

    const loadMountains = useMountainsStore(s => s.fetchAll);
    const mountains = useMountainsStore(s => s.data);

    const loadUsers = useUsersStore(s => s.fetchAll);
    const loadedUsers = useUsersStore(s => s.data);
    const superadmin = loadedUsers.filter(s => s.role === 'superadmin');
    const admin = loadedUsers.filter(s => s.role === 'admin');
    const users = loadedUsers.filter(s => s.role === 'user');
    
    const loadApplications = useApplicationsStore(s => s.fetchAll);
    const applications = useApplicationsStore(s => s.data);
    const pendingApplication = applications.filter(a => a.status === 'pending');
    const rejectedApplication = applications.filter(a => a.status === 'rejected');
    const approvedApplication = applications.filter(a => a.status === 'approved');

    useEffect(() => {
        loadBusinesses();
        loadTrails();
        loadMountains();
        loadUsers();
        loadApplications();
    }, []);

    const onManageBusinessPress = () => {
        router.push({
            pathname: '/(main)/superadmin/business/list'
        })
    }

    const onManageTrailsPress = () => {
        router.push({
            pathname: '/(main)/superadmin/trail/list'
        })
    }
    
    const onManageUsersPress = () => {
        router.push({
            pathname: '/(main)/superadmin/user/list'
        })
    }
    
    const onManageMountainPress = () => {
        router.push({
            pathname: '/(main)/superadmin/mountain/list'
        })
    }

    const onManageApplicationPress = () => {
        router.push({
            pathname: '/(main)/superadmin/application/list',
        })
    }

    const onViewApplicationPress = (applicationId: string) => {
        router.push({
            pathname: '/(main)/superadmin/application/view',
            params: { applicationId }
        })
    }

    return {
        businesses,
        trails,
        superadmin,
        admin,
        users,
        mountains,
        applications,
        pendingApplication,
        approvedApplication,
        rejectedApplication,
        onManageBusinessPress,
        onManageTrailsPress,
        onManageUsersPress,
        onManageMountainPress,
        onManageApplicationPress,
        onViewApplicationPress,
    }
}