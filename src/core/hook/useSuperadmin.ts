import { useBusinessesStore } from '@/src/core/stores/businessesStore';
import { useMountainsStore } from '@/src/core/stores/mountainsStore';
import { useTrailsStore } from '@/src/core/stores/trailsStore';
import { useUsersStore } from '@/src/core/stores/usersStore';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useApplicationsStore } from '../stores/applicationsStore';

type SuperadminParams = {
    role: string;
}

export default function useSuperadmin(params: SuperadminParams | null){
    const loadBusinesses = useBusinessesStore(s => s.fetchAll);
    const reloadBusinesses = useBusinessesStore(s => s.fetchAll);
    const businessLoading = useBusinessesStore(s => s.isLoading);
    const businesses = useBusinessesStore(s => s.data);
    const businessCount = businesses.length;
    const addBusiness = useBusinessesStore(s => s.create);
    const deleteBusiness = useBusinessesStore(s => s.delete);

    const trails = useTrailsStore(s => s.data);
    const loadAllTrails = useTrailsStore(s => s.fetchAll);
    const trailCount = trails.length;
    const trailLoading = useTrailsStore(s => s.isLoading);

    const mountains = useMountainsStore(s => s.mountains);
    const loadAllMountains = useMountainsStore(s => s.loadAllMountains);
    const mountainCount = mountains.length;
    const mountainLoading = useMountainsStore(s => s.isLoading);

    const users = useUsersStore(s => s.data);
    const loadAllUsers = useUsersStore(s => s.fetchAll);
    const userCount = users.filter(u => u.role === 'user').length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const userLoading = useUsersStore(s => s.isLoading);

    const applications = useApplicationsStore(s => s.applications);
    const application = useApplicationsStore(s => s.application);
    const loadAllApplications = useApplicationsStore(s => s.loadAllApplications);
    const reloadApplications = useApplicationsStore(s => s.reloadApplications);
    const applicationCount = applications.length;
    const approvedApplicationCount = applications.filter((a: any) => a.approved === true).length;
    const pendingApplicationCount = applications.filter((a: any) => a.approved === null).length;
    const rejectedApplications = applications.filter((a: any) => a.approved === false).length;
    const applicationLoading = useApplicationsStore(s => s.isLoading);
    const approveApplication = useApplicationsStore(s => s.approveApplication);

    // const loaded = !(
    //     applicationLoading || 
    //     trailLoading || 
    //     businessLoading ||
    //     mountainLoading || 
    //     userLoading
    // );
    
    useEffect(() => {
        console.log('in hook')
        if(params && params.role === 'superadmin'){
            console.log('load businesses');
            loadBusinesses();
            loadAllTrails();
            loadAllUsers();
            loadAllMountains();
            loadAllApplications();
        };
    }, [params?.role]);

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

    function onCheckApplication(
        id: string
    ){

    }

    async function onApproveApplicationPress(
        applicationData: any
    ){
        await approveApplication(applicationData);
        // await addBusiness(applicationData);
        await reloadBusinesses();
    }

    async function onDeleteBusinessPress(
        id: string
    ){
        await deleteBusiness(id);
    }

    function onViewTrail(
        trailId: string
    ){
        router.push({
            pathname: '/(main)/trail/view',
            params: { trailId }
        })
    }

    function onWriteTrail(
        trailId: string
    ){
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
        role: params?.role,
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
        // loaded,
        applicationLoading,
        businessLoading,
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