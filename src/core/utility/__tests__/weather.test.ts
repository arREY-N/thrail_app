import {
  getCurrentHourIndex,
  getDetailedWeatherSafety,
  getHikingSafetyStatus,
  getUpcomingHoursWindow,
  getWeatherDescription,
  getWindDirection,
} from "../weatherHelpers";
import { generateWeatherCacheKey } from "../../repositories/weatherRepository";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

describe("Weather System Tests (Phase 3)", () => {
  describe("getWeatherDescription", () => {
    it('returns "Clear Sky" for WMO code 0', () => {
      expect(getWeatherDescription(0)).toBe("Clear Sky");
    });

    it('returns "Rain" for WMO code 61', () => {
      expect(getWeatherDescription(61)).toBe("Rain");
    });

    it('returns "Thunderstorm" for WMO code 95', () => {
      expect(getWeatherDescription(95)).toBe("Thunderstorm");
    });
  });

  describe("getWindDirection", () => {
    it('returns "From North" for 0°', () => {
      expect(getWindDirection(0)).toBe("From North");
    });

    it('returns "From East" for 90°', () => {
      expect(getWindDirection(90)).toBe("From East");
    });

    it('returns "From South" for 180°', () => {
      expect(getWindDirection(180)).toBe("From South");
    });

    it('returns "From West" for 270°', () => {
      expect(getWindDirection(270)).toBe("From West");
    });
  });

  describe("getHikingSafetyStatus", () => {
    it('returns "CAUTION" for WMO code 95 (Thunderstorm)', () => {
      const mockData = {
        weatherCode: 95,
        windSpeed: 10,
        precipitationProbability: 0,
      };
      // @ts-ignore
      expect(getHikingSafetyStatus(mockData)).toBe("CAUTION");
    });

    it('returns "DANGER" for torrential rain (precipitationRate >= 30)', () => {
      const mockData = {
        weatherCode: 65,
        windSpeed: 10,
        precipitationRate: 35,
        precipitationProbability: 100,
      };
      // @ts-ignore
      expect(getHikingSafetyStatus(mockData)).toBe("DANGER");
    });

    it('returns "CAUTION" for wind at 50 km/h', () => {
      const mockData = {
        weatherCode: 0,
        windSpeed: 50,
        precipitationProbability: 0,
      };
      // @ts-ignore
      expect(getHikingSafetyStatus(mockData)).toBe("CAUTION");
    });

    it('returns "SAFE" for normal, clear conditions', () => {
      const mockData = {
        weatherCode: 0,
        windSpeed: 10,
        precipitationProbability: 0,
      };
      // @ts-ignore
      expect(getHikingSafetyStatus(mockData)).toBe("SAFE");
    });
  });

  describe("Cache Key Logic", () => {
    it("properly rounds coordinates to 2 decimal places for regional weather cells", () => {
      const lat = 14.59954; // Rounds to 14.60
      const lon = 120.98428; // Rounds to 120.98

      const cacheKey = generateWeatherCacheKey(lat, lon);

      expect(cacheKey).toContain("14.60");
      expect(cacheKey).toContain("120.98");
    });

    it("appends elevation suffix when elevation is provided", () => {
      const cacheKey = generateWeatherCacheKey(16.5977, 120.9004, 2928);
      expect(cacheKey).toContain("16.60");
      expect(cacheKey).toContain("120.90");
      expect(cacheKey).toContain("_e2928");
    });
  });

  describe("Live Hour Window Resolution & Parity (Tasks 1-4)", () => {
    const buildMockHourly = (currentHourIndex: number, currentHourRain: number, midnightRain: number) => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const datePrefix = `${year}-${month}-${day}`;

      return Array.from({ length: 24 }, (_, i) => {
        const hh = String(i).padStart(2, "0");
        const isCurrent = i === currentHourIndex;
        return {
          time: `${datePrefix}T${hh}:00`,
          datePrefix,
          hourLabel: isCurrent ? "Now" : `${i % 12 || 12} ${i >= 12 ? "PM" : "AM"}`,
          temperature: 28,
          apparentTemperature: 28,
          weatherCode: i === 0 && midnightRain >= 50 ? 61 : 0,
          precipitationProbability: i < 3 ? midnightRain : (isCurrent ? currentHourRain : 10),
          windSpeed: 10,
          uvIndex: 3,
        };
      });
    };

    it("slices the 3-hour window starting from current hour (Now) rather than midnight", () => {
      const now = new Date();
      const currentHour = now.getHours();
      // Midnight has 80% heavy rain, but current hour and onwards have only 10% rain
      const mockHourly = buildMockHourly(currentHour, 10, 80);

      const mockData = {
        temperature: 26,
        apparentTemperature: 26,
        weatherCode: 0,
        windSpeed: 10,
        windGusts: 15,
        humidity: 65,
        uvIndex: 3,
        uvIndexMax: 4,
        precipitationProbability: 10,
        precipitationSum: 0,
        hourlyForecast: mockHourly,
      };

      // @ts-ignore
      const report = getDetailedWeatherSafety(mockData);
      // Because current hour onwards has 10% rain, it must NOT trigger a midnight rain alert
      expect(report.status).toBe("SAFE");
      expect(report.precipitationChance).toBe(10);
      expect(report.rainRiskLevel).toBe("low");
    });

    it("30%–49% rain returns SAFE (ISOLATED SHOWERS / Passing Showers) when temp/UV/wind are normal", () => {
      const now = new Date();
      const currentHour = now.getHours();
      const mockHourly = buildMockHourly(currentHour, 35, 10);

      const mockData = {
        temperature: 26,
        apparentTemperature: 26,
        weatherCode: 0,
        windSpeed: 15,
        windGusts: 20,
        humidity: 70,
        uvIndex: 4,
        uvIndexMax: 5,
        precipitationProbability: 35,
        precipitationSum: 0,
        hourlyForecast: mockHourly,
      };

      // @ts-ignore
      const report = getDetailedWeatherSafety(mockData);
      expect(report.status).toBe("SAFE");
      expect(report.badgeText).toBe("ISOLATED SHOWERS");
      expect(report.rainRiskLevel).toBe("low");
      expect(report.precipitationChance).toBe(35);
      // Top safety pill parity
      // @ts-ignore
      expect(getHikingSafetyStatus(mockData)).toBe("SAFE");
    });

    it("30% rain + 35°C Heat Index returns CAUTION (HEAT ADVISORY) with Heat risk at keyRisks[0]", () => {
      const now = new Date();
      const currentHour = now.getHours();
      const mockHourly = buildMockHourly(currentHour, 30, 10);

      const mockData = {
        temperature: 32,
        apparentTemperature: 35, // PAGASA Extreme Caution (33–41°C)
        weatherCode: 0,
        windSpeed: 10,
        windGusts: 15,
        humidity: 75,
        uvIndex: 5,
        precipitationProbability: 30,
        precipitationSum: 0,
        hourlyForecast: mockHourly,
      };

      // @ts-ignore
      const report = getDetailedWeatherSafety(mockData);
      expect(report.status).toBe("CAUTION");
      expect(report.badgeText).toBe("HEAT ADVISORY");
      // Key hazard must be the heat advisory, not hijacked by 30% passing showers
      expect(report.keyRisks[0]).toContain("Elevated Heat Index (35°C)");
      expect(report.keyRisks[0]).not.toContain("Passing light showers");
      // Low-rain note must NOT be pushed into keyRisks when status !== 'SAFE'
      const hasPassingShowerRisk = report.keyRisks.some((r) => r.includes("Passing light showers"));
      expect(hasPassingShowerRisk).toBe(false);
      // Top safety pill parity
      // @ts-ignore
      expect(getHikingSafetyStatus(mockData)).toBe("CAUTION");
    });

    it(">= 50% rain in upcoming 3 hours from Now returns CAUTION (RAIN ADVISORY) and mutes High UV sunburn risk", () => {
      const now = new Date();
      const currentHour = now.getHours();
      // Current hour is 60% rain with UV 9 (High UV)
      const mockHourly = buildMockHourly(currentHour, 60, 10);

      const mockData = {
        temperature: 28,
        apparentTemperature: 28,
        weatherCode: 0, // Clear Sky code
        windSpeed: 15,
        windGusts: 20,
        humidity: 80,
        uvIndex: 9, // High UV
        uvIndexMax: 9,
        precipitationProbability: 60,
        precipitationSum: 5,
        hourlyForecast: mockHourly,
      };

      // @ts-ignore
      const report = getDetailedWeatherSafety(mockData);
      expect(report.status).toBe("CAUTION");
      expect(report.badgeText).toBe("RAIN ADVISORY");
      expect(report.rainRiskLevel).toBe("moderate");
      // UV sunburn risk must be suppressed during active rain advisory
      expect(report.uvRiskLevel).toBe("low");
      const hasUvWarning = report.keyRisks.some((r) => r.includes("UV Index"));
      expect(hasUvWarning).toBe(false);
      // Top safety pill parity
      // @ts-ignore
      expect(getHikingSafetyStatus(mockData)).toBe("CAUTION");
    });

    it("dense fog (< 2000m visibility) properly triggers CAUTION (VISIBILITY ADVISORY)", () => {
      const mockData = {
        temperature: 20,
        apparentTemperature: 20,
        weatherCode: 45, // Fog
        visibility: 800,
        windSpeed: 10,
        precipitationProbability: 10,
      };

      // @ts-ignore
      const report = getDetailedWeatherSafety(mockData);
      expect(report.status).toBe("CAUTION");
      expect(report.badgeText).toBe("VISIBILITY ADVISORY");
      // @ts-ignore
      expect(getHikingSafetyStatus(mockData)).toBe("CAUTION");
    });

    it("getHikingSafetyStatus(data) always matches getDetailedWeatherSafety(data).status across all conditions", () => {
      const testCases = [
        { temperature: 25, apparentTemperature: 25, weatherCode: 0, windSpeed: 10, precipitationProbability: 10 },
        { temperature: 33, apparentTemperature: 36, weatherCode: 0, windSpeed: 10, precipitationProbability: 15 },
        { temperature: 40, apparentTemperature: 45, weatherCode: 0, windSpeed: 10, precipitationProbability: 0 },
        { temperature: 24, apparentTemperature: 24, weatherCode: 95, windSpeed: 20, precipitationProbability: 80 },
        { temperature: 22, apparentTemperature: 22, weatherCode: 0, windSpeed: 65, precipitationProbability: 10 },
        { temperature: 18, apparentTemperature: 18, weatherCode: 48, visibility: 500, windSpeed: 10, precipitationProbability: 0 },
      ];

      for (const tc of testCases) {
        // @ts-ignore
        const detailedStatus = getDetailedWeatherSafety(tc).status;
        // @ts-ignore
        const topPillStatus = getHikingSafetyStatus(tc);
        expect(topPillStatus).toBe(detailedStatus);
      }
    });
  });
});
