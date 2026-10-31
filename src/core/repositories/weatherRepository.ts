// FILE: src/core/repositories/weatherRepository.ts
// ACTION: UPDATE
// REASON: Refactoring the dummy weather repo to implement actual Open-Meteo API fetching with AsyncStorage caching.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProcessedWeatherData, WeatherApiResponse } from "../types/weather";

const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export const generateWeatherCacheKey = (lat: number, lon: number, elevation?: number): string => {
  const roundLat = lat.toFixed(2);
  const roundLon = lon.toFixed(2);
  return elevation && elevation > 0
    ? `weather_${roundLat}_${roundLon}_e${Math.round(elevation)}`
    : `weather_${roundLat}_${roundLon}`;
};

export const fetchWeatherFromApi = async (
  lat: number,
  lon: number,
  elevation?: number,
): Promise<ProcessedWeatherData> => {
  const CACHE_KEY = generateWeatherCacheKey(lat, lon, elevation);

  const cachedData = await AsyncStorage.getItem(CACHE_KEY);
  const now = Date.now();

  if (cachedData) {
    try {
      const { data, timestamp } = JSON.parse(cachedData);
      if (
        data &&
        Array.isArray(data.hourlyForecast) &&
        data.hourlyForecast.length > 0 &&
        now - timestamp < CACHE_EXPIRY_MS
      ) {
        return { ...data, isStale: false };
      }
    } catch {
      // Invalid cache entry, refetch
    }
  }

  try {
    const roundLat = lat.toFixed(4);
    const roundLon = lon.toFixed(4);
    const elevParam = typeof elevation === 'number' && elevation > 0 ? `&elevation=${Math.round(elevation)}` : '';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${roundLat}&longitude=${roundLon}${elevParam}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&hourly=temperature_2m,precipitation_probability,wind_speed_10m,wind_direction_10m,relative_humidity_2m,weather_code,apparent_temperature,visibility,wind_gusts_10m,uv_index&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset,weather_code,precipitation_probability_max,wind_gusts_10m_max&timezone=Asia/Manila&forecast_days=7&models=best_match`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const rawData: WeatherApiResponse = await response.json();

    // Transform the raw data
    const currentHourIndex = rawData.hourly.time.findIndex((t) =>
      t.startsWith(rawData.current.time.slice(0, 13)),
    );
    const hIdx = currentHourIndex !== -1 ? currentHourIndex : 0;
    const formatHourLabel = (timeStr: string, isCurrentHour: boolean): string => {
      if (isCurrentHour) return "Now";
      const parts = timeStr.split("T");
      if (parts.length < 2) return timeStr;
      const [h] = parts[1].split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${displayH} ${ampm}`;
    };

    const hourlyForecast = (rawData.hourly.time || []).map((t, idx) => ({
      time: t,
      datePrefix: t.slice(0, 10),
      hourLabel: formatHourLabel(t, idx === hIdx),
      temperature: Math.round(rawData.hourly.temperature_2m?.at(idx) ?? 0),
      apparentTemperature: Math.round(rawData.hourly.apparent_temperature?.at(idx) ?? 0),
      weatherCode: rawData.hourly.weather_code?.at(idx) ?? rawData.hourly.weathercode?.at(idx) ?? 0,
      precipitationProbability: rawData.hourly.precipitation_probability?.at(idx) ?? 0,
      windSpeed: Math.round(rawData.hourly.wind_speed_10m?.at(idx) ?? rawData.hourly.windspeed_10m?.at(idx) ?? 0),
      uvIndex: rawData.hourly.uv_index?.at(idx) ?? 0,
    }));

    const transformed: ProcessedWeatherData = {
      temperature: Math.round(rawData.current.temperature_2m),
      weatherCode: rawData.current.weather_code,
      windSpeed: Math.round(rawData.current.wind_speed_10m),
      windDirection: rawData.current.wind_direction_10m,
      windGusts: rawData.current.wind_gusts_10m ?? 0,
      humidity: rawData.current.relative_humidity_2m ?? 0,
      uvIndex: rawData.current.uv_index ?? 0,
      uvIndexMax: rawData.daily.uv_index_max[0] ?? 0,
      precipitationProbability:
        rawData.hourly.precipitation_probability?.at(hIdx) ?? 0,
      precipitationSum: rawData.daily.precipitation_sum[0] ?? 0,
      precipitationRate: rawData.current.precipitation ?? 0,
      apparentTemperature: rawData.current.apparent_temperature ?? 0,
      visibility: rawData.hourly.visibility?.at(hIdx) ?? 0,
      cloudCover: rawData.current.cloud_cover ?? 0,
      surfacePressure: Math.round(rawData.current.surface_pressure ?? 1013),
      sunrise: rawData.daily.sunrise[0] ?? "",
      sunset: rawData.daily.sunset[0] ?? "",
      isStale: false,
      lastUpdated: new Date().toISOString(),
      forecast: rawData.daily.time.map((dateStr, i) => ({
        date: dateStr,
        temperatureMax: Math.round(rawData.daily.temperature_2m_max?.at(i) ?? 0),
        temperatureMin: Math.round(rawData.daily.temperature_2m_min?.at(i) ?? 0),
        weatherCode: rawData.daily.weather_code?.at(i) ?? rawData.daily.weathercode?.at(i) ?? 0,
        uvIndexMax: rawData.daily.uv_index_max?.at(i) ?? 0,
        precipitationProbabilityMax: rawData.daily.precipitation_probability_max?.at(i) ?? 0,
        windSpeedMax: Math.round(rawData.daily.wind_speed_10m_max?.at(i) ?? rawData.daily.windspeed_10m_max?.at(i) ?? 0),
      })),
      hourlyForecast,
    };

    // Save to cache
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        data: transformed,
        timestamp: now,
    }));

    return transformed;
  } catch {
    if (cachedData) {
      // Return stale, but gracefully
      try {
        const { data } = JSON.parse(cachedData);
        return { ...data, isStale: true };
      } catch {
        // Fall through to error
      }
    }
    throw new Error(
      "Failed to fetch weather data and no valid cache available.",
    );
  }
};

