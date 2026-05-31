import { Colors } from "@/src/constants/colors";
import { IOfflinePoint } from "@/src/core/models/Trail/Trail.types";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  GestureResponderEvent,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ResumableZoom } from "react-native-zoom-toolkit";
import { getStaticMapAsset } from "./trailMapAssets";

interface StaticTrailMapProps {
  trailId: string;
  trailName?: string;
  offlinePoints: IOfflinePoint[];
  isEditable?: boolean;
  onChange?: (points: IOfflinePoint[]) => void;
  onGestureActive?: (active: boolean) => void;
}

const PIN_TYPES = [
  { value: "summit", label: "Summit", icon: "flag", color: "#D32F2F" },
  {
    value: "checkpoint",
    label: "Checkpoint",
    icon: "location-on",
    color: "#F57C00",
  },
  {
    value: "viewpoint",
    label: "Viewpoint",
    icon: "visibility",
    color: "#388E3C",
  },
  {
    value: "water",
    label: "Water Source",
    icon: "local-drink",
    color: "#1976D2",
  },
  { value: "shelter", label: "Shelter", icon: "home", color: "#795548" },
  {
    value: "hazard",
    label: "Hazard Warning",
    icon: "warning",
    color: "#E65100",
  },
] as const;

type PinType = (typeof PIN_TYPES)[number]["value"];

/**
 * StaticTrailMap component.
 * Displays a static trail map background with overlayed trail pin indicators.
 * Supports zoom/pan via ResumableZoom, full screen mode, and interactive pin placement,
 * editing, and deletion when in editable mode.
 * 
 * @param {StaticTrailMapProps} props - Component properties.
 * @param {string} props.trailId - The ID of the trail. Used to resolve map assets.
 * @param {string} [props.trailName] - Name of the trail.
 * @param {IOfflinePoint[]} props.offlinePoints - Array of offline point/pin objects.
 * @param {boolean} [props.isEditable=false] - Whether map pins can be added, updated, or deleted.
 * @param {function} [props.onChange] - Callback triggered when the points list is modified.
 * @param {function} [props.onGestureActive] - Callback triggered on active gesture.
 * @returns {React.ReactElement} The static trail map component.
 */
export default function StaticTrailMap({
  trailId,
  trailName,
  offlinePoints = [],
  isEditable = false,
  onChange,
  onGestureActive,
}: StaticTrailMapProps) {
  const [containerLayout, setContainerLayout] = useState({
    width: 0,
    height: 0,
  });
  const [selectedPoint, setSelectedPoint] = useState<IOfflinePoint | null>(
    null,
  );

  // Fullscreen States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenLayout, setFullscreenLayout] = useState({
    width: 0,
    height: 0,
  });

  // Editor States
  const [editorModalVisible, setEditorModalVisible] = useState(false);
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  const [draftCoords, setDraftCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftType, setDraftType] = useState<PinType>("checkpoint");
  const [draftDescription, setDraftDescription] = useState("");

  const mapAsset = getStaticMapAsset(trailId, trailName);

  const handleContainerLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContainerLayout({ width, height });
    }
  };

  const handleFullscreenLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setFullscreenLayout({ width, height });
    }
  };

  const handleMapPress = (event: GestureResponderEvent) => {
    if (!isEditable) return;

    // Read tap position relative to the container layout
    const { locationX, locationY } = event.nativeEvent;
    const layout = isFullscreen ? fullscreenLayout : containerLayout;
    if (layout.width === 0 || layout.height === 0) return;

    const x = (locationX / layout.width) * 100;
    const y = (locationY / layout.height) * 100;

    // Reset draft fields and show modal
    setDraftCoords({ x, y });
    setDraftName("");
    setDraftType("checkpoint");
    setDraftDescription("");
    setEditorModalVisible(true);
  };

  const handleSavePoint = () => {
    if (!draftName.trim()) {
      Alert.alert("Required Field", "Please enter a name for the map point.");
      return;
    }

    if (editingPointId) {
      const updatedPoints = offlinePoints.map((p) => {
        if (p.id === editingPointId) {
          return {
            ...p,
            name: draftName.trim(),
            type: draftType,
            description: draftDescription.trim(),
          };
        }
        return p;
      });
      onChange?.(updatedPoints);

      // Update selectedPoint state so the details card updates immediately
      if (selectedPoint && selectedPoint.id === editingPointId) {
        setSelectedPoint({
          ...selectedPoint,
          name: draftName.trim(),
          type: draftType,
          description: draftDescription.trim(),
        });
      }
    } else {
      if (!draftCoords) return;
      const newPoint: IOfflinePoint = {
        id: Date.now().toString(),
        name: draftName.trim(),
        type: draftType,
        description: draftDescription.trim(),
        x: Math.round(draftCoords.x * 100) / 100,
        y: Math.round(draftCoords.y * 100) / 100,
      };

      const updatedPoints = [...offlinePoints, newPoint];
      onChange?.(updatedPoints);
    }

    setEditorModalVisible(false);
    setDraftCoords(null);
    setEditingPointId(null);
  };

  const handleEditPointPress = (point: IOfflinePoint) => {
    setEditingPointId(point.id);
    setDraftName(point.name);
    setDraftType(point.type as PinType);
    setDraftDescription(point.description || "");
    setEditorModalVisible(true);
  };

  const handleDeletePoint = (point: IOfflinePoint) => {
    Alert.alert(
      "Delete Map Point",
      `Are you sure you want to delete "${point.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedPoints = offlinePoints.filter(
              (p) => p.id !== point.id,
            );
            onChange?.(updatedPoints);
            setSelectedPoint(null);
          },
        },
      ],
    );
  };

  const handleLongPressPin = (point: IOfflinePoint) => {
    if (!isEditable) return;
    handleDeletePoint(point);
  };

  const getPinConfig = (type: string) => {
    return PIN_TYPES.find((t) => t.value === type) || PIN_TYPES[1]; // default checkpoint
  };

  const renderMapContent = () => {
    const layout = isFullscreen ? fullscreenLayout : containerLayout;

    return (
      <View style={{ flex: 1, position: "relative" }}>
        <ResumableZoom style={styles.zoomContainer} maxScale={5}>
          <View
            style={[
              styles.mapContainer,
              { width: layout.width, height: layout.height },
            ]}
          >
            <Pressable
              onPress={handleMapPress}
              style={{ width: "100%", height: "100%" }}
            >
              <Image
                source={mapAsset}
                style={styles.mapImage}
                resizeMode="contain"
              />
            </Pressable>

            {/* Render pins absolute-positioned based on layout percentages */}
            {offlinePoints.map((point) => {
              const config = getPinConfig(point.type);
              return (
                <TouchableOpacity
                  key={point.id}
                  style={[
                    styles.pinWrapper,
                    {
                      left: `${point.x}%`,
                      top: `${point.y}%`,
                    },
                  ]}
                  onPress={() => setSelectedPoint(point)}
                  onLongPress={() => handleLongPressPin(point)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.pinCircle,
                      { backgroundColor: config.color },
                    ]}
                  >
                    <MaterialIcons name={config.icon} size={11} color="#FFF" />
                  </View>
                  <View style={styles.pinTriangle} />
                </TouchableOpacity>
              );
            })}
          </View>
        </ResumableZoom>

        {/* Detail Bottom Card inside active viewport */}
        {selectedPoint && (
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View
                  style={[
                    styles.cardIconBadge,
                    { backgroundColor: getPinConfig(selectedPoint.type).color },
                  ]}
                >
                  <MaterialIcons
                    name={getPinConfig(selectedPoint.type).icon}
                    size={18}
                    color="#FFF"
                  />
                </View>
                <View>
                  <Text style={styles.cardTitle}>{selectedPoint.name}</Text>
                  <Text style={styles.cardSubtitle}>
                    {getPinConfig(selectedPoint.type).label}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeCardBtn}
                onPress={() => setSelectedPoint(null)}
              >
                <MaterialIcons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.cardDescription}>
              {selectedPoint.description ||
                "No description provided for this point."}
            </Text>

            {isEditable && (
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={[styles.cardActionBtn, styles.cardEditBtn]}
                  onPress={() => handleEditPointPress(selectedPoint)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="edit" size={16} color="#FFF" />
                  <Text style={styles.cardEditBtnText}>Edit Info</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cardActionBtn, styles.cardDeleteBtn]}
                  onPress={() => handleDeletePoint(selectedPoint)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="delete" size={16} color="#C5221F" />
                  <Text style={styles.cardDeleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView
      style={styles.container}
      onLayout={handleContainerLayout}
      onTouchStart={() => !isFullscreen && onGestureActive?.(true)}
      onTouchEnd={() => !isFullscreen && onGestureActive?.(false)}
      onTouchCancel={() => !isFullscreen && onGestureActive?.(false)}
    >
      {containerLayout.width > 0 && containerLayout.height > 0 ? (
        <View style={{ flex: 1, position: "relative" }}>
          {renderMapContent()}

          {/* Fullscreen Expand Button */}
          {!isFullscreen && (
            <TouchableOpacity
              style={styles.fullscreenBtn}
              onPress={() => setIsFullscreen(true)}
            >
              <MaterialIcons name="fullscreen" size={24} color="#333" />
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* Fullscreen Modal View */}
      <Modal
        visible={isFullscreen}
        animationType="slide"
        onRequestClose={() => setIsFullscreen(false)}
      >
        <GestureHandlerRootView
          style={styles.fullscreenContainer}
          onLayout={handleFullscreenLayout}
        >
          {fullscreenLayout.width > 0 && fullscreenLayout.height > 0 ? (
            <View style={{ flex: 1, backgroundColor: "#EBEFF2" }}>
              {renderMapContent()}

              {/* Floating Minimize Button */}
              <TouchableOpacity
                style={styles.minimizeBtn}
                onPress={() => setIsFullscreen(false)}
              >
                <MaterialIcons name="fullscreen-exit" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          ) : null}
        </GestureHandlerRootView>
      </Modal>

      {/* Editor Modal for Adding/Editing a Point */}
      <Modal
        visible={editorModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setEditorModalVisible(false);
          setEditingPointId(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPointId ? "Edit Map Point" : "Add Map Point"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setEditorModalVisible(false);
                  setEditingPointId(null);
                }}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Point Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Campsite 1, Scenic Overlook"
                value={draftName}
                onChangeText={setDraftName}
              />

              <Text style={styles.inputLabel}>Point Type</Text>
              <View style={styles.typeSelectorContainer}>
                {PIN_TYPES.map((typeOption) => {
                  const isSelected = draftType === typeOption.value;
                  return (
                    <TouchableOpacity
                      key={typeOption.value}
                      style={[
                        styles.typePill,
                        { borderColor: typeOption.color },
                        isSelected && { backgroundColor: typeOption.color },
                      ]}
                      onPress={() => setDraftType(typeOption.value)}
                    >
                      <MaterialIcons
                        name={typeOption.icon}
                        size={14}
                        color={isSelected ? "#FFF" : typeOption.color}
                      />
                      <Text
                        style={[
                          styles.typePillText,
                          { color: isSelected ? "#FFF" : "#333" },
                        ]}
                      >
                        {typeOption.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter details for hikers (e.g. water is drinkable, strong wind here)"
                value={draftDescription}
                onChangeText={setDraftDescription}
                multiline={true}
                numberOfLines={3}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnCancel]}
                  onPress={() => {
                    setEditorModalVisible(false);
                    setEditingPointId(null);
                  }}
                >
                  <Text style={styles.btnTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSave]}
                  onPress={handleSavePoint}
                >
                  <Text style={styles.btnTextSave}>
                    {editingPointId ? "Save Changes" : "Add Point"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FA",
    position: "relative",
  },
  zoomContainer: {
    width: "100%",
    height: "100%",
  },
  mapContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EBEFF2",
    overflow: "hidden",
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#EBEFF2",
  },
  fullscreenBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    zIndex: 10,
  },
  minimizeBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 100,
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  pinWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    // Offset standard: centers the pin circle (22px diameter) and accounts for the bottom tip pointer (4px)
    transform: [{ translateX: -11 }, { translateY: -25.5 }],
  },
  pinCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    opacity: 0.85,
  },
  pinTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomWidth: 4,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFF",
    transform: [{ rotate: "180deg" }],
    marginTop: -0.5,
    opacity: 0.85,
  },
  detailsCard: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#202124",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#70757a",
  },
  closeCardBtn: {
    padding: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#4A4A4A",
    lineHeight: 20,
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
    paddingTop: 12,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardEditBtn: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  cardEditBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 13,
  },
  cardDeleteBtn: {
    backgroundColor: "#FCE8E6",
    borderColor: "#FAD2CF",
  },
  cardDeleteBtnText: {
    color: "#C5221F",
    fontWeight: "bold",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalScroll: {
    gap: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5F6368",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DADCE0",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#333",
  },
  typeSelectorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#FFF",
  },
  typePillText: {
    fontSize: 12,
    fontWeight: "500",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnCancel: {
    backgroundColor: "#F1F3F4",
  },
  btnSave: {
    backgroundColor: Colors.PRIMARY,
  },
  btnTextCancel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#5F6368",
  },
  btnTextSave: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFF",
  },
});
