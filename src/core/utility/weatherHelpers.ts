import { DailyForecast, HikingSafetyStatus, ProcessedWeatherData } from "../types/weather";

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
    if (code === undefined || code === null) return { condition: 'Unknown', icon: 'cloud-outline', library: 'Ionicons' };
    
    if (code === 0) return { condition: 'Clear Sky', icon: 'sunny-outline', library: 'Ionicons' }; 
    if (code <= 2) return { condition: 'Partly Cloudy', icon: 'partly-sunny-outline', library: 'Ionicons' };
    if (code === 3) return { condition: 'Overcast', icon: 'cloudy-outline', library: 'Ionicons' };
    if (code <= 48) return { condition: 'Fog', icon: 'cloud-offline-outline', library: 'Ionicons' };
    if (code <= 57) return { condition: 'Drizzle', icon: 'rainy-outline', library: 'Ionicons' };
    if (code <= 67) return { condition: 'Rain', icon: 'rainy-outline', library: 'Ionicons' };
    if (code <= 77) return { condition: 'Snow', icon: 'snow-outline', library: 'Ionicons' };
    if (code <= 82) return { condition: 'Showers', icon: 'rainy-outline', library: 'Ionicons' };
    if (code <= 86) return { condition: 'Snow Showers', icon: 'snow-outline', library: 'Ionicons' };
    if (code >= 95) return { condition: 'Thunderstorm', icon: 'thunderstorm-outline', library: 'Ionicons' };
    
    return { condition: 'Unknown', icon: 'cloud-outline', library: 'Ionicons' };
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
    const { windSpeed, precipitationProbability, weatherCode, uvIndex } = data;
    
    const isSevereWeather = [65, 75, 82, 85, 86, 95, 96, 99].includes(weatherCode);

    if (windSpeed > 60 || precipitationProbability > 70 || isSevereWeather || uvIndex >= 13) {
        return "DANGER";
    }

    if (
        (windSpeed >= 40 && windSpeed <= 60) || 
        (precipitationProbability >= 50 && precipitationProbability <= 70) ||
        (uvIndex >= 11 && uvIndex < 13)
    ) {
        return "CAUTION";
    }

    return "SAFE";
};

// ─── CONSOLIDATED WEATHER DISPLAY HELPERS ─────────────────────────────────────
// These functions replace manually copy-pasted weather formatting logic
// that was scattered across WeatherScreen, WeatherSection, WeatherWidget, etc.
// Call these instead of duplicating extraction + null-checking + Math.round patterns.

/**
 * Formatted weather values ready for display.
 * Every field is pre-formatted as a display-safe string (never undefined/NaN).
 */
export interface WeatherDisplayValues {
    /** Rounded current temperature or '--' */
    temperature: string;
    /** Rounded day high temp or '--' */
    dayTemp: string;
    /** Rounded night low temp or '--' */
    nightTemp: string;
    /** Human-readable condition, e.g. "Partly Cloudy" */
    condition: string;
    /** Icon name for the current weather code */
    icon: string;
    /** Icon library for the current weather code */
    library: string;
    /** Wind speed display value or '--' */
    windSpeed: string;
    /** Precipitation probability or '--' */
    precipChance: string;
    /** Rounded UV index or '--' */
    uvIndex: string;
    /** Rounded humidity or '--' */
    humidity: string;
    /** Formatted sunrise time or '--:-- AM' */
    sunrise: string;
    /** Formatted sunset time or '--:-- PM' */
    sunset: string;
    /** Formatted feels-like temperature or null */
    feelsLike: string | null;
    /** Whether the data is present (non-null, no error) */
    hasData: boolean;
}

/**
 * Extracts and formats all commonly displayed weather values from raw ProcessedWeatherData.
 * Replaces the manual copy-paste pattern of extracting, null-checking, and Math.round-ing
 * weather fields in every screen/component.
 *
 * @param weatherData - The processed weather data (may be null/undefined)
 * @returns A flat object of display-ready strings
 *
 * @example
 * const display = formatWeatherDisplay(weatherData);
 * <Text>{display.temperature}°C</Text>
 * <Text>Day {display.dayTemp}° / Night {display.nightTemp}°</Text>
 */
export const formatWeatherDisplay = (
    weatherData: ProcessedWeatherData | null | undefined
): WeatherDisplayValues => {
    const hasData = weatherData != null;
    const { condition, icon, library } = getWeatherInfoUI(weatherData?.weatherCode);

    const today: DailyForecast | undefined = weatherData?.forecast?.[0];

    return {
        temperature: hasData && weatherData.temperature !== undefined && !isNaN(weatherData.temperature)
            ? String(Math.round(weatherData.temperature))
            : '--',
        dayTemp: today?.temperatureMax !== undefined
            ? String(Math.round(today.temperatureMax))
            : '--',
        nightTemp: today?.temperatureMin !== undefined
            ? String(Math.round(today.temperatureMin))
            : '--',
        condition,
        icon,
        library,
        windSpeed: hasData && weatherData.windSpeed !== undefined
            ? String(weatherData.windSpeed)
            : '--',
        precipChance: hasData && weatherData.precipitationProbability !== undefined
            ? String(weatherData.precipitationProbability)
            : '--',
        uvIndex: hasData && weatherData.uvIndex !== undefined
            ? String(Math.round(weatherData.uvIndex))
            : '--',
        humidity: hasData && weatherData.humidity !== undefined
            ? String(Math.round(weatherData.humidity))
            : '--',
        sunrise: weatherData?.sunrise ? formatSunTime(weatherData.sunrise) : '--:-- AM',
        sunset: weatherData?.sunset ? formatSunTime(weatherData.sunset) : '--:-- PM',
        feelsLike: hasData && weatherData.apparentTemperature != null
            ? String(Math.round(weatherData.apparentTemperature))
            : null,
        hasData,
    };
};

/**
 * Formats a "last updated" timestamp into a human-readable relative label.
 * Replaces the duplicated useMemo logic found in WeatherWidget and WeatherScreen.
 *
 * @param lastUpdated - ISO date string or undefined
 * @returns A label like "Just now", "5 min ago", "2h 15m ago", or null
 */
export const formatLastUpdatedLabel = (lastUpdated: string | undefined | null): string | null => {
    if (!lastUpdated) return null;
    const diffMs = Date.now() - new Date(lastUpdated).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ${diffMin % 60}m ago`;
};

// ─── TRAIL WEATHER BADGE HELPERS ──────────────────────────────────────────────
// Replaces the identical MOUNTAIN_COORDS, resolveCoordsForTrail, and
// Promise.allSettled fetch-and-map logic duplicated in HomeScreen and ExploreScreen.

/** Known mountain coordinates for trail weather lookups. */
export const MOUNTAIN_COORDS: Record<string, { lat: number; lon: number }> = {
    tagapo: { lat: 14.3392772, lon: 121.2325293 },
    marami: { lat: 14.1986108, lon: 120.6858334 },
    batulao: { lat: 14.0399434, lon: 120.8023782 },
    makiling: { lat: 14.1352241, lon: 121.1944517 },
    maculot: { lat: 13.9208682, lon: 121.0516961 },
};

/** Weather badge data for a single trail, ready to pass to MountainCard. */
export interface TrailWeatherBadge {
    icon: string;
    temperature: number;
}

/**
 * Resolves known mountain coordinates from a trail object's name.
 *
 * @param trail - A trail object with `general.name`
 * @returns Coordinates or null if no known mountain matches
 */
export const resolveCoordsForTrail = (
    trail: { general?: { name?: string } }
): { lat: number; lon: number } | null => {
    const name = (trail?.general?.name ?? "").toLowerCase();
    for (const [keyword, coords] of Object.entries(MOUNTAIN_COORDS)) {
        if (name.includes(keyword)) return coords;
    }
    return null;
};


