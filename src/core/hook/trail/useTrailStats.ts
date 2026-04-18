import { ITrailStats } from "@/src/core/models/Trail/Trail.types";
import { getStatsForMountain } from "@/src/core/models/Trail/logic/GeoJSONProcessor";
import { useEffect, useState } from "react";

/**
 * Custom hook that computes trail stats for a given mountain name.
 * 
 * When trailhead coordinates (startLat, startLon) are provided, only
 * GeoJSON segments within ~2.5km of the trailhead are included.
 * This filters out unrelated footpaths from the 8km-radius GeoJSON data.
 * 
 * @param mountainName - The name of the mountain (e.g., "Mount Tagapo").
 * @param startLat - Optional trailhead latitude for proximity filtering.
 * @param startLon - Optional trailhead longitude for proximity filtering.
 */
export function useTrailStats(
    mountainName: string | undefined | null,
    startLat?: number,
    startLon?: number
) {
    const [stats, setStats] = useState<ITrailStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!mountainName) {
            setStats(null);
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        setIsLoading(true);

        getStatsForMountain(mountainName, startLat, startLon).then((result) => {
            if (!cancelled) {
                setStats(result);
                setIsLoading(false);
            }
        }).catch((err) => {
            console.error("useTrailStats error:", err);
            if (!cancelled) {
                setStats(null);
                setIsLoading(false);
            }
        });

        return () => { cancelled = true; };
    }, [mountainName, startLat, startLon]);

    return { stats, isLoading };
}
