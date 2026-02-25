import { router } from "expo-router";
import { useEffect } from "react";
import { useMountainsStore } from "../stores/mountainsStore";

export type MountainParams = {
    mountainId: string | null;
}

export default function useMountainDomain(params: MountainParams){
    const mountains = useMountainsStore(s => s.data);
    const isLoading = useMountainsStore(s => s.isLoading);

    const loadAllMountains = useMountainsStore(s => s.fetchAll);
    const load = useMountainsStore(s => s.load);

    useEffect(() => {
        loadAllMountains();
    },[])

    const onWritePress = (mountainId: string | null) => {
        if(mountainId){
            router.push({
                pathname: '/(main)/superadmin/mountain/write',
                params: { mountainId }
            })
        } else {
            router.push({
                pathname: '/(main)/superadmin/mountain/write',
            })
        }
    }

    return {
        mountains,
        isLoading,
        onWritePress,
    }
}