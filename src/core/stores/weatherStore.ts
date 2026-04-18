// FILE: src/core/stores/weatherStore.ts
// ACTION: UPDATE
// REASON: Refactoring state structure to dictionary-cache based layout aligned with mountainStore pattern.

import { create } from "zustand";
import { fetchWeatherFromApi, clearWeatherCache } from "../repositories/weatherRepository";
import { ProcessedWeatherData } from "../types/weather";

export interface WeatherState {
    data: Record<string, ProcessedWeatherData>;
    isLoading: boolean;
    error: string | null;
    loadWeather: (lat: number, lon: number, forceRefresh?: boolean) => Promise<void>;
    reset: () => void;
}

const init = {
    data: {},
    error: null,
    isLoading: false,
};

// In-memory cache validity: 30 minutes
const MEMORY_CACHE_TTL_MS = 30 * 60 * 1000;

const isMemoryCacheFresh = (lastUpdated?: string): boolean => {
    if (!lastUpdated) return false;
    return Date.now() - new Date(lastUpdated).getTime() < MEMORY_CACHE_TTL_MS;
};

export const useWeatherStore = create<WeatherState>()((set, get) => ({
    ...init, 

    reset: () => set(init),
    
    loadWeather: async (lat: number, lon: number, forceRefresh = false) => {
        if (typeof lat !== 'number' || typeof lon !== 'number') return;
        
        const key = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
        
        if (forceRefresh) {
            await clearWeatherCache(lat, lon);
        } else {
            const existingData = get().data[key];
            if (existingData && isMemoryCacheFresh(existingData.lastUpdated)) {
                return; // Memory cache hit and still fresh
            }
        }

        set({ error: null, isLoading: true });

        try {
            const weatherData = await fetchWeatherFromApi(lat, lon);
            
            set((state) => ({
                data: {
                    ...state.data,
                    [key]: weatherData
                },
                isLoading: false,
            }));

        } catch (err) {
            set({
                error: (err as Error).message ?? 'Failed loading weather data',
                isLoading: false,
            });
        }
    }
}));