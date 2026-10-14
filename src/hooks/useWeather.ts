// FILE: src/hooks/useWeather.ts
// ACTION: UPDATE
// REASON: Delegate loading and error state directly to useWeatherStore to eliminate redundant local state and prevent cascading renders.

import { useCallback, useEffect } from 'react';
import { useWeatherStore } from '../core/stores/weatherStore';

export const useWeather = (lat: number | undefined | null, lon: number | undefined | null) => {
    const { data, loadWeather, isLoading, error } = useWeatherStore();

    const isValid = typeof lat === 'number' && typeof lon === 'number';
    const dataKey = isValid ? `${lat.toFixed(4)}_${lon.toFixed(4)}` : null;
    const weatherData = dataKey ? data[dataKey] : null;

    useEffect(() => {
        if (isValid) {
            loadWeather(lat, lon);
        }
    }, [isValid, lat, lon, loadWeather]);

    const refetch = useCallback(() => {
        if (!isValid) return Promise.resolve();
        return loadWeather(lat, lon, true);
    }, [isValid, lat, lon, loadWeather]);

    return {
        weatherData,
        loading: isLoading,
        error,
        refetch,
    };
};

