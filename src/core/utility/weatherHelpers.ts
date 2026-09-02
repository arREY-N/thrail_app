import {
    DailyForecast,
    DetailedWeatherSafetyReport,
    HikingSafetyStatus,
    HourlyForecastItem,
    ProcessedWeatherData,
    WeatherSafetyChecklistItem,
} from "../types/weather";

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

/**
 * Categorizes Heat Index (°C) based on official PAGASA classification standards.
 */
export const getPAGASAHeatIndexInfo = (heatIndex: number | undefined | null): {
    category: string;
    description: string;
    alertLevel: 'normal' | 'warning' | 'danger';
} => {
    if (heatIndex == null || isNaN(heatIndex)) {
        return { category: 'Comfortable', description: 'Normal trail conditions.', alertLevel: 'normal' };
    }
    if (heatIndex < 27) {
        return { category: 'Comfortable', description: 'Optimal hiking temperature.', alertLevel: 'normal' };
    }
    if (heatIndex <= 32) {
        return { category: 'Caution', description: 'Fatigue possible with prolonged trail activity.', alertLevel: 'normal' };
    }
    if (heatIndex <= 41) {
        return { category: 'Extreme Caution', description: 'Heat cramps & exhaustion possible. Carry 2.5L+ water.', alertLevel: 'warning' };
    }
    if (heatIndex <= 51) {
        return { category: 'Danger (Heat Stroke Risk)', description: 'Heat exhaustion likely. Avoid midday exposed ridges.', alertLevel: 'danger' };
    }
    return { category: 'Extreme Danger', description: 'Heat stroke imminent. Halt high-altitude outdoor exertion.', alertLevel: 'danger' };
};

/**
 * Classifies precipitation into PAGASA Heavy Rainfall Warning tiers.
 */
export const getPAGASARainfallWarning = (
    prob: number = 0,
    accumulatedMm: number = 0,
    weatherCode: number = 0
): {
    warningLevel: 'NORMAL' | 'YELLOW' | 'ORANGE' | 'RED';
    badge: string;
    description: string;
    alertLevel: 'normal' | 'warning' | 'danger';
} => {
    const isSevereStorm = [65, 75, 82, 85, 86, 95, 96, 99].includes(weatherCode);

    if (isSevereStorm || accumulatedMm >= 15 || prob >= 85) {
        return {
            warningLevel: 'RED',
            badge: '🔴 PAGASA Red Warning',
            description: 'Torrential rain & thunderstorm hazard. Swollen rivers & mudslides.',
            alertLevel: 'danger',
        };
    }
    if (accumulatedMm >= 7.5 || prob >= 70) {
        return {
            warningLevel: 'ORANGE',
            badge: '🟠 PAGASA Orange Alert',
            description: 'Intense rain. Flash flood & slippery trail hazard.',
            alertLevel: 'danger',
        };
    }
    if (accumulatedMm >= 2.5 || prob >= 40) {
        return {
            warningLevel: 'YELLOW',
            badge: '🟡 PAGASA Yellow Advisory',
            description: 'Moderate rain expected. Trails are muddy and slick.',
            alertLevel: 'warning',
        };
    }
    return {
        warningLevel: 'NORMAL',
        badge: '🟢 Fair Conditions',
        description: 'Light/No rain. Favorable hiking conditions.',
        alertLevel: 'normal',
    };
};

/**
 * Formats wind metrics with Beaufort scale rating and gust analysis.
 */
export const getBeaufortWindInfo = (
    speedKmH: number = 0,
    gustsKmH: number = 0,
    directionDeg: number = 0
): {
    scale: string;
    gustText: string;
    directionText: string;
    alertLevel: 'normal' | 'warning' | 'danger';
} => {
    const directionText = getWindDirection(directionDeg);
    const gustText = gustsKmH > speedKmH ? `Gusts up to ${Math.round(gustsKmH)} km/h` : 'Steady breeze';

    if (speedKmH >= 60 || gustsKmH >= 75) {
        return {
            scale: 'Gale / Storm Force',
            gustText,
            directionText,
            alertLevel: 'danger',
        };
    }
    if (speedKmH >= 40 || gustsKmH >= 50) {
        return {
            scale: 'Strong Breeze',
            gustText,
            directionText,
            alertLevel: 'warning',
        };
    }
    if (speedKmH >= 20) {
        return {
            scale: 'Moderate Breeze',
            gustText,
            directionText,
            alertLevel: 'normal',
        };
    }
    return {
        scale: 'Gentle Breeze',
        gustText,
        directionText,
        alertLevel: 'normal',
    };
};

/**
 * Formats mountain summit visibility and cloud coverage.
 */
export const getSummitVisibilityInfo = (
    visibilityMeters: number = 10000,
    cloudCoverPercent: number = 0
): {
    visibilityKm: string;
    cloudText: string;
    description: string;
    alertLevel: 'normal' | 'warning' | 'danger';
} => {
    const km = (visibilityMeters / 1000).toFixed(1);
    const cloudText = `${Math.round(cloudCoverPercent)}% Cover`;

    if (visibilityMeters < 2000) {
        return {
            visibilityKm: `${km} km`,
            cloudText,
            description: 'Dense fog & poor summit visibility. Stay strictly on marked trails.',
            alertLevel: 'danger',
        };
    }
    if (visibilityMeters < 6000 || cloudCoverPercent >= 80) {
        return {
            visibilityKm: `${km} km`,
            cloudText,
            description: 'Overcast & hazy. Moderate view distance.',
            alertLevel: 'warning',
        };
    }
    return {
        visibilityKm: `${km} km`,
        cloudText,
        description: 'Clear summit visibility and optimal scenic views.',
        alertLevel: 'normal',
    };
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

/**
 * Generates an actionable, detailed safety advisory report based on weather metrics.
 * Converts raw weather conditions into tailored trail advice and dynamic gear checklists.
 *
 * @param data - The processed weather data (can be null/undefined)
 * @param locationOrTrailName - Optional mountain or location name for personalized headlines
 * @returns Comprehensive safety report with status, risks, and checklist
 */
export const getDetailedWeatherSafety = (
    data: ProcessedWeatherData | null | undefined,
    locationOrTrailName?: string
): DetailedWeatherSafetyReport => {
    if (!data) {
        return {
            status: "SAFE",
            badgeText: "CHECKING CONDITIONS",
            headline: "Checking weather conditions...",
            description: "Fetching the latest meteorological data for this trail.",
            keyRisks: [],
            checklist: [
                { id: 'hydration-default', label: 'Carry sufficient drinking water (1.5L - 2L)', category: 'hydration', icon: 'water-outline', library: 'Ionicons' },
                { id: 'first-aid-default', label: 'Pack trail snacks and personal first-aid kit', category: 'safety', icon: 'medkit-outline', library: 'Ionicons' },
            ],
            rainRiskLevel: 'low',
            windRiskLevel: 'low',
            uvRiskLevel: 'low',
            precipitationChance: 0,
            windSpeed: 0,
            uvIndex: 0,
        };
    }

    const {
        weatherCode,
        windSpeed,
        windGusts,
        precipitationProbability,
        uvIndex,
        uvIndexMax,
        visibility,
    } = data;

    const precipChance = precipitationProbability ?? 0;
    const effectiveUv = uvIndexMax || uvIndex || 0;
    const effectiveGusts = windGusts || windSpeed || 0;

    const isSevereCode = [65, 75, 82, 85, 86, 95, 96, 99].includes(weatherCode);
    const isRainCode = (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82);
    const isFogCode = weatherCode === 45 || weatherCode === 48 || (visibility != null && visibility < 2000);

    // 1. Rain Risk Level
    let rainRiskLevel: 'low' | 'moderate' | 'high' | 'severe' = 'low';
    if (isSevereCode || precipChance >= 75) {
        rainRiskLevel = 'severe';
    } else if (precipChance >= 50 || isRainCode) {
        rainRiskLevel = 'high';
    } else if (precipChance >= 30) {
        rainRiskLevel = 'moderate';
    }

    // 2. Wind Risk Level
    let windRiskLevel: 'low' | 'moderate' | 'high' = 'low';
    if (windSpeed >= 60 || effectiveGusts >= 70) {
        windRiskLevel = 'high';
    } else if (windSpeed >= 40 || effectiveGusts >= 50) {
        windRiskLevel = 'moderate';
    }

    // 3. UV Risk Level
    let uvRiskLevel: 'low' | 'moderate' | 'high' | 'extreme' = 'low';
    if (effectiveUv >= 11) {
        uvRiskLevel = 'extreme';
    } else if (effectiveUv >= 8) {
        uvRiskLevel = 'high';
    } else if (effectiveUv >= 6) {
        uvRiskLevel = 'moderate';
    }

    // 4. Overall Safety Status
    let status: HikingSafetyStatus = "SAFE";
    if (rainRiskLevel === 'severe' || windRiskLevel === 'high' || effectiveUv >= 13) {
        status = "DANGER";
    } else if (rainRiskLevel === 'high' || rainRiskLevel === 'moderate' || windRiskLevel === 'moderate' || uvRiskLevel === 'extreme' || uvRiskLevel === 'high') {
        status = "CAUTION";
    }

    // 5. Key Risks
    const keyRisks: string[] = [];
    if (rainRiskLevel === 'severe') {
        keyRisks.push('Torrential downpour and potential flash floods');
        if (weatherCode >= 95) keyRisks.push('Severe thunderstorm and lightning hazards on exposed peaks');
    } else if (rainRiskLevel === 'high' || rainRiskLevel === 'moderate') {
        keyRisks.push(`High chance of rain (${precipChance}%) with slippery, muddy trails`);
    }

    if (windRiskLevel === 'high') {
        keyRisks.push(`High wind gusts up to ${Math.round(effectiveGusts)} km/h on open ridges`);
    } else if (windRiskLevel === 'moderate') {
        keyRisks.push(`Breezy to gusty winds (${Math.round(windSpeed)} km/h)`);
    }

    if (uvRiskLevel === 'extreme') {
        keyRisks.push(`Extreme UV Index (Peak ${Math.round(effectiveUv)}) - Severe heat exhaustion risk`);
    } else if (uvRiskLevel === 'high') {
        keyRisks.push(`High UV Index (Peak ${Math.round(effectiveUv)}) - Sunburn risk`);
    }

    if (isFogCode) {
        keyRisks.push('Low visibility and dense fog on higher elevations');
    }

    // 6. Actionable Checklist
    const checklist: WeatherSafetyChecklistItem[] = [];

    // Rain / Wet ground items
    if (rainRiskLevel === 'severe' || rainRiskLevel === 'high') {
        checklist.push({
            id: 'waterproof-cover',
            label: 'Pack waterproof backpack rain cover & dry bags',
            category: 'gear',
            icon: 'bag-personal-outline',
            library: 'MaterialCommunityIcons',
        });
        checklist.push({
            id: 'rainwear',
            label: 'Bring a lightweight rain jacket or durable poncho',
            category: 'gear',
            icon: 'weather-pouring',
            library: 'MaterialCommunityIcons',
        });
        checklist.push({
            id: 'traction-shoes',
            label: 'Wear high-traction trail shoes with deep lugs for mud',
            category: 'gear',
            icon: 'shoe-sneaker',
            library: 'MaterialCommunityIcons',
        });
        checklist.push({
            id: 'trekking-pole',
            label: 'Trekking poles recommended for slippery descents',
            category: 'gear',
            icon: 'walk',
            library: 'Ionicons',
        });
    } else if (rainRiskLevel === 'moderate') {
        checklist.push({
            id: 'light-rainwear',
            label: 'Keep an emergency rain poncho handy in your pack',
            category: 'gear',
            icon: 'weather-rainy',
            library: 'MaterialCommunityIcons',
        });
    }

    // Storm / Severe safety items
    if (status === 'DANGER') {
        checklist.push({
            id: 'guide-consult',
            label: 'Consult with tour guide or LGU desk before starting',
            category: 'advisory',
            icon: 'shield-alert-outline',
            library: 'MaterialCommunityIcons',
        });
        checklist.push({
            id: 'ridge-safety',
            label: 'Avoid exposed ridges & summits during lightning',
            category: 'safety',
            icon: 'flash-outline',
            library: 'Ionicons',
        });
    }

    // Sun & Hydration items
    if (uvRiskLevel === 'extreme' || uvRiskLevel === 'high') {
        checklist.push({
            id: 'extra-water',
            label: 'Carry 2.5L – 3L drinking water with electrolyte salts',
            category: 'hydration',
            icon: 'water-outline',
            library: 'Ionicons',
        });
        checklist.push({
            id: 'sun-protection',
            label: 'Apply SPF 50+ sunscreen, wear wide-brim hat & arm sleeves',
            category: 'gear',
            icon: 'sunny-outline',
            library: 'Ionicons',
        });
    } else {
        checklist.push({
            id: 'normal-water',
            label: 'Carry at least 1.5L – 2L of water for the hike',
            category: 'hydration',
            icon: 'water-outline',
            library: 'Ionicons',
        });
    }

    // Default trail essentials
    checklist.push({
        id: 'phone-battery',
        label: 'Ensure phone is fully charged & sealed in waterproof pouch',
        category: 'safety',
        icon: 'battery-charging-outline',
        library: 'Ionicons',
    });

    // 7. Headline & Description
    const targetLabel = locationOrTrailName ? locationOrTrailName : 'Your Destination';
    let badgeText = 'SAFE CONDITIONS';
    let headline = `Favorable Conditions for ${targetLabel}`;
    let description = `Weather conditions are optimal for outdoor activities. Standard hiking preparation is advised.`;

    if (status === 'DANGER') {
        badgeText = 'WEATHER HAZARD';
        headline = `Severe Weather Alert for ${targetLabel}`;
        description = isSevereCode 
            ? `Thunderstorms and heavy downpours are forecast. Check with local guides or organizers for possible advisories.`
            : `High wind gusts (${Math.round(windSpeed)} km/h) or extreme rainfall make trail conditions hazardous.`;
    } else if (status === 'CAUTION') {
        badgeText = 'WEATHER ADVISORY';
        headline = rainRiskLevel === 'high' || rainRiskLevel === 'moderate'
            ? `Rain Expected at ${targetLabel} (${precipChance}% chance)`
            : `Weather Advisory for ${targetLabel}`;
        description = rainRiskLevel === 'high' || rainRiskLevel === 'moderate'
            ? `Wet weather is anticipated. Trails may be muddy and slippery. Prepare waterproof gear before departing.`
            : `Heightened UV index or windy conditions expected. Take appropriate sun protection and hydration precautions.`;
    }

    return {
        status,
        badgeText,
        headline,
        description,
        keyRisks,
        checklist,
        rainRiskLevel,
        windRiskLevel,
        uvRiskLevel,
        precipitationChance: precipChance,
        windSpeed,
        uvIndex: effectiveUv,
    };
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

/**
 * Retrieves the 24-hour hourly forecast for a selected day.
 * If live hourly forecast data is present, filters by day.
 * Otherwise, generates a smooth 24-hour projection curve using the day's high, low, code, and rain probability.
 */
export const getHourlyForecastForDay = (
    weatherData: ProcessedWeatherData | null | undefined,
    selectedDayIndex: number = 0
): HourlyForecastItem[] => {
    if (!weatherData) return [];

    const activeDay = weatherData.forecast?.at(selectedDayIndex) ?? weatherData.forecast?.at(0);
    const targetDate = activeDay?.date ? activeDay.date.slice(0, 10) : "";

    // 1. If real hourly forecast exists in weatherData, filter for this day
    if (weatherData.hourlyForecast && weatherData.hourlyForecast.length > 0) {
        const filtered = targetDate 
            ? weatherData.hourlyForecast.filter(h => h.datePrefix === targetDate || h.time.startsWith(targetDate))
            : [];
        if (filtered.length > 0) return filtered;

        // If filtering by date string didn't match directly, slice by 24h chunk
        const startIdx = selectedDayIndex * 24;
        const chunk = weatherData.hourlyForecast.slice(startIdx, startIdx + 24);
        if (chunk.length > 0) return chunk;
    }

    // 2. Resilient fallback generator: if cached data hasn't refreshed or API omitted hourly
    const high = activeDay?.temperatureMax ?? (weatherData.temperature ? weatherData.temperature + 3 : 30);
    const low = activeDay?.temperatureMin ?? (weatherData.temperature ? weatherData.temperature - 3 : 24);
    const code = activeDay?.weatherCode ?? weatherData.weatherCode ?? 0;
    const precipMax = activeDay?.precipitationProbabilityMax ?? weatherData.precipitationProbability ?? 0;
    const currentHour = new Date().getHours();
    const isToday = selectedDayIndex === 0;

    const items: HourlyForecastItem[] = [];
    for (let h = 0; h < 24; h++) {
        // Temperature diurnal curve: lowest around 5 AM, highest around 2 PM
        const tempRad = ((h - 5) / 24) * 2 * Math.PI;
        const normalized = 0.5 * (1 - Math.cos(tempRad));
        const hourTemp = Math.round(low + (high - low) * normalized);

        // Afternoon rain peak (tropical convective pattern)
        const rainFactor = (h >= 12 && h <= 18) ? 1.0 : (h >= 6 && h <= 21 ? 0.7 : 0.3);
        const hourPrecip = Math.round(precipMax * rainFactor);

        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        const hourLabel = (isToday && h === currentHour) ? 'Now' : `${displayH} ${ampm}`;

        items.push({
            time: `${targetDate || '2026-09-03'}T${h < 10 ? '0' + h : h}:00`,
            datePrefix: targetDate,
            hourLabel,
            temperature: hourTemp,
            apparentTemperature: hourTemp + (hourTemp > 28 ? 2 : 0),
            weatherCode: code,
            precipitationProbability: hourPrecip,
            windSpeed: activeDay?.windSpeedMax ?? weatherData.windSpeed ?? 15,
            uvIndex: (h >= 10 && h <= 15) ? (activeDay?.uvIndexMax ?? 8) : 0,
        });
    }

    return items;
};


