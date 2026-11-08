import {
    Camera,
    GeoJSONSource,
    Layer,
    Map,
} from "@maplibre/maplibre-react-native";
import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { onlineStyle } from "../styles/onlineStyle";

export interface LocationPinMapProps {
    latitude: number;
    longitude: number;
    title?: string;
}

export const LocationPinMap: React.FC<LocationPinMapProps> = memo(({ latitude, longitude, title }) => {
    const pinGeoJson = useMemo(
        () => ({
            type: "FeatureCollection" as const,
            features: [
                {
                    type: "Feature" as const,
                    id: "sent-location-feature",
                    properties: {
                        title: title || "Shared Location",
                    },
                    geometry: {
                        type: "Point" as const,
                        coordinates: [longitude, latitude],
                    },
                },
            ],
        }),
        [longitude, latitude, title]
    );

    return (
        <View style={styles.container}>
            <Map
                style={styles.map}
                logo={false}
                attribution={false}
                compass={true}
                scaleBar={false}
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

                <GeoJSONSource
                    id="sent-location-source"
                    data={pinGeoJson}
                >
                    {/* 1. Soft ambient red halo around the shared coordinate */}
                    <Layer
                        id="layer-sent-location-halo"
                        type="circle"
                        paint={{
                            "circle-radius": 18,
                            "circle-color": "#E53935",
                            "circle-opacity": 0.18,
                            "circle-pitch-alignment": "map",
                        }}
                    />

                    {/* 2. Crisp anchor dot at the exact coordinate tip */}
                    <Layer
                        id="layer-sent-location-dot"
                        type="circle"
                        paint={{
                            "circle-radius": 5,
                            "circle-color": "#E53935",
                            "circle-stroke-width": 2,
                            "circle-stroke-color": "#FFFFFF",
                            "circle-pitch-alignment": "map",
                        }}
                    />

                    {/* 3. Native GPU Red Location Pin Icon (built-in MapLibre DEFAULT_MARKER) */}
                    <Layer
                        id="layer-sent-location-pin"
                        type="symbol"
                        layout={{
                            "icon-image": "DEFAULT_MARKER",
                            "icon-size": 1.1,
                            "icon-anchor": "bottom",
                            "icon-allow-overlap": true,
                            "icon-ignore-placement": true,
                        }}
                    />

                    {/* 4. Native GPU Callout Label above the Pin */}
                    {!!title && (
                        <Layer
                            id="layer-sent-location-label"
                            type="symbol"
                            layout={{
                                "text-field": ["get", "title"],
                                "text-font": ["Noto Sans Bold"],
                                "text-size": 13,
                                "text-anchor": "bottom",
                                "text-offset": [0, -2.8],
                                "text-allow-overlap": true,
                                "text-ignore-placement": true,
                                "text-max-width": 16,
                            }}
                            paint={{
                                "text-color": "#111827",
                                "text-halo-color": "#FFFFFF",
                                "text-halo-width": 2.5,
                                "text-halo-blur": 0.5,
                            }}
                        />
                    )}
                </GeoJSONSource>
            </Map>
        </View>
    );
});

LocationPinMap.displayName = "LocationPinMap";

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
});
