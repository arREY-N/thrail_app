import React from "react";
import { StyleSheet, View } from "react-native";

export interface LocationPinMapProps {
    latitude: number;
    longitude: number;
    title?: string;
}

export const LocationPinMap: React.FC<LocationPinMapProps> = ({ latitude, longitude, title }) => {
    return <View style={styles.container} />;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

