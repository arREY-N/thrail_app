import MapLibreGL from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

// Load trail data
const rawMapData = require('../assets/map_data/trails.json');

MapLibreGL.setAccessToken(null);

const TrailMap = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    (async () => {
      // 1. Ask for permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need your location to show where you are!');
        return;
      }
      setPermissionGranted(true);
      
      // 2. Just try to wake up GPS silently (we won't wait for it)
      Location.getCurrentPositionAsync({}).catch(e => console.log(e));
    })();
  }, []);

  const hikingTrailStyle = {
    lineColor: '#228B22', 
    lineWidth: 3,         
    lineCap: 'round',
    lineJoin: 'round',
  };

  return (
    <View style={styles.page}>
      <MapLibreGL.MapView
        style={styles.map}
        // @ts-ignore
        styleURL="https://demotiles.maplibre.org/style.json"
      >
        <MapLibreGL.Camera
          zoomLevel={12}
          centerCoordinate={[121.05, 14.58]} 
          animationMode="flyTo"
          animationDuration={2000}
        />

        {/* 3. ALWAYS render the Blue Dot component if we have permission.
               It will appear on its own when the GPS signal arrives. */}
        {permissionGranted && (
          <MapLibreGL.UserLocation 
            visible={true}
            animated={true}
            showsUserHeadingIndicator={true}
          />
        )}

        <MapLibreGL.ShapeSource id="trailSource" shape={rawMapData as any}>
          <MapLibreGL.LineLayer id="layer-hiking" style={hikingTrailStyle as any} />
        </MapLibreGL.ShapeSource>

      </MapLibreGL.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, height: '100%', width: '100%' },
  map: { flex: 1 },
});

export default TrailMap;