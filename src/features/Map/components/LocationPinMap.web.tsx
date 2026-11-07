import * as maplibregl from "maplibre-gl";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { onlineStyle } from "../styles/onlineStyle";

function ensureMapLibreCss() {
    const id = "maplibre-gl-css";
    if (typeof document === "undefined") return;
    if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = `https://unpkg.com/maplibre-gl@${maplibregl.getVersion()}/dist/maplibre-gl.css`;
        document.head.appendChild(link);
    }
}

export interface LocationPinMapProps {
    latitude: number;
    longitude: number;
    title?: string;
}

export const LocationPinMap: React.FC<LocationPinMapProps> = ({ latitude, longitude, title }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        const host = containerRef.current;
        if (!host) return;
        ensureMapLibreCss();

        const map = new maplibregl.Map({
            container: host,
            style: onlineStyle,
            center: [longitude, latitude],
            zoom: 15,
            minZoom: 4,
            maxZoom: 20,
            attributionControl: { compact: true },
        });
        mapRef.current = map;

        const markerEl = document.createElement("div");
        markerEl.style.display = "flex";
        markerEl.style.flexDirection = "column";
        markerEl.style.alignItems = "center";
        markerEl.style.cursor = "default";

        if (title) {
            const callout = document.createElement("div");
            Object.assign(callout.style, {
                background: "#111827",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: "bold",
                padding: "3px 8px",
                borderRadius: "6px",
                marginBottom: "2px",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            });
            callout.textContent = title;
            markerEl.appendChild(callout);
        }

        const pinSvg = document.createElement("div");
        pinSvg.innerHTML = `
            <svg width="38" height="38" viewBox="0 0 24 24" fill="#E53935" stroke="#FFFFFF" stroke-width="1.2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
            </svg>
        `;
        markerEl.appendChild(pinSvg);

        new maplibregl.Marker({ element: markerEl, anchor: "bottom" })
            .setLngLat([longitude, latitude])
            .addTo(map);

        const ro = new ResizeObserver(() => map.resize());
        ro.observe(host);

        return () => {
            ro.disconnect();
            map.remove();
        };
    }, [latitude, longitude, title]);

    return (
        <View style={styles.container}>
            {/* Plain DOM node for maplibre-gl Web container */}
            <div ref={containerRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
    },
});

