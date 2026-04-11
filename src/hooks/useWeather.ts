// FILE: src/hooks/useWeather.ts
// ACTION: CREATE
// REASON: Exposes a standardized React hook for fetching and consuming weather securely from components.

import { useCallback, useEffect, useState } from 'react';
import { useWeatherStore } from '../core/stores/weatherStore';

export const useWeather = (lat: number | undefined | null, lon: number | undefined | null) => {
    const { data, loadWeather, isLoading: storeLoading } = useWeatherStore();
    const [localLoading, setLocalLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValid = typeof lat === 'number' && typeof lon === 'number';
    const dataKey = isValid ? `${lat.toFixed(4)}_${lon.toFixed(4)}` : null;
    const weatherData = dataKey ? data[dataKey] : null;

    const fetchWeather = useCallback(async (forceRefresh = false) => {
        if (!isValid) return;
        
        setLocalLoading(true);
        setError(null);
        try {
            await loadWeather(lat, lon, forceRefresh);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLocalLoading(false);
        }
    }, [lat, lon, isValid, loadWeather]);

    useEffect(() => {
        if (isValid) {
            fetchWeather();
        }
    }, [isValid, fetchWeather]);

    const refetch = useCallback(() => {
        return fetchWeather(true);
    }, [fetchWeather]);

    return {
        weatherData,
        loading: localLoading || storeLoading,
        error,
        refetch
    };
};
