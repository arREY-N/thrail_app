// FILE: src/core/stores/weatherStore.ts
// ACTION: UPDATE
// REASON: Refactoring state structure to dictionary-cache based layout aligned with mountainStore pattern.

import { create } from "zustand";
import {
    fetchWeatherFromApi,
    clearWeatherCache,
    generateWeatherCacheKey
} from "../repositories/weatherRepository";
import { ProcessedWeatherData } from "../types/weather";

export interface WeatherState {
    data: Record<string, ProcessedWeatherData>;
    loadingStates: Record<string, boolean>;
    errorStates: Record<string, string | null>;
    isLoading: boolean;
    error: string | null;
    loadWeather: (lat: number, lon: number, elevation?: number, forceRefresh?: boolean) => Promise<void>;
    reset: () => void;
}

const init = {
    data: {},
    loadingStates: {},
    errorStates: {},
    error: null,
    isLoading: false,
};

// In-memory cache validity: 60 minutes (aligned with AsyncStorage disk cache)
const MEMORY_CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_WEATHER_CACHE_ENTRIES = 25;

const isMemoryCacheFresh = (lastUpdated?: string, item?: ProcessedWeatherData): boolean => {
    if (!lastUpdated || !item || !item.hourlyForecast || item.hourlyForecast.length === 0) return false;
    return Date.now() - new Date(lastUpdated).getTime() < MEMORY_CACHE_TTL_MS;
};

// In-flight request deduplication map to prevent concurrent duplicate network queries
const inFlightRequests = new Map<string, Promise<void>>();

export const useWeatherStore = create<WeatherState>()((set, get) => ({
    ...init, 

    reset: () => {
        inFlightRequests.clear();
        set(init);
    },
    
    loadWeather: async (lat: number, lon: number, elevation?: number, forceRefresh = false) => {
        if (typeof lat !== 'number' || typeof lon !== 'number') return;
        
        const key = generateWeatherCacheKey(lat, lon, elevation);
        
        if (forceRefresh) {
            await clearWeatherCache(lat, lon, elevation);
        } else {
            const existingData = get().data[key];
            if (existingData && isMemoryCacheFresh(existingData.lastUpdated, existingData)) {
                return; // Memory cache hit and still fresh
            }
        }

        // Return active in-flight request if already loading this coordinate
        if (inFlightRequests.has(key)) {
            return inFlightRequests.get(key);
        }

        const fetchPromise = (async () => {
            set((state) => ({
                loadingStates: { ...state.loadingStates, [key]: true },
                errorStates: { ...state.errorStates, [key]: null },
                isLoading: true,
                error: null,
            }));

            try {
                const weatherData = await fetchWeatherFromApi(lat, lon, elevation);
                
                set((state) => {
                    const nextData = { ...state.data };
                    // Re-insert key so it moves to the end of insertion order (LRU)
                    delete nextData[key];
                    nextData[key] = weatherData;

                    const keys = Object.keys(nextData);
                    if (keys.length > MAX_WEATHER_CACHE_ENTRIES) {
                        const oldestKey = keys[0];
                        delete nextData[oldestKey];
                    }

                    return {
                        data: nextData,
                        loadingStates: { ...state.loadingStates, [key]: false },
                        isLoading: false,
                    };
                });

            } catch (err) {
                const errMsg = (err as Error).message ?? 'Failed loading weather data';
                set((state) => ({
                    errorStates: { ...state.errorStates, [key]: errMsg },
                    loadingStates: { ...state.loadingStates, [key]: false },
                    error: errMsg,
                    isLoading: false,
                }));
            }
        })();

        inFlightRequests.set(key, fetchPromise);
        try {
            await fetchPromise;
        } finally {
            inFlightRequests.delete(key);
        }
    }
}));