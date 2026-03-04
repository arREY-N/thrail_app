import { create } from "zustand";

export interface WeatherState {
    isLoading: boolean;
    error: string | null;
    locationWeather: any; // TODO define weather data
    loadWeather: () => void;
}

const init = {
    locationWeather: null,
    error: null,
    isLoading: true,
}

export const useWeatherStore = create<WeatherState>()((set, get) => ({
    ...init, 

    reset: () => set(init),
    
    loadWeather: async () => {
        set({error: null});

        try{
            const weatherData = {
                location: 'Caloocan',
                temperature: 27,
                day: 29,
                night: 26,
            }

            set({
                locationWeather: weatherData,
                isLoading: false,
            })

        } catch (err) {
            set({
                error: (err as Error).message ?? 'Failed loading weather data',
                isLoading: false,
            })
        }
    }
}))