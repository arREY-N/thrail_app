import { useBusinessesStore } from '@/src/core/stores/businessesStore';
import { useMountainsStore } from '@/src/core/stores/mountainsStore';
import { useTrailsStore } from '@/src/core/stores/trailsStore';
import { useUsersStore } from '@/src/core/stores/usersStore';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useApplicationsStore } from '../stores/applicationsStore';
import { useAuthStore } from '../stores/authStore';

export default function useSuperadmin({

}){
    const role = useAuthStore(s => s.role);
    const authLoading = useAuthStore(s => s.isLoading);

    const loadBusinesses = useBusinessesStore(s => s.loadBusinesses);
    const reloadBusinesses = useBusinessesStore(s => s.reloadBusinesses);
    const businessLoading = useBusinessesStore(s => s.isLoading);
    const businesses = useBusinessesStore(s => s.businesses);
    const businessCount = businesses.length;
    const addBusiness = useBusinessesStore(s => s.addBusiness);
    const deleteBusiness = useBusinessesStore(s => s.deleteBusiness);

    const trails = useTrailsStore(s => s.trails);
    const loadAllTrails = useTrailsStore(s => s.loadAllTrails);
    const trailCount = trails.length;
    const trailLoading = useTrailsStore(s => s.isLoading);

    const mountains = useMountainsStore(s => s.mountains);
    const loadAllMountains = useMountainsStore(s => s.loadAllMountains);
    const mountainCount = mountains.length;
    const mountainLoading = useMountainsStore(s => s.isLoading);

    const users = useUsersStore(s => s.users);
    const loadAllUsers = useUsersStore(s => s.loadAllUsers);
    const userCount = users.filter(u => u.role === 'user').length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const userLoading = useUsersStore(s => s.isLoading);

    const applications = useApplicationsStore(s => s.applications);
    const application = useApplicationsStore(s => s.application);
    const loadAllApplications = useApplicationsStore(s => s.loadAllApplications);
    const reloadApplications = useApplicationsStore(s => s.reloadApplications);
    const applicationCount = applications.length;
    const approvedApplicationCount = applications.filter(a => a.approved === true).length;
    const pendingApplicationCount = applications.filter(a => a.approved === null).length;
    const rejectedApplications = applications.filter(a => a.approved === false).length;
    const applicationLoading = useApplicationsStore(s => s.isLoading);
    const approveApplication = useApplicationsStore(s => s.approveApplication);

    const loaded = !(
        applicationLoading || 
        trailLoading || 
        businessLoading ||
        mountainLoading || 
        userLoading
    );
    
    useEffect(() => {
        loadBusinesses();
        loadAllTrails();
        loadAllUsers();
        loadAllMountains();
        loadAllApplications();
    }, []);

    function onManageBusinessPress(){
        router.push({
            pathname: '/(main)/superadmin/business/list'
        })
    }

    function onManageTrailsPress(){
        router.push({
            pathname: '/(main)/superadmin/trail/list'
        })
    }
    
    function onManageUsersPress(){

    }
    
    function onManageMountainPress(){

    }

    function onCheckApplication(id){

    }

    async function onApproveApplicationPress(applicationData){
        await approveApplication(applicationData);
        await addBusiness(applicationData);
        await reloadBusinesses();
    }

    async function onDeleteBusinessPress(id){
        await deleteBusiness(id);
    }

    function onViewTrail(trailId){
        router.push({
            pathname: '/(main)/trail/view',
            params: { trailId }
        })
    }

    function onWriteTrail(trailId){
        if(trailId){
            router.push({
                pathname: '/(main)/superadmin/trail/write',
                params: {trailId}
            });
        } else {
            router.push({
                pathname: '/(main)/superadmin/trail/write',
            });
        }
    }

    return {
        role,
        businesses,
        businessCount,
        trails, 
        trailCount,
        users,
        userCount,
        adminCount,
        mountains,
        mountainCount,
        applications,
        applicationCount,
        rejectedApplications,
        approvedApplicationCount,
        pendingApplicationCount,
        loaded,
        applicationLoading,
        businessLoading,
        authLoading,
        reloadBusinesses,
        reloadApplications,

        onViewTrail,
        onWriteTrail,
        onApproveApplicationPress,
        onDeleteBusinessPress,
        onManageBusinessPress,
        onManageTrailsPress,
        onManageUsersPress,
        onManageMountainPress
    }

}