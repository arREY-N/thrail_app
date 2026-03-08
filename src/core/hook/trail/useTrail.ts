import { IBaseDomainHook } from "@/src/core/interface/domainHookInterface";
import { Trail } from "@/src/core/models/Trail/Trail";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useEffect } from "react";

export interface ITrailDomain extends IBaseDomainHook{
    /** Access all available trais, for galleries */
    trails: Trail[];
    /** Access loaded trail */
    trail: Trail | null;

}

export type UseTrailParams = {
    /** Provide the ID for viewing specific trail, optional */
    id?: string | null;
}

export default function useTrail(params: UseTrailParams = {}): ITrailDomain{
    const { id } = params;

    const loadAllTrails = useTrailsStore(s => s.fetchAll);
    const loadTrail = useTrailsStore(s => s.load);
    const trails = useTrailsStore(s => s.data);
    const trail = useTrailsStore(s => s.current);
    const isLoading = useTrailsStore(s => s.isLoading);
    const error = useTrailsStore(s => s.error);
    
    useEffect(() => {
        loadAllTrails();
    },[])

    useEffect(() => {
        loadTrail(id);
    }, [id])

    return {
        trails,
        trail,
        isLoading,
        error,
    }
}