// FILE: src/core/utility/weatherHelpers.ts
// ACTION: CREATE
// REASON: Keep weather-specific presentation logic isolated and grouped together rather than crowding general formatting utilities.

import { HikingSafetyStatus, ProcessedWeatherData } from "../types/weather";

export const formatForecastDay = (isoDateString: string, index: number): string => {
    if (index === 0) return "Today";
    const [year, month, day] = isoDateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-PH', { weekday: 'short' });
};

export const formatSunTime = (isoString: string): string => {
    if (!isoString) return '--:--';
    const parts = isoString.split('T');
    const timePart = parts.length > 1 ? parts[1] : parts[0];
    const [hourStr, minuteStr] = timePart.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = minuteStr;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return displayHour + ':' + minute + ' ' + ampm;
};

export const getWeatherInfoUI = (code: number | undefined | null): { condition: string, icon: string, library: string } => {
    if (code === undefined || code === null) return { condition: 'Unknown', icon: 'cloud', library: 'Feather' };
    if (code === 0) return { condition: 'Clear Sky', icon: 'sun', library: 'Feather' };
    if (code <= 3) return { condition: 'Partly Cloudy', icon: 'cloud', library: 'Feather' };
    if (code <= 48) return { condition: 'Fog', icon: 'cloud', library: 'Feather' };
    if (code <= 57) return { condition: 'Drizzle', icon: 'cloud-drizzle', library: 'Feather' };
    if (code <= 67) return { condition: 'Rain', icon: 'cloud-rain', library: 'Feather' };
    if (code <= 77) return { condition: 'Snow', icon: 'cloud-snow', library: 'Feather' };
    if (code <= 82) return { condition: 'Showers', icon: 'cloud-rain', library: 'Feather' };
    if (code <= 86) return { condition: 'Snow Showers', icon: 'cloud-snow', library: 'Feather' };
    if (code >= 95) return { condition: 'Thunderstorm', icon: 'cloud-lightning', library: 'Feather' };
    return { condition: 'Unknown', icon: 'cloud', library: 'Feather' };
};

export const getWeatherDescription = (wmoCode: number): string => {
    switch (true) {
        case wmoCode === 0: return "Clear Sky";
        case wmoCode === 1: return "Mainly Clear";
        case wmoCode === 2: return "Partly Cloudy";
        case wmoCode === 3: return "Overcast";
        case wmoCode === 45 || wmoCode === 48: return "Fog";
        case wmoCode >= 51 && wmoCode <= 55: return "Drizzle";
        case wmoCode >= 56 && wmoCode <= 57: return "Freezing Drizzle";
        case wmoCode >= 61 && wmoCode <= 65: return "Rain";
        case wmoCode >= 66 && wmoCode <= 67: return "Freezing Rain";
        case wmoCode >= 71 && wmoCode <= 75: return "Snow Fall";
        case wmoCode === 77: return "Snow Grains";
        case wmoCode >= 80 && wmoCode <= 82: return "Rain Showers";
        case wmoCode >= 85 && wmoCode <= 86: return "Snow Showers";
        case wmoCode === 95: return "Thunderstorm";
        case wmoCode >= 96 && wmoCode <= 99: return "Severe Thunderstorms";
        default: return "Unknown";
    }
};

export const getWeatherIcon = (wmoCode: number): string => {
    switch (true) {
        case wmoCode === 0: return "weather-sunny"; // Clear Sky
        case wmoCode === 1 || wmoCode === 2: return "weather-partly-cloudy";    // Partly Cloudy
        case wmoCode === 3: return "weather-cloudy";    // Overcast
        case wmoCode === 45 || wmoCode === 48: return "weather-fog";
        case wmoCode >= 51 && wmoCode <= 67: return "weather-pouring";   // Rain/Drizzle
        case wmoCode >= 80 && wmoCode <= 82: return "weather-rainy"; // Showers
        case wmoCode >= 71 && wmoCode <= 86: return "weather-snowy"; // Snow
        case wmoCode >= 95 && wmoCode <= 99: return "weather-lightning";   // Thunderstorm
        default: return "weather-cloudy";
    }
};

export const getWindDirection = (degrees: number): string => {
    if (degrees == null) return "Unknown";
    const normalized = degrees % 360;
    if (normalized >= 337.5 || normalized < 22.5) return "From North";
    if (normalized >= 22.5 && normalized < 67.5) return "From Northeast";
    if (normalized >= 67.5 && normalized < 112.5) return "From East";
    if (normalized >= 112.5 && normalized < 157.5) return "From Southeast";
    if (normalized >= 157.5 && normalized < 202.5) return "From South";
    if (normalized >= 202.5 && normalized < 247.5) return "From Southwest";
    if (normalized >= 247.5 && normalized < 292.5) return "From West";
    if (normalized >= 292.5 && normalized < 337.5) return "From Northwest";
    return "Unknown";
};

export const getUVLabel = (uv: number): string => {
    if (uv <= 2) return "Low";
    if (uv <= 5) return "Moderate";
    if (uv <= 7) return "High";
    if (uv <= 10) return "Very High";
    return "Extreme";
};

export const getHumidityLabel = (humidity: number): string => {
    if (humidity <= 30) return "Dry air";
    if (humidity <= 60) return "Comfortable";
    if (humidity <= 80) return "Humid air";
    return "Very Humid";
};

export const getHikingSafetyStatus = (data: ProcessedWeatherData): HikingSafetyStatus => {
    const { windSpeed, precipitationProbability, weatherCode } = data;
    
    const isSevereWeather = [65, 75, 82, 85, 86, 95, 96, 99].includes(weatherCode);

    if (windSpeed > 60 || precipitationProbability > 70 || isSevereWeather) {
        return "DANGER";
    }

    if ((windSpeed >= 40 && windSpeed <= 60) || (precipitationProbability >= 50 && precipitationProbability <= 70)) {
        return "CAUTION";
    }

    return "SAFE";
};
