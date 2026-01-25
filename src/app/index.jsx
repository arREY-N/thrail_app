import React from 'react';
import { View } from 'react-native';
import TrailMap from '../components/TrailMap';

export default function Page() {
  return (
    // No more red background, just full screen map
    <View style={{ flex: 1 }}>
      <TrailMap />
    </View>
  );
}