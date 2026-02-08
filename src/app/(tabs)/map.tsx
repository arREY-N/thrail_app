import React from 'react';
import { StyleSheet, View } from 'react-native';
// Import the feature screen
import NavigationScreen from '../../features/Navigation/screens/NavigationScreen';

const MapPage: React.FC = () => {
  return (
    <View style={styles.container}>
      <NavigationScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MapPage;