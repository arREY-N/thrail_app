import { createContext, useContext, useState } from 'react';

const WeatherContext = createContext(null);

export function useWeather(){
    const context = useContext(WeatherContext);

    if(!context){
        throw new Error('useWeather must be used inside a WeatherProvider')
    }

    return context;
}

export function WeatherProvider({children}){
    const [locationTemp, setLocationTemp] = useState({
        location: 'Caloocan',
        temperature: 29,
        day: 27,
        night: 29,
        precipitation: {
            amount: 1.52,
            chance: 1
        },
        wind: 1.3,
        humidity: 0.83,
        UV: 5,
    })

    const value = {
        locationTemp
    }

    return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
}