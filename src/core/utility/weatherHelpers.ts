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
 * Rounded to nearest integer to align with official threshold tables.
 */
export const getPAGASAHeatIndexInfo = (heatIndex: number | undefined | null): {
    category: string;
    description: string;
    alertLevel: 'normal' | 'warning' | 'danger';
} => {
    if (heatIndex == null || isNaN(heatIndex)) {
        return { category: 'Comfortable', description: 'Normal trail conditions.', alertLevel: 'normal' };
    }
    const val = Math.round(heatIndex);
    if (val < 27) {
        return { category: 'Comfortable', description: 'Optimal hiking temperature.', alertLevel: 'normal' };
    }
    if (val <= 32) {
        return { category: 'Caution', description: 'Fatigue possible with prolonged trail activity.', alertLevel: 'normal' };
    }
    if (val <= 41) {
        return { category: 'Extreme Caution', description: 'Heat cramps & exhaustion possible. Carry 2.5L+ water.', alertLevel: 'warning' };
    }
    if (val <= 51) {
        return { category: 'Danger (Heat Stroke Risk)', description: 'Heat exhaustion likely. Avoid midday exposed ridges.', alertLevel: 'danger' };
    }
    return { category: 'Extreme Danger', description: 'Heat stroke imminent. Halt high-altitude outdoor exertion.', alertLevel: 'danger' };
};

/**
 * Classifies precipitation into PAGASA Heavy Rainfall Warning tiers.
 * 
 * Official PAGASA Heavy Rainfall Warning System:
 * - RED WARNING: Torrential rainfall (> 30 mm/hr, or 24h total >= 100 mm, or severe storm WMO 65, 96, 99).
 * - ORANGE WARNING: Intense rainfall (15 - 30 mm/hr, or 24h total 50 - 99 mm).
 * - YELLOW WARNING: Heavy rainfall (7.5 - 15 mm/hr, or 24h total 25 - 49 mm, or thunderstorm WMO 95).
 * - LIGHT / MODERATE / PASSING SHOWERS: Normal tropical rain (< 7.5 mm/hr, or 24h total < 25 mm).
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
    const isSevereStorm = [65, 75, 82, 85, 86, 96, 99].includes(weatherCode);
    const isThunderstorm = weatherCode === 95;

    // 1. RED WARNING: Torrential rain (Severe storm WMO code or 24h total >= 100 mm)
    if (isSevereStorm || accumulatedMm >= 100) {
        return {
            warningLevel: 'RED',
            badge: 'PAGASA Red Warning',
            description: 'Torrential rain & severe storm hazard. Swollen rivers & mudslides.',
            alertLevel: 'danger',
        };
    }

    // 2. ORANGE WARNING: Intense rainfall (24h total 50 - 99 mm)
    if (accumulatedMm >= 50) {
        return {
            warningLevel: 'ORANGE',
            badge: 'PAGASA Orange Alert',
            description: 'Intense rain. Flooding threatening low-lying trails & river crossings.',
            alertLevel: 'danger',
        };
    }

    // 3. YELLOW WARNING: Heavy rainfall (24h total 25 - 49 mm or thunderstorm)
    if (accumulatedMm >= 25 || isThunderstorm) {
        return {
            warningLevel: 'YELLOW',
            badge: 'PAGASA Yellow Advisory',
            description: 'Heavy rain & lightning risk. Trails are slick; exercise caution.',
            alertLevel: 'warning',
        };
    }

    // 4. LIGHT / MODERATE / PASSING SHOWERS (< 25 mm daily accumulation)
    if (prob >= 60 || accumulatedMm >= 8) {
        return {
            warningLevel: 'NORMAL',
            badge: 'Rain Likely',
            description: 'Passing or scattered showers expected. Trails may be slippery.',
            alertLevel: 'warning',
        };
    }

    if (prob >= 30 || accumulatedMm > 0) {
        return {
            warningLevel: 'NORMAL',
            badge: '🌦️ Passing Showers',
            description: 'Light scattered rain possible. Bring light rain gear.',
            alertLevel: 'normal',
        };
    }

    return {
        warningLevel: 'NORMAL',
        badge: 'Fair Conditions',
        description: 'Light or no rain. Favorable hiking conditions.',
        alertLevel: 'normal',
    };
};

/**
 * Formats wind metrics using official PAGASA Wind Descriptions (Beaufort & Saffir-Simpson Scales).
 * 
 * PAGASA Wind Scale:
 * - Light Winds: <= 19 km/h (Wind felt on face, leaves rustle)
 * - Moderate Winds: 20 - 29 km/h (Wind raises dust, small branches moved)
 * - Fresh Winds: 30 - 39 km/h (Small trees in leaf begin to sway)
 * - Strong Winds: 40 - 50 km/h (Large branches in motion, umbrellas used with difficulty)
 * - Near Gale: 51 - 62 km/h (Whole trees in motion, walking inconvenience)
 * - Gale: 63 - 75 km/h (Twigs break off, hazardous on ridges)
 * - Strong Gale: 76 - 87 km/h (Larger branches break off, structural damage)
 * - Storm / Violent Storm: 88 - 117 km/h (Trees uprooted, widespread damage)
 * - Typhoon: >= 118 km/h (Severe destruction)
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
    observedDescription: string;
} => {
    const directionText = getWindDirection(directionDeg);
    const effectiveSpeed = Math.round(speedKmH);
    const effectiveGusts = Math.round(gustsKmH);

    // Gust description following PAGASA definition (brief sudden increase < 20s)
    let gustText = 'Steady breeze';
    if (effectiveGusts > effectiveSpeed + 5) {
        if (effectiveGusts >= 63) {
            gustText = `Gale Gusts (${effectiveGusts} km/h)`;
        } else if (effectiveGusts >= 40) {
            gustText = `Strong Gusts (${effectiveGusts} km/h)`;
        } else {
            gustText = `Gusts up to ${effectiveGusts} km/h`;
        }
    }

    if (effectiveSpeed >= 118 || effectiveGusts >= 130) {
        return {
            scale: 'Typhoon Force',
            gustText,
            directionText,
            alertLevel: 'danger',
            observedDescription: 'Severe destructive winds. Halt all outdoor activity.',
        };
    }
    if (effectiveSpeed >= 88 || effectiveGusts >= 103) {
        return {
            scale: 'Storm Force',
            gustText,
            directionText,
            alertLevel: 'danger',
            observedDescription: 'Trees uprooted, considerable structural hazard.',
        };
    }
    if (effectiveSpeed >= 76 || effectiveGusts >= 88) {
        return {
            scale: 'Strong Gale',
            gustText,
            directionText,
            alertLevel: 'danger',
            observedDescription: 'Large branches break off. Extremely dangerous on ridges.',
        };
    }
    if (effectiveSpeed >= 63 || effectiveGusts >= 75) {
        return {
            scale: 'Gale Winds',
            gustText,
            directionText,
            alertLevel: 'danger',
            observedDescription: 'Twigs break off trees. High risk on exposed summits.',
        };
    }
    if (effectiveSpeed >= 51 || effectiveGusts >= 63) {
        return {
            scale: 'Near Gale',
            gustText,
            directionText,
            alertLevel: 'warning',
            observedDescription: 'Whole trees in motion. Inconvenience walking against wind.',
        };
    }
    if (effectiveSpeed >= 40 || effectiveGusts >= 50) {
        return {
            scale: 'Strong Winds',
            gustText,
            directionText,
            alertLevel: 'warning',
            observedDescription: 'Large branches in motion. Difficult walking conditions.',
        };
    }
    if (effectiveSpeed >= 30) {
        return {
            scale: 'Fresh Winds',
            gustText,
            directionText,
            alertLevel: 'normal',
            observedDescription: 'Small trees in leaf begin to sway.',
        };
    }
    if (effectiveSpeed >= 20) {
        return {
            scale: 'Moderate Winds',
            gustText,
            directionText,
            alertLevel: 'normal',
            observedDescription: 'Small branches moved. Dust and loose debris raised.',
        };
    }
    return {
        scale: 'Light Winds',
        gustText,
        directionText,
        alertLevel: 'normal',
        observedDescription: 'Wind felt on face. Leaves rustle gently.',
    };
};

/**
 * Maps cloud cover percentage to official PAGASA Sky Condition terminology (Oktas).
 * From PAGASA Weather Terminologies:
 * - Clear or Sunny Skies: < 1 okta (< 20% cloud cover)
 * - Partly Cloudy: 2-5 oktas (20% - 70% cloud cover)
 * - Mostly Cloudy: 6-8 oktas (71% - 85% cloud cover)
 * - Cloudy: > 70% predominantly clouds (86% - 95% cloud cover)
 * - Overcast: 8 oktas (~100% thick opaque clouds)
 */
export const getPAGASASkyCondition = (cloudCoverPercent: number = 0): string => {
    if (cloudCoverPercent < 20) return 'Clear Skies';
    if (cloudCoverPercent <= 70) return 'Partly Cloudy';
    if (cloudCoverPercent <= 85) return 'Mostly Cloudy';
    if (cloudCoverPercent < 95) return 'Cloudy';
    return 'Overcast';
};

/**
 * Formats mountain summit visibility and cloud coverage aligned with PAGASA & WMO standards.
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
    const skyCondition = getPAGASASkyCondition(cloudCoverPercent);
    const cloudText = `${Math.round(cloudCoverPercent)}% • ${skyCondition}`;

    if (visibilityMeters < 2000) {
        return {
            visibilityKm: `${km} km`,
            cloudText,
            description: 'Dense fog & poor summit visibility. Stay strictly on marked trails.',
            alertLevel: 'danger',
        };
    }
    if (visibilityMeters < 6000 || cloudCoverPercent >= 90) {
        return {
            visibilityKm: `${km} km`,
            cloudText,
            description: cloudCoverPercent >= 90 
                ? 'Overcast cloud ceiling obscuring summit views.' 
                : 'Hazy with reduced view distance along ridgelines.',
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
    const { windSpeed, windGusts, precipitationProbability, precipitationSum, weatherCode, apparentTemperature, temperature } = data;
    
    // Severe weather conditions: Torrential downpours, squalls, severe thunderstorm with hail
    const isSevereWeather = [65, 75, 82, 85, 86, 95, 96, 99].includes(weatherCode);
    const effectiveGusts = windGusts || windSpeed || 0;
    const heatIndex = Math.round(apparentTemperature ?? temperature ?? 0);

    // DANGER: True life-safety hazards (severe storms, gale-force winds >= 60 km/h, torrential floods >= 100mm, heat stroke >= 42°C)
    if (
        isSevereWeather || 
        windSpeed >= 60 || 
        effectiveGusts >= 75 || 
        (precipitationSum != null && precipitationSum >= 100) ||
        heatIndex >= 42
    ) {
        return "DANGER";
    }

    // CAUTION: Active rain showers, wet slippery trails, strong breeze on ridges, heat advisory 33-41°C
    const isRain = (precipitationProbability != null && precipitationProbability >= 50) || 
                   (precipitationSum != null && precipitationSum >= 10) || 
                   (weatherCode >= 51 && weatherCode <= 67) || 
                   (weatherCode >= 80 && weatherCode <= 82) ||
                   weatherCode === 95;
    const isWindy = windSpeed >= 40 || effectiveGusts >= 50;
    const isHeatAdvisory = heatIndex >= 33 && heatIndex < 42;

    if (isRain || isWindy || isHeatAdvisory) {
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
        precipitationSum,
        uvIndex,
        uvIndexMax,
        visibility,
        cloudCover,
        apparentTemperature,
        temperature,
    } = data;

    const precipChance = precipitationProbability ?? 0;
    const dailyRainMm = precipitationSum ?? 0;
    const effectiveGusts = windGusts || windSpeed || 0;
    const currentUv = uvIndex != null ? Math.round(uvIndex) : 0;
    const peakUv = uvIndexMax != null ? Math.round(uvIndexMax) : currentUv;
    const heatIndex = Math.round(apparentTemperature ?? temperature ?? 0);

    const isTorrentialCode = [65, 75, 82, 85, 86, 96, 99].includes(weatherCode);
    const isThunderstorm = weatherCode === 95;
    const isRainCode = (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82);
    const isFogCode = weatherCode === 45 || weatherCode === 48 || (visibility != null && visibility < 2000);
    const isCloudyOrRainy = (cloudCover != null && cloudCover >= 70) || isRainCode || isThunderstorm || isTorrentialCode;

    // 1. Rain Risk Level
    let rainRiskLevel: 'low' | 'moderate' | 'high' | 'severe' = 'low';
    if (isTorrentialCode || dailyRainMm >= 50) {
        rainRiskLevel = 'severe';
    } else if (isThunderstorm || dailyRainMm >= 25) {
        rainRiskLevel = 'high';
    } else if (precipChance >= 50 || dailyRainMm >= 8 || isRainCode) {
        rainRiskLevel = 'moderate';
    } else if (precipChance >= 30) {
        rainRiskLevel = 'low';
    }

    // 2. Wind Risk Level
    let windRiskLevel: 'low' | 'moderate' | 'high' = 'low';
    if (windSpeed >= 60 || effectiveGusts >= 75) {
        windRiskLevel = 'high';
    } else if (windSpeed >= 40 || effectiveGusts >= 55) {
        windRiskLevel = 'moderate';
    }

    // 3. UV Risk Level (Only flag active sunburn risk if skies are not overcast/raining)
    let uvRiskLevel: 'low' | 'moderate' | 'high' | 'extreme' = 'low';
    if (!isCloudyOrRainy) {
        if (currentUv >= 11) {
            uvRiskLevel = 'extreme';
        } else if (currentUv >= 8) {
            uvRiskLevel = 'high';
        } else if (currentUv >= 6) {
            uvRiskLevel = 'moderate';
        }
    }

    // 4. Heat Risk
    const isDangerousHeat = heatIndex >= 42;
    const isCautionHeat = heatIndex >= 33 && heatIndex < 42;

    // 5. Overall Safety Status
    let status: HikingSafetyStatus = "SAFE";
    if (rainRiskLevel === 'severe' || windRiskLevel === 'high' || isDangerousHeat) {
        status = "DANGER";
    } else if (
        rainRiskLevel === 'high' || 
        rainRiskLevel === 'moderate' || 
        windRiskLevel === 'moderate' || 
        uvRiskLevel === 'extreme' || 
        uvRiskLevel === 'high' ||
        isCautionHeat
    ) {
        status = "CAUTION";
    }

    // 6. Key Risks
    const keyRisks: string[] = [];
    if (rainRiskLevel === 'severe') {
        keyRisks.push('Torrential downpour and potential flash floods');
        if (weatherCode >= 95) keyRisks.push('Severe thunderstorm and lightning hazards on exposed peaks');
    } else if (rainRiskLevel === 'high') {
        keyRisks.push(`Heavy rain expected (${precipChance}%) with slippery, waterlogged trails`);
        if (isThunderstorm) keyRisks.push('Thunderstorm & lightning hazard on high ridgelines');
    } else if (rainRiskLevel === 'moderate') {
        keyRisks.push(`Rain expected (${precipChance}%) with slippery, muddy trails`);
    }

    if (windRiskLevel === 'high') {
        keyRisks.push(`Severe wind gusts up to ${Math.round(effectiveGusts)} km/h on open ridges`);
    } else if (windRiskLevel === 'moderate') {
        keyRisks.push(`Gusty winds up to ${Math.round(effectiveGusts)} km/h`);
    }

    if (isDangerousHeat) {
        keyRisks.push(`Extreme Heat Index (${heatIndex}°C) - Heat stroke risk during midday`);
    } else if (isCautionHeat) {
        keyRisks.push(`High Heat Index (${heatIndex}°C) - Heat cramps and fatigue possible`);
    }

    if (uvRiskLevel === 'extreme') {
        keyRisks.push(`Extreme UV Index (${currentUv}) - Severe sunburn & heat exhaustion risk`);
    } else if (uvRiskLevel === 'high') {
        keyRisks.push(`High UV Index (${currentUv}) - Sunburn risk on exposed ridges`);
    }

    if (isFogCode) {
        keyRisks.push('Low visibility and dense mountain fog on higher elevations');
    }

    // 7. Actionable Checklist
    const checklist: WeatherSafetyChecklistItem[] = [];

    // Rain / Wet ground items
    if (rainRiskLevel === 'severe' || rainRiskLevel === 'high' || rainRiskLevel === 'moderate') {
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
            label: 'Avoid exposed ridges & summits during lightning or torrential squalls',
            category: 'safety',
            icon: 'flash-outline',
            library: 'Ionicons',
        });
    }

    // Sun & Hydration items
    if (!isCloudyOrRainy && (uvRiskLevel === 'extreme' || uvRiskLevel === 'high' || peakUv >= 8)) {
        checklist.push({
            id: 'sun-protection',
            label: 'Apply SPF 50+ sunscreen, wear wide-brim hat & arm sleeves',
            category: 'gear',
            icon: 'sunny-outline',
            library: 'Ionicons',
        });
    }

    if (isDangerousHeat || isCautionHeat) {
        checklist.push({
            id: 'extra-water',
            label: 'Carry 2.5L – 3L drinking water with electrolyte salts',
            category: 'hydration',
            icon: 'water-outline',
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

    // 8. Headline & Description
    const targetLabel = locationOrTrailName ? locationOrTrailName : 'Your Destination';
    let badgeText = 'SAFE CONDITIONS';
    let headline = `Favorable Conditions for ${targetLabel}`;
    let description = `Weather conditions are optimal for outdoor activities. Standard hiking preparation is advised.`;

    if (status === 'DANGER') {
        badgeText = 'WEATHER HAZARD';
        headline = `Severe Weather Alert for ${targetLabel}`;
        description = isTorrentialCode || isThunderstorm
            ? `Thunderstorms or heavy downpours are forecast. Check with local guides or organizers before proceeding.`
            : `Severe wind gusts or extreme weather conditions make trails hazardous. Exercise utmost caution.`;
    } else if (status === 'CAUTION') {
        badgeText = 'WEATHER ADVISORY';
        headline = rainRiskLevel === 'high' || rainRiskLevel === 'moderate'
            ? `Rain Expected at ${targetLabel} (${precipChance}% chance)`
            : isCautionHeat
            ? `Warm Weather Advisory for ${targetLabel}`
            : `Weather Advisory for ${targetLabel}`;
        description = rainRiskLevel === 'high' || rainRiskLevel === 'moderate'
            ? `Wet weather is anticipated. Trails may be muddy and slippery. Prepare waterproof gear before departing.`
            : isCautionHeat
            ? `Elevated heat index (${heatIndex}°C). Take frequent rests in shaded areas and maintain hydration.`
            : `Windy or changing mountain conditions expected. Take appropriate trail precautions.`;
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
        uvIndex: currentUv,
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


