import {
  getHikingSafetyStatus,
  getWeatherDescription,
  getWindDirection,
} from "../weatherHelpers";
// Note: Adjust the import name and path for the cache key generator based on your actual weatherService.ts
import { generateWeatherCacheKey } from "../../repositories/weatherRepository";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
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
    it('returns "DANGER" for WMO code 95', () => {
      const mockData = {
        weatherCode: 95,
        windSpeed: 10,
        precipitationProbability: 0,
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
    it("properly rounds coordinates to exactly 4 decimal places", () => {
      const lat = 14.59954; // Rounds to 14.5995
      const lon = 120.98428; // Rounds to 120.9843

      const cacheKey = generateWeatherCacheKey(lat, lon);

      expect(cacheKey).toContain("14.5995");
      expect(cacheKey).toContain("120.9843");
    });
  });
});
