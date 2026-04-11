import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useWeather } from '../hooks/useWeather';
import CustomText from './CustomText';
import CustomIcon from './CustomIcon';
import SkeletonEffect from './SkeletonEffect';
import { Colors } from '../constants/colors';
import { ProcessedWeatherData } from '../core/types/weather';
import { 
  getWeatherInfoUI, 
  getHikingSafetyStatus, 
  formatForecastDay, 
  formatSunTime, 
  getWindDirection, 
  getUVLabel, 
  getHumidityLabel 
} from '../core/utility/weatherHelpers';

interface WeatherWidgetProps {
    latitude: number;
    longitude: number;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ latitude, longitude }) => {
  const { weatherData: data, loading, error } = useWeather(latitude, longitude);

  if (loading) {
    return <SkeletonEffect style={styles.container} />;
  }

  if (error || !data) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <CustomIcon name="alert-triangle" size={32} color={Colors.ERROR} />
        <CustomText style={styles.errorText}>Unable to load weather data</CustomText>
      </View>
    );
  }

  const weatherData = data as ProcessedWeatherData;
  const { condition: currentCondition } = getWeatherInfoUI(weatherData.weatherCode);
  const safetyLevel = getHikingSafetyStatus(weatherData);

  const getSafetyColor = (level: string) => {
    switch (level) {
      case 'SAFE':
        return Colors.SUCCESS;
      case 'CAUTION':
        return Colors.WARNING;
      case 'DANGER':
        return Colors.ERROR;
      default:
        return Colors.GRAY_MEDIUM;
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Safety Banner */}
      <View style={[styles.safetyBanner, { backgroundColor: getSafetyColor(safetyLevel) }]}>
        <CustomIcon 
          name={safetyLevel === 'SAFE' ? 'check-circle' : 'alert-circle'} 
          size={20} 
          color={Colors.WHITE} 
        />
        <CustomText style={styles.safetyText}>
          {safetyLevel} CONDITIONS
        </CustomText>
      </View>

      {/* 2. Current Temp/Condition */}
      <View style={styles.currentSection}>
        <Text style={styles.currentTemp}>
          {weatherData.temperature != null && !isNaN(weatherData.temperature) ? `${Math.round(weatherData.temperature)}°C` : '--'}
        </Text>
        <CustomText style={styles.currentCondition}>{currentCondition}</CustomText>
      </View>

      {/* 3. 4-day horizontal scroll forecast */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.forecastScroll}
      >
        {weatherData.forecast && weatherData.forecast.slice(0, 4).map((day, index) => {
          const { icon, library } = getWeatherInfoUI(day.weatherCode);
          return (
            <View key={index} style={styles.forecastItem}>
              <CustomText style={styles.forecastDate}>{formatForecastDay(day.date, index)}</CustomText>
              <CustomIcon library={library} name={icon} size={24} color={Colors.PRIMARY} />
              <CustomText style={styles.forecastTemp}>
                <CustomText>{Math.round(day.temperatureMax)}°</CustomText>
                <CustomText style={{ color: Colors.TEXT_SECONDARY, fontWeight: 'normal' }}> / {Math.round(day.temperatureMin)}°</CustomText>
              </CustomText>
            </View>
          );
        }) || null}
      </ScrollView>

      {/* 4. 2x2 Grid (Wind, Precip, UV, Humidity) */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <CustomIcon name="wind" size={24} color={Colors.SECONDARY} />
            <CustomText style={styles.gridLabel}>Wind</CustomText>
            <CustomText style={styles.gridValue}>{weatherData.windSpeed} km/h</CustomText>
            <CustomText style={styles.gridSubtext}>{getWindDirection(weatherData.windDirection)}</CustomText>
          </View>
          <View style={styles.gridItem}>
            <CustomIcon name="cloud-rain" size={24} color={Colors.SECONDARY} />
            <CustomText style={styles.gridLabel}>Precip</CustomText>
            <CustomText style={styles.gridValue}>{weatherData.precipitationProbability ?? 0}% chance</CustomText>
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <CustomIcon name="sun" size={24} color={Colors.SECONDARY} />
            <CustomText style={styles.gridLabel}>UV Index</CustomText>
            <CustomText style={styles.gridValue}>{Math.round(weatherData.uvIndex ?? 0)}</CustomText>
            <CustomText style={styles.gridSubtext}>{getUVLabel(weatherData.uvIndex ?? 0)}</CustomText>
          </View>
          <View style={styles.gridItem}>
            <CustomIcon name="droplet" size={24} color={Colors.SECONDARY} />
            <CustomText style={styles.gridLabel}>Humidity</CustomText>
            <CustomText style={styles.gridValue}>{weatherData.humidity}%</CustomText>
            <CustomText style={styles.gridSubtext}>{getHumidityLabel(weatherData.humidity)}</CustomText>
          </View>
        </View>
      </View>

      {/* 5. Sunrise/Sunset Row */}
      <View style={styles.sunRow}>
        <View style={styles.sunItem}>
          <CustomIcon name="sunrise" size={24} color={Colors.PRIMARY} />
          <View>
            <CustomText style={styles.sunLabel}>Sunrise</CustomText>
            <CustomText style={styles.sunTime}>{formatSunTime(weatherData.sunrise)}</CustomText>
          </View>
        </View>
        <View style={styles.sunSeparator} />
        <View style={styles.sunItem}>
          <CustomIcon name="sunset" size={24} color={Colors.PRIMARY} />
          <View>
            <CustomText style={styles.sunLabel}>Sunset</CustomText>
            <CustomText style={styles.sunTime}>{formatSunTime(weatherData.sunset)}</CustomText>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.BACKGROUND,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 100, // Extra margin to ensure Sunrise row clears the absolute footer
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
    textAlign: 'center',
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  safetyText: {
    color: Colors.WHITE,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  currentSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  currentTemp: {
    fontSize: 64,
    fontWeight: 'bold',
    color: Colors.TEXT_PRIMARY,
  },
  currentCondition: {
    fontSize: 20,
    color: Colors.TEXT_SECONDARY,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  forecastScroll: {
    flexGrow: 0,
    marginBottom: 24,
  },
  forecastItem: {
    alignItems: 'center',
    marginRight: 24,
    gap: 12,
    minWidth: 60,
  },
  forecastDate: {
    fontSize: 14,
    color: Colors.TEXT_SECONDARY,
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
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
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  gridLabel: {
    fontSize: 14,
    color: Colors.TEXT_SECONDARY,
  },
  gridValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    textAlign: 'center',
  },
  gridSubtext: {
    fontSize: 12,
    color: Colors.TEXT_SECONDARY,
    marginTop: -4,
    textAlign: 'center',
  },
  sunRow: {
    flexDirection: 'row',
    backgroundColor: Colors.WHITE,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  sunItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sunLabel: {
    fontSize: 12,
    color: Colors.TEXT_SECONDARY,
  },
  sunTime: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
    marginTop: 2,
  },
  sunSeparator: {
    width: 1,
    height: 32,
    backgroundColor: Colors.GRAY_LIGHT,
  },
});

export default WeatherWidget;