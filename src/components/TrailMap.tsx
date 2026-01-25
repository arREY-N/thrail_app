import MapLibreGL from '@maplibre/maplibre-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

// 1. IMPORT YOUR REAL DATA (The 2MB File)
const rawMapData = require('../assets/map_data/trails1.json');

MapLibreGL.setAccessToken(null);

const TrailMap = () => {

  // 2. STYLE: Real Hiking Style
  const hikingTrailStyle = {
    lineColor: '#228B22', // Forest Green
    lineWidth: 3,         // Normal width (not thick like the test)
    lineCap: 'round',
    lineJoin: 'round',
  };

  return (
    <View style={styles.page}>
      <MapLibreGL.MapView
        style={styles.map}
        zoomEnabled={true}
        scrollEnabled={true}
        // @ts-ignore
        styleURL="https://demotiles.maplibre.org/style.json"
      >
        
        {/* 3. CAMERA: Wide view of CALABARZON (Rizal/Laguna/Batangas) */}
        <MapLibreGL.Camera
          zoomLevel={9}  
          centerCoordinate={[121.2, 14.2]} 
        />

        <MapLibreGL.ShapeSource id="trailSource" shape={rawMapData as any}>
          <MapLibreGL.LineLayer 
            id="layer-hiking" 
            style={hikingTrailStyle as any} 
          />
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