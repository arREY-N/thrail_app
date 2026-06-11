import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import { Trail } from "@/src/core/models/Trail/Trail";
import { useTrailsStore } from "@/src/core/stores/trailStores/trailsStore";
import StaticTrailMap from "@/src/features/Map/StaticTrailMap";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * MapEditor page component.
 * Provides a dedicated, full-screen map interface for visually placing,
 * editing, and deleting offline trail map pins/points.
 * 
 * @returns {React.ReactElement} The visual map editor screen.
 */
export default function MapEditor() {
  const { trailId: rawTrailId } = useLocalSearchParams();
  const trailId = Array.isArray(rawTrailId) ? rawTrailId[0] : rawTrailId;

  const trails = useTrailsStore((s) => s.data);
  // const fetchAll = useTrailsStore((s) => s.fetchAll);
  const create = useTrailsStore((s) => s.create);
  const isLoadingStore = useTrailsStore((s) => s.isLoading);

  const activeTrail = trails.find((t) => t.id === trailId);
  const [offlinePoints, setOfflinePoints] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // useEffect(() => {
  //   if (trails.length === 0) {
  //     fetchAll();
  //   }
  // }, []);

  useEffect(() => {
    if (activeTrail) {
      setOfflinePoints(activeTrail.offlinePoints || []);
    }
  }, [activeTrail]);

  if (!activeTrail && isLoadingStore) {
    return (
      <ScreenWrapper backgroundColor="#FFF">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={styles.loadingText}>Loading trail details...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!activeTrail) {
    return (
      <ScreenWrapper backgroundColor="#FFF">
        <View style={styles.loadingContainer}>
          <MaterialIcons name="error-outline" size={48} color={Colors.ERROR} />
          <Text style={[styles.loadingText, { color: Colors.ERROR }]}>
            Trail details not found.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  /**
   * Persists the modified list of offline map points (pins) back to the trails store.
   * Updates the current active trail and navigates back upon success.
   * 
   * @async
   * @returns {Promise<void>}
   */
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedTrail = new Trail({
        ...activeTrail,
        offlinePoints: offlinePoints,
      });

      const success = await create(updatedTrail);
      if (success) {
        Alert.alert("Success", "Offline map points saved successfully.");
        router.back();
      } else {
        Alert.alert("Error", "Failed to update offline points.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save points.");
    } finally {
      setIsSaving(false);
    }
  };

  const pointCount = offlinePoints.length;

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 0 }]}>
      {/* Top Navigation Bar */}
      <View style={styles.modalBar}>
        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.modalTitle}>Visual Point Editor</Text>
          <Text style={styles.trailNameSubtitle}>
            {activeTrail.general?.name || activeTrail.name}
          </Text>
        </View>
        <View style={styles.pointCountBadge}>
          <Text style={styles.badgeText}>
            {pointCount} Pin{pointCount !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Editor Guide/Tips Bar */}
      <View style={styles.editorTipBar}>
        <MaterialIcons name="info-outline" size={16} color="#666" />
        <Text style={styles.editorTipText}>
          Tap the map to place a pin. Tap a pin to edit details. Long-press a pin to delete it.
        </Text>
      </View>

      {/* Static Map Viewport */}
      <View style={{ flex: 1 }}>
        <StaticTrailMap
          trailId={activeTrail.id}
          trailName={activeTrail.general?.name || activeTrail.name}
          offlinePoints={offlinePoints}
          isEditable={true}
          onChange={(updatedPoints) => setOfflinePoints(updatedPoints)}
        />
      </View>

      {/* Save Action Bar */}
      <TouchableOpacity
        style={[styles.modalDoneBtn, isSaving && styles.btnDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.modalDoneBtnText}>Save Offline Points</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  backBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 8,
  },
  backBtnText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  modalBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    backgroundColor: "#FFF",
    paddingHorizontal: 8,
  },
  modalCloseBtn: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  trailNameSubtitle: {
    fontSize: 11,
    color: "#666",
    marginTop: 1,
  },
  pointCountBadge: {
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#ADCCFC",
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1A73E8",
  },
  editorTipBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8F9FA",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  editorTipText: {
    fontSize: 11,
    color: "#5F6368",
    flex: 1,
  },
  modalDoneBtn: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  modalDoneBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  btnDisabled: {
    backgroundColor: "#A5D6A7",
  },
});
