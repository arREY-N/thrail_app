import { MaterialIcons } from "@expo/vector-icons";
import { Camera, Map, Marker } from "@maplibre/maplibre-react-native";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "@/src/constants/colors";
import { onlineStyle } from "../styles/onlineStyle";

export interface LocationPinMapProps {
    latitude: number;
    longitude: number;
    title?: string;
}

export const LocationPinMap: React.FC<LocationPinMapProps> = memo(({ latitude, longitude, title }) => {
    return (
        <View style={styles.container}>
            <Map
                style={styles.map}
                logo={false}
                attribution={false}
                compass={true}
                mapStyle={onlineStyle}
            >
                <Camera
                    initialViewState={{
                        center: [longitude, latitude],
                        zoom: 15,
                    }}
                    minZoom={4}
                    maxZoom={20}
                />
                <Marker
                    id="sent-location-pin"
                    lngLat={[longitude, latitude]}
                >
                    <View style={styles.markerContainer}>
                        {!!title && (
                            <View style={styles.callout}>
                                <Text style={styles.calloutText} numberOfLines={1}>{title}</Text>
                            </View>
                        )}
                        <View style={styles.pinWrapper}>
                            <MaterialIcons name="location-on" size={42} color={Colors.ERROR || "#E53935"} />
                        </View>
                    </View>
                </Marker>
            </Map>
        </View>
    );
});

LocationPinMap.displayName = "LocationPinMap";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: "hidden",
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    callout: {
        backgroundColor: "#111827",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 2,
        maxWidth: 180,
    },
    calloutText: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "bold",
        textAlign: "center",
    },
    pinWrapper: {
        alignItems: "center",
        justifyContent: "center",
    },
});