export const clearWeatherCache = async (lat: number, lon: number, elevation?: number) => {
  const key = generateWeatherCacheKey(lat, lon, elevation);
  await AsyncStorage.removeItem(key);
};

// ============================================================================
// MOUNTAIN CARD BADGE LAZY-FETCHER WITH RATE-LIMITING & CONCURRENCY THROTTLE
// ============================================================================

export interface TrailWeatherBadgeData {
  temperature: number;
  weatherCode: number;
}

// In-memory cache for instant badge re-renders
const badgeMemoryCache = new Map<string, { data: TrailWeatherBadgeData; timestamp: number }>();

// In-flight promise map to deduplicate identical concurrent calls
const inFlightBadgeRequests = new Map<string, Promise<TrailWeatherBadgeData | null>>();

// Concurrency-limited request queue (max 2 active requests, 250ms spacing)
let activeBadgeRequests = 0;
const MAX_CONCURRENT_BADGE_REQUESTS = 2;
const badgeQueue: (() => void)[] = [];

const processBadgeQueue = () => {
  while (activeBadgeRequests < MAX_CONCURRENT_BADGE_REQUESTS && badgeQueue.length > 0) {
    activeBadgeRequests++;
    const next = badgeQueue.shift();
    if (next) next();
  }
};

const enqueueBadgeRequest = <T>(fn: () => Promise<T>): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    badgeQueue.push(async () => {
      try {
        const res = await fn();
        resolve(res);
      } catch (err) {
        reject(err);
      } finally {
        activeBadgeRequests--;
        setTimeout(processBadgeQueue, 250);
      }
    });
    processBadgeQueue();
  });
};

/**
 * Fetches lightweight current weather (temperature + weather code) for a single mountain card.
 * Enforces per-card lazy-loading, rate-limiting queue, and 60-minute caching.
 */
export const fetchTrailBadgeWeather = async (
  lat: number,
  lon: number,
  elevation?: number
): Promise<TrailWeatherBadgeData | null> => {
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;

  const key = generateWeatherCacheKey(lat, lon, elevation);
  const now = Date.now();

  // 1. Check in-memory badge cache
  const memHit = badgeMemoryCache.get(key);
  if (memHit && now - memHit.timestamp < CACHE_EXPIRY_MS) {
    return memHit.data;
  }

  // 2. Check in-flight promise to avoid duplicate concurrent calls
  if (inFlightBadgeRequests.has(key)) {
    return inFlightBadgeRequests.get(key)!;
  }

  const fetchPromise = (async () => {
    // 3. Check disk cache
    const diskKey = `badge_${key}`;
    try {
      const cached = await AsyncStorage.getItem(diskKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.data && now - parsed.timestamp < CACHE_EXPIRY_MS) {
          badgeMemoryCache.set(key, { data: parsed.data, timestamp: parsed.timestamp });
          return parsed.data;
        }
      }
    } catch {
      // Ignore disk cache read failure
    }

    // 4. Rate-limited network fetch
    return enqueueBadgeRequest(async () => {
      try {
        const roundLat = lat.toFixed(4);
        const roundLon = lon.toFixed(4);
        const elevParam = typeof elevation === 'number' && elevation > 0 ? `&elevation=${Math.round(elevation)}` : '';
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${roundLat}&longitude=${roundLon}${elevParam}&current=temperature_2m,weather_code&timezone=Asia/Manila`;

        const res = await fetch(url);
        if (!res.ok) return null;

        const json = await res.json();
        const badgeData: TrailWeatherBadgeData = {
          temperature: Math.round(json.current?.temperature_2m ?? 0),
          weatherCode: json.current?.weather_code ?? 0,
        };

        // Cache in memory and disk
        badgeMemoryCache.set(key, { data: badgeData, timestamp: now });
        AsyncStorage.setItem(diskKey, JSON.stringify({ data: badgeData, timestamp: now })).catch(() => {});

        return badgeData;
      } catch {
        return null;
      }
    });
  })();

  inFlightBadgeRequests.set(key, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    inFlightBadgeRequests.delete(key);
  }
};
