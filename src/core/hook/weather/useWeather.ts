import { IBaseDomainHook } from "@/src/core/interface/domainHookInterface";
import { useWeatherStore } from "@/src/core/stores/weatherStore";
import { useEffect } from "react";

export interface IWeatherDomain extends IBaseDomainHook {
    locationWeather: any; // TODO define weather data
}

export type UseWeatherParams = {
    location?: string;
    date?: Date; 
}

export default function useWeather(params: UseWeatherParams = {}): IWeatherDomain {
    const { location, date } = params;

    const loadWeather = useWeatherStore(s => s.loadWeather); 

    const isLoading = useWeatherStore(s => s.isLoading);
    const error = useWeatherStore(s => s.error);
    const locationWeather = useWeatherStore(s => s.locationWeather);

    useEffect(() => {
        loadWeather()
    }, [])

    return {
        isLoading,
        error,
        locationWeather,
    }
}