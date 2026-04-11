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

  /**
   * ============================================================================
   * DEV OVERRIDE SECTION
   * ============================================================================
   * To remove these developer mocked conditions and use REAL live weather data:
   * 
   * 1. Delete this entire `applyDevOverrides` function block (lines ~26-52).
   * 2. Remove the `applyDevOverrides(...)` wrapper from the three return statements below:
   *    - Replace: `return applyDevOverrides({ ...data, isStale: false });` -> `return { ...data, isStale: false };`
   *    - Replace: `return applyDevOverrides(transformed);` -> `return transformed;`
   *    - Replace: `return applyDevOverrides({ ...data, isStale: true });` -> `return { ...data, isStale: true };`
   * ============================================================================
   */
  const applyDevOverrides = (data: ProcessedWeatherData) => {
    // Batulao: Sunny & Safe
    if (roundLat === "14.0399" && roundLon === "120.8024") {
      data.temperature = 34;
      data.weatherCode = 0; // Clear sky
      data.windSpeed = 10;
      data.precipitationProbability = 0;
    }
    // Maculot: Rainy & Caution
    else if (roundLat === "13.9209" && roundLon === "121.0517") {
      data.temperature = 24;
      data.weatherCode = 61; // Rain
      data.windSpeed = 45; // >40kmh triggers CAUTION
      data.precipitationProbability = 60;
    }
    // Makiling: Thunderstorm & Danger
    else if (roundLat === "14.1352" && roundLon === "121.1945") {
      data.temperature = 20;
      data.weatherCode = 95; // Thunderstorm triggers DANGER
      data.windSpeed = 65; 
      data.precipitationProbability = 95;
    }
    return data;
  };

  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    if (now - timestamp < CACHE_EXPIRY_MS) {
      return applyDevOverrides({ ...data, isStale: false });
    }
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${roundLat}&longitude=${roundLon}&current_weather=true&hourly=temperature_2m,precipitation_probability,windspeed_10m,winddirection_10m,relativehumidity_2m,weathercode,apparent_temperature,visibility,windgusts_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,uv_index_max,sunrise,sunset,weathercode,precipitation_probability_max,windgusts_10m_max&timezone=Asia/Manila&forecast_days=7&models=best_match`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const rawData: WeatherApiResponse = await response.json();

    // Transform the raw data
    const currentHourIndex = rawData.hourly.time.findIndex((t) =>
      t.startsWith(rawData.current_weather.time.slice(0, 13)),
    );
    const hIdx = currentHourIndex !== -1 ? currentHourIndex : 0;

    const transformed: ProcessedWeatherData = {
      temperature: Math.round(rawData.current_weather.temperature),
      weatherCode: rawData.current_weather.weathercode,
      windSpeed: Math.round(rawData.current_weather.windspeed),
      windDirection: rawData.current_weather.winddirection,
      windGusts: rawData.hourly.windgusts_10m[hIdx] ?? 0,
      humidity: rawData.hourly.relativehumidity_2m[hIdx] ?? 0,
      uvIndex: rawData.daily.uv_index_max[0] ?? 0,
      precipitationProbability:
        rawData.hourly.precipitation_probability[hIdx] ?? 0,
      precipitationSum: rawData.daily.precipitation_sum[0] ?? 0,
      sunrise: rawData.daily.sunrise[0] ?? "",
      sunset: rawData.daily.sunset[0] ?? "",
      isStale: false,
      lastUpdated: new Date().toISOString(),
      forecast: rawData.daily.time.slice(0, 4).map((dateStr, i) => ({
        date: dateStr,
        temperatureMax: Math.round(rawData.daily.temperature_2m_max[i]),
        temperatureMin: Math.round(rawData.daily.temperature_2m_min[i]),
        weatherCode: rawData.daily.weathercode[i],
      })),
    };

    // Save to cache
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        data: transformed,
        timestamp: now,
    }));

    return applyDevOverrides(transformed);
  } catch (error) {
    if (cachedData) {
      // Return stale, but gracefully
      const { data } = JSON.parse(cachedData);
      return applyDevOverrides({ ...data, isStale: true });
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
