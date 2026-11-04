// FILE: src/hooks/useWeather.ts
// ACTION: UPDATE
// REASON: Delegate loading and error state directly to useWeatherStore to eliminate redundant local state and prevent cascading renders.

import { useCallback, useEffect, useMemo } from 'react';
import { useWeatherStore } from '../core/stores/weatherStore';
import { generateWeatherCacheKey } from '../core/repositories/weatherRepository';

export const useWeather = (
    lat: number | undefined | null,
    lon: number | undefined | null,
    elevation?: number
) => {
    const isValid = typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon);
    
    // Stable cache key derived with 2 decimal places and optional elevation
    const dataKey = useMemo(() => {
        return isValid ? generateWeatherCacheKey(lat!, lon!, elevation) : null;
    }, [isValid, lat, lon, elevation]);

    // Isolated selector subscriptions to avoid whole-store re-renders
    const weatherData = useWeatherStore((s) => (dataKey ? s.data[dataKey] : null));
    const loading = useWeatherStore((s) => (dataKey ? Boolean(s.loadingStates[dataKey]) : false));
    const error = useWeatherStore((s) => (dataKey ? s.errorStates[dataKey] : null));
    const loadWeather = useWeatherStore((s) => s.loadWeather);

    useEffect(() => {
        if (isValid && lat != null && lon != null) {
            loadWeather(lat, lon, elevation);
        }
    }, [isValid, dataKey, loadWeather, lat, lon, elevation]);

    const refetch = useCallback(() => {
        if (!isValid || lat == null || lon == null) return Promise.resolve();
        return loadWeather(lat, lon, elevation, true);
    }, [isValid, lat, lon, elevation, loadWeather]);

    return {
        weatherData,
        loading,
        error,
        refetch,
    };
};


