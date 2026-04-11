// FILE: src/core/types/weather.ts
// ACTION: CREATE
// REASON: Clean separation of TypeScript models related to weather data structure.

export type HikingSafetyStatus = "SAFE" | "CAUTION" | "DANGER";

export interface WeatherApiResponse {
    current_weather: {
        temperature: number;
        windspeed: number;
        winddirection: number;
        weathercode: number;
        time: string;
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
        precipitation_probability: number[];
        windspeed_10m: number[];
        winddirection_10m: number[];
        relativehumidity_2m: number[];
        weathercode: number[];
        apparent_temperature: number[];
        visibility: number[];
        windgusts_10m: number[];
    };
    daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_sum: number[];
        windspeed_10m_max: number[];
        uv_index_max: number[];
        sunrise: string[];
        sunset: string[];
        weathercode: number[];
        precipitation_probability_max: number[];
        windgusts_10m_max: number[];
    };
    timezone: string;
    timezone_abbreviation: string;
}

export interface DailyForecast {
    date: string;
    temperatureMax: number;
    temperatureMin: number;
    weatherCode: number;
}

export interface ProcessedWeatherData {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
    windDirection: number;
    windGusts: number;
    humidity: number;
    uvIndex: number;
    precipitationProbability: number;
    precipitationSum: number;
    sunrise: string;
    sunset: string;
    isStale: boolean;
    forecast: DailyForecast[];
    lastUpdated?: string;
}
