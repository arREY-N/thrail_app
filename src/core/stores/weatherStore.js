import { create } from "zustand";

const init = {
    locationWeather: null,
    error: null,
    isLoading: true,
}

export const useWeatherStore = create((set, get) => ({
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
                error: err.message ?? 'Failed loading weather data',
                isLoading: false,
            })
        }
    }
}))