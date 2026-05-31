import React from "react";
import LoadingScreen from "@/src/app/loading";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useSuperadminNavigation from "@/src/core/hook/navigation/useSuperadminNavigation";
import useTrail from "@/src/core/hook/trail/useTrail";
import { Trail } from "@/src/core/models/Trail/Trail";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import CustomHeader from "@/src/components/CustomHeader";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";

/**
 * Trail management list screen.
 * Displays a list of all trails with actions to preview, edit general info,
 * or open the Visual Point Editor (Map Pins).
 * Accessible by both superadmins and admins.
 * 
 * @returns {React.ReactElement} The rendered trail management list.
 */
export default function listTrail(){
    const { onTrailPress, onBackPress } = useAppNavigation();
    const { onWriteTrail, onEditMapPins } = useSuperadminNavigation();
    const { trails, isLoading } = useTrail();

    if(isLoading) return <LoadingScreen/>
    
    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Manage Trails" 
                centerTitle={true} 
                onBackPress={onBackPress}
            />

            <TESTCREATETRAIL 
                onViewTrail={onTrailPress}
                trails={trails}
                isLoading={isLoading}
                onWriteTrail={onWriteTrail}
                onEditMapPins={onEditMapPins}
            />
        </ScreenWrapper>
    )
}

type ScreenParams = {
    onViewTrail: (id: string) => void,
    trails: Trail[],
    isLoading: boolean,
    onWriteTrail: (id?: string | null) => void,
    onEditMapPins: (id: string) => void,
}

/**
 * Subcomponent to render the trail cards and management actions.
 * 
 * @param {ScreenParams} props - Component properties.
 * @param {(id: string) => void} props.onViewTrail - Callback to view/preview a trail.
 * @param {Trail[]} props.trails - List of trail objects.
 * @param {boolean} props.isLoading - Loading state.
 * @param {(id?: string | null) => void} props.onWriteTrail - Callback to create or edit a trail.
 * @param {(id: string) => void} props.onEditMapPins - Callback to open the visual pin editor.
 * @returns {React.ReactElement} The scrollable trail list component.
 */
const TESTCREATETRAIL = ({
    onViewTrail,
    trails,
    isLoading,
    onWriteTrail,
    onEditMapPins,
}: ScreenParams) => {
    return(
        <ScrollView contentContainerStyle={styles.container}>
            <TouchableOpacity 
                style={styles.addButton} 
                onPress={() => onWriteTrail()}
                activeOpacity={0.8}
            >
                <MaterialIcons name="add" size={20} color="#FFF" />
                <Text style={styles.addButtonText}>ADD NEW TRAIL</Text>
            </TouchableOpacity>

            { !isLoading 
                ? trails.map((t) => {
                    const pointCount = t.offlinePoints?.length || 0;
                    return (
                        <View key={t.id} style={styles.trailCard}>
                            <View style={styles.cardInfo}>
                                <View style={styles.titleRow}>
                                    <Text style={styles.trailName}>{t.general?.name || "Unnamed Trail"}</Text>
                                </View>
                                
                                <Text style={styles.provinceText}>
                                    <MaterialIcons name="location-on" size={14} color="#666" />{" "}
                                    {t.general?.province?.join(', ') || "Unknown Province"}
                                </Text>

                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <MaterialIcons name="directions-walk" size={14} color="#666" />
                                        <Text style={styles.statText}>{t.difficulty?.length || 0} km</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <MaterialIcons name="pin-drop" size={14} color="#1A73E8" />
                                        <Text style={[styles.statText, { color: "#1A73E8", fontWeight: "600" }]}>
                                            {pointCount} map pin{pointCount !== 1 ? "s" : ""}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.actionsDivider} />

                            <View style={styles.cardActions}>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, styles.borderRight]} 
                                    onPress={() => onViewTrail(t.id)}
                                    activeOpacity={0.7}
                                >
                                    <MaterialIcons name="visibility" size={16} color="#5F6368" />
                                    <Text style={styles.actionBtnText}>Preview</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.actionBtn, styles.borderRight]} 
                                    onPress={() => onWriteTrail(t.id)}
                                    activeOpacity={0.7}
                                >
                                    <MaterialIcons name="edit" size={16} color="#5F6368" />
                                    <Text style={styles.actionBtnText}>Edit Info</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.actionBtn, styles.mapBtn]} 
                                    onPress={() => onEditMapPins(t.id)}
                                    activeOpacity={0.7}
                                >
                                    <MaterialIcons name="map" size={16} color="#FFF" />
                                    <Text style={styles.mapBtnText}>Map Pins</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })
                : <Text style={styles.loadingText}>Loading Trails...</Text>
            }

            <View style={{margin: 50}}/>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 16,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    addButtonText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 14,
        letterSpacing: 0.5,
    },
    trailCard: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        overflow: "hidden",
    },
    cardInfo: {
        padding: 16,
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    trailName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        flex: 1,
        marginRight: 8,
    },
    difficultyBadge: {
        backgroundColor: "#E8F5E9",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 0.5,
        borderColor: "#A5D6A7",
    },
    difficultyText: {
        fontSize: 11,
        color: "#2E7D32",
        fontWeight: "bold",
        textTransform: "capitalize",
    },
    provinceText: {
        fontSize: 13,
        color: "#666",
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statText: {
        fontSize: 13,
        color: "#5F6368",
    },
    statDivider: {
        width: 1,
        height: 12,
        backgroundColor: "#D9D9D9",
    },
    actionsDivider: {
        height: 1,
        backgroundColor: "#EAEAEA",
    },
    cardActions: {
        flexDirection: "row",
        backgroundColor: "#FAFBFB",
    },
    actionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
    },
    borderRight: {
        borderRightWidth: 1,
        borderRightColor: "#EAEAEA",
    },
    actionBtnText: {
        fontSize: 12,
        color: "#5F6368",
        fontWeight: "600",
    },
    mapBtn: {
        backgroundColor: Colors.PRIMARY,
    },
    mapBtnText: {
        fontSize: 12,
        color: "#FFF",
        fontWeight: "bold",
    },
    loadingText: {
        textAlign: "center",
        color: "#666",
        marginTop: 20,
    },
});