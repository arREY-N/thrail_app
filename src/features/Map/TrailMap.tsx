import CustomIcon from "@/src/components/CustomIcon";
import { Colors } from "@/src/constants/colors";
import React, { forwardRef, useImperativeHandle } from "react";
import { StyleSheet, Text, View } from "react-native";

/**
 * Premium Web Fallback for TrailMap.
 * Expo/Metro will automatically serve this file when running on Platform.OS === 'web'
 * bypassing MapLibreGL completely to avoid native crashes.
 */
const TrailMap = forwardRef(({ bottomInset = 0 }: any, ref) => {
    useImperativeHandle(ref, () => ({
        centerOnUser: () => console.log("Web: centerOnUser ignored"),
        toggleOffline: () => console.log("Web: toggleOffline ignored"),
        exportHikeData: () => console.log("Web: exportHikeData ignored"),
    }));

    return (
        <View style={styles.container}>
            <View style={[styles.fallbackCard, { marginBottom: bottomInset }]}>
                <View style={styles.iconRing}>
                    <CustomIcon library="Feather" name="map" size={36} color={Colors.PRIMARY} />
                </View>
                
                <Text style={styles.title}>Map Not Available on Web</Text>
                <Text style={styles.subtitle}>
                    Please use the Thrail mobile app to view interactive maps, search trails, and track your live hikes.
                </Text>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    fallbackCard: {
        backgroundColor: Colors.WHITE,
        maxWidth: 400,
        width: "100%",
        borderRadius: 24,
        padding: 32,
        alignItems: "center",
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.04)',
    } as any,
    iconRing: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${Colors.PRIMARY}15`, 
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.TEXT_PRIMARY,
        marginBottom: 12,
        textAlign: "center",
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 22,
        color: Colors.TEXT_SECONDARY,
        textAlign: "center",
    },
});

export default TrailMap;