// FILE: src/core/types/weather.ts
// ACTION: CREATE
// REASON: Clean separation of TypeScript models related to weather data structure.

export type HikingSafetyStatus = "SAFE" | "CAUTION" | "DANGER";

export interface WeatherApiResponse {
    current: {
        time: string;
        interval: number;
        temperature_2m: number;
        relative_humidity_2m: number;
        apparent_temperature: number;
        is_day: number;
        precipitation: number;
        rain: number;
        showers: number;
        snowfall: number;
        weather_code: number;
        cloud_cover: number;
        pressure_msl: number;
        surface_pressure: number;
        wind_speed_10m: number;
        wind_direction_10m: number;
        wind_gusts_10m: number;
        uv_index: number;
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
        uv_index: number[];
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
    uvIndexMax: number;
    precipitationProbabilityMax: number;
    windSpeedMax: number;
}

export interface ProcessedWeatherData {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
    windDirection: number;
    windGusts: number;
    humidity: number;
    uvIndex: number;
    uvIndexMax: number;
    precipitationProbability: number;
    precipitationSum: number;
    apparentTemperature: number;
    visibility: number;
    sunrise: string;
    sunset: string;
    isStale: boolean;
    forecast: DailyForecast[];
    lastUpdated?: string;
}
