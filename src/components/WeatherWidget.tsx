import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { WeatherWidgetSkeleton } from '@/src/features/Home/components/WeatherSkeleton';

import { Colors } from '@/src/constants/colors';
import { ProcessedWeatherData } from '../core/types/weather';
import {
  formatForecastDay,
  formatSunTime,
  getHikingSafetyStatus,
  getHumidityLabel,
  getUVLabel,
  getWeatherInfoUI,
  getWindDirection
} from '../core/utility/weatherHelpers';
import { useWeather } from '../hooks/useWeather';

interface WeatherWidgetProps {
    latitude: number;
    longitude: number;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ latitude, longitude }) => {
  const { weatherData: data, loading, error } = useWeather(latitude, longitude);

  if (loading) {
    return <WeatherWidgetSkeleton />;
  }

  if (error || !data) {
    return (
      <View style={styles.centerContent}>
        <CustomIcon library="Ionicons" name="warning-outline" size={32} color={Colors.ERROR} />
        <CustomText style={styles.errorText}>Unable to load weather data</CustomText>
      </View>
    );
  }

  const weatherData = data as ProcessedWeatherData;
  const { condition: currentCondition } = getWeatherInfoUI(weatherData.weatherCode);
  const safetyLevel = getHikingSafetyStatus(weatherData);

  const getSafetyTheme = (level: string) => {
    switch (level) {
      case 'SAFE':
        return { 
          bg: Colors.WEATHER_SAFE_BG, 
          text: Colors.WEATHER_SAFE_TEXT, 
          icon: 'checkmark-circle-outline' 
        };
      case 'CAUTION':
        return { 
          bg: Colors.WEATHER_CAUTION_BG, 
          text: Colors.WEATHER_CAUTION_TEXT, 
          icon: 'warning-outline' };
      case 'DANGER':
        return { 
          bg: Colors.WEATHER_DANGER_BG, 
          text: Colors.WEATHER_DANGER_TEXT, 
          icon: 'alert-circle-outline' 
        };
      default:
        return { 
          bg: Colors.GRAY_MEDIUM, 
          text: Colors.WHITE, 
          icon: 'help-circle-outline' 
        };
    }
  };

  const theme = getSafetyTheme(safetyLevel);

  return (
    <View style={styles.container}>
      <View style={[styles.safetyBanner, { backgroundColor: theme.bg }]}>
        <CustomIcon library="Ionicons" name={theme.icon} size={22} color={theme.text} />
        <CustomText style={[styles.safetyText, { color: theme.text }]}>
          {safetyLevel} CONDITIONS
        </CustomText>
      </View>

      <View style={styles.currentSection}>
        <View style={styles.tempWrapper}>
            <CustomText style={styles.currentTemp}>
                {weatherData.temperature != null && !isNaN(weatherData.temperature) ? Math.round(weatherData.temperature) : '--'}
            </CustomText>
            <CustomText style={styles.degreeSymbol}>°C</CustomText>
        </View>
        <CustomText style={styles.currentCondition}>{currentCondition}</CustomText>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.forecastScroll}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {weatherData.forecast?.map((day, index) => {
          const { icon, library } = getWeatherInfoUI(day.weatherCode);
          const isToday = index === 0;
          return (
            <View key={index} style={[styles.forecastItem, isToday && styles.forecastItemToday]}>
              <CustomText variant="label" style={[styles.forecastDate, isToday && styles.forecastDateToday]}>
                {isToday ? "Today" : formatForecastDay(day.date, index)}
              </CustomText>
              <View style={styles.fIconWrapper}>
                  <CustomIcon library={library} name={icon} size={26} color={Colors.PRIMARY} />
              </View>
              <View style={styles.forecastTempRow}>
                <CustomText variant="label" style={styles.forecastTempHigh}>{Math.round(day.temperatureMax)}°</CustomText>
                <CustomText style={styles.fTempSeparator}> / </CustomText>
                <CustomText variant="caption" style={styles.forecastTempLow}>{Math.round(day.temperatureMin)}°</CustomText>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <CustomIcon library="Feather" name="wind" size={20} color={Colors.PRIMARY} />
            <CustomText variant="label" style={styles.gridLabel}>Wind</CustomText>
            <CustomText style={styles.gridValue}>{weatherData.windSpeed} km/h</CustomText>
            <CustomText variant="caption" style={styles.gridSubtext}>{getWindDirection(weatherData.windDirection)}</CustomText>
          </View>
          <View style={styles.gridItem}>
            <CustomIcon library="Ionicons" name="rainy-outline" size={22} color={Colors.PRIMARY} />
            <CustomText variant="label" style={styles.gridLabel}>Precip</CustomText>
            <CustomText style={styles.gridValue}>{weatherData.precipitationProbability ?? 0}%</CustomText>
            <CustomText variant="caption" style={styles.gridSubtext}>Chance of rain</CustomText>
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <CustomIcon library="Ionicons" name="thermometer-outline" size={22} color={Colors.PRIMARY} />
            <CustomText variant="label" style={styles.gridLabel}>UV Index</CustomText>
            <CustomText style={styles.gridValue}>{Math.round(weatherData.uvIndex ?? 0)}</CustomText>
            <CustomText variant="caption" style={styles.gridSubtext}>{getUVLabel(weatherData.uvIndex ?? 0)}</CustomText>
          </View>
          <View style={styles.gridItem}>
            <CustomIcon library="Ionicons" name="water-outline" size={22} color={Colors.PRIMARY} />
            <CustomText variant="label" style={styles.gridLabel}>Humidity</CustomText>
            <CustomText style={styles.gridValue}>{weatherData.humidity}%</CustomText>
            <CustomText variant="caption" style={styles.gridSubtext}>{getHumidityLabel(weatherData.humidity)}</CustomText>
          </View>
        </View>
      </View>

      <View style={styles.sunRow}>
        <View style={styles.sunItem}>
          <CustomIcon library="Feather" name="sunrise" size={28} color={Colors.PRIMARY} />
          <View>
            <CustomText variant="caption" style={styles.sunLabel}>Sunrise</CustomText>
            <CustomText style={styles.sunTime}>{formatSunTime(weatherData.sunrise)}</CustomText>
          </View>
        </View>
        <View style={styles.sunSeparator} />
        <View style={[styles.sunItem, { alignItems: 'flex-end'}]}>
          <CustomIcon library="Feather" name="sunset" size={28} color={Colors.PRIMARY} />
          <View style={{ alignItems: 'flex-end' }}>
            <CustomText variant="caption" style={styles.sunLabel}>Sunset</CustomText>
            <CustomText style={styles.sunTime}>{formatSunTime(weatherData.sunset)}</CustomText>
          </View>
        </View>
      </View>
    </View>
  );
};

const dropShadow = Platform.select({
    ios: { shadowColor: Colors.SHADOW, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8 },
    android: { elevation: 2 },
    web: { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.06)' }
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8, 
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    gap: 12,
  },
  errorText: {
    color: Colors.ERROR,
    fontSize: 16,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
    ...dropShadow, 
  },
  safetyText: {
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1.2,
  },
  currentSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  tempWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currentTemp: {
    fontSize: 64,
    fontWeight: '900',
    color: Colors.TEXT_PRIMARY,
    lineHeight: 72,
    letterSpacing: -2,
  },
  degreeSymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.TEXT_PRIMARY,
    marginTop: 12,
  },
  currentCondition: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.TEXT_SECONDARY,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  forecastScroll: {
    flexGrow: 0,
    marginBottom: 32,
  },
  forecastItem: {
    alignItems: 'center',
    backgroundColor: Colors.GRAY_ULTRALIGHT,
    marginRight: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 8,
    minWidth: 70,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  forecastItemToday: {
    backgroundColor: Colors.WHITE,
    borderColor: Colors.PRIMARY,
  },
  fIconWrapper: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forecastDate: {
    color: Colors.TEXT_SECONDARY,
  },
  forecastDateToday: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
  },
  forecastTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forecastTempHigh: {
    color: Colors.TEXT_PRIMARY,
  },
  fTempSeparator: {
    fontSize: 12,
    color: Colors.GRAY_MEDIUM,
    marginHorizontal: 2,
  },
  forecastTempLow: {
    color: Colors.TEXT_SECONDARY,
  },
  gridContainer: {
    gap: 12,
    marginBottom: 24,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridItem: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.GRAY_ULTRALIGHT,
    ...dropShadow,
  },
  gridLabel: {
    color: Colors.TEXT_SECONDARY,
    marginTop: 8,
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.TEXT_PRIMARY,
    textAlign: 'center',
  },
  gridSubtext: {
    marginTop: 4,
    textAlign: 'center',
  },
  sunRow: {
    flexDirection: 'row',
    backgroundColor: Colors.WHITE,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.GRAY_ULTRALIGHT,
    ...dropShadow, 
  },
  sunItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sunLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sunTime: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },
  sunSeparator: {
    width: 1,
    height: 40,
    backgroundColor: Colors.GRAY_LIGHT,
  },
});

export default WeatherWidget;