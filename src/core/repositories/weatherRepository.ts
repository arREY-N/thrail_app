// FILE: src/core/repositories/weatherRepository.ts
// ACTION: UPDATE
// REASON: Refactoring the dummy weather repo to implement actual Open-Meteo API fetching with AsyncStorage caching.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProcessedWeatherData, WeatherApiResponse } from "../types/weather";

const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export const fetchWeatherFromApi = async (
  lat: number,
  lon: number,
): Promise<ProcessedWeatherData> => {
  const roundLat = lat.toFixed(4);
  const roundLon = lon.toFixed(4);
  const CACHE_KEY = `weather_${roundLat}_${roundLon}`;

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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${roundLat}&longitude=${roundLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&hourly=temperature_2m,precipitation_probability,windspeed_10m,winddirection_10m,relativehumidity_2m,weathercode,apparent_temperature,visibility,windgusts_10m,uv_index&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,uv_index_max,sunrise,sunset,weathercode,precipitation_probability_max,windgusts_10m_max&timezone=Asia/Manila&forecast_days=7&models=best_match`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const rawData: WeatherApiResponse = await response.json();

    if (__DEV__) {
      console.log(`[WeatherAPI] Lat: ${roundLat}, Lon: ${roundLon}`);
      console.log(`[WeatherAPI] Current UV: ${rawData.current.uv_index}, Peak UV: ${rawData.daily.uv_index_max[0]}`);
    }

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
      weatherCode: rawData.hourly.weathercode?.at(idx) ?? 0,
      precipitationProbability: rawData.hourly.precipitation_probability?.at(idx) ?? 0,
      windSpeed: Math.round(rawData.hourly.windspeed_10m?.at(idx) ?? 0),
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
        weatherCode: rawData.daily.weathercode?.at(i) ?? 0,
        uvIndexMax: rawData.daily.uv_index_max?.at(i) ?? 0,
        precipitationProbabilityMax: rawData.daily.precipitation_probability_max?.at(i) ?? 0,
        windSpeedMax: rawData.daily.windspeed_10m_max?.at(i) ?? 0,
      })),
      hourlyForecast,
    };

    // Save to cache
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        data: transformed,
        timestamp: now,
    }));

    return transformed;
  } catch (error) {
    console.warn('[weatherRepository] Weather API fetch error:', error);
    if (cachedData) {
      // Return stale, but gracefully
      const { data } = JSON.parse(cachedData);
      return { ...data, isStale: true };
    }
    throw new Error(
      "Failed to fetch weather data and no valid cache available.",
    );
  }
};

export const clearWeatherCache = async (lat: number, lon: number) => {
  const roundLat = lat.toFixed(4);
  const roundLon = lon.toFixed(4);
  await AsyncStorage.removeItem(`weather_${roundLat}_${roundLon}`);
};

export const generateWeatherCacheKey = (lat: number, lon: number): string => {
  return `weather_${lat.toFixed(4)}_${lon.toFixed(4)}`;
};
