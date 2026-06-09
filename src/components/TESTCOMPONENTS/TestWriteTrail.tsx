import WriteComponent from "@/src/components/CustomWriteComponents";
import { Colors } from "@/src/constants/colors";
import { IUseTrailWrite } from "@/src/core/hook/trail/useTrailWrite";
import { ITrailFormField } from "@/src/fields/trailFields";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const TESTWRITETRAIL = (params: IUseTrailWrite) => {
  const {
    information,
    object: trail,
    error,
    isLoading,
    options,
    onSubmitPress,
    onRemovePress,
    onUpdatePress: onUpdateTrail,
  } = params;

  const general = information.filter((a: ITrailFormField) => a.section === "general");
  const geography = information.filter((a: ITrailFormField) => a.section === "geography");
  const tourism = information.filter((a: ITrailFormField) => a.section === "tourism");
  const difficulty = information.filter((a: ITrailFormField) => a.section === "difficulty");

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.group}>
          <WriteComponent
            informationSet={general}
            object={trail}
            optionSet={options}
            onEditProperty={onUpdateTrail}
          />
        </View>

        <View style={styles.group}>
          <WriteComponent
            informationSet={geography}
            object={trail}
            optionSet={options}
            onEditProperty={onUpdateTrail}
          />
        </View>

        <View style={styles.group}>
          <WriteComponent
            informationSet={difficulty}
            object={trail}
            optionSet={options}
            onEditProperty={onUpdateTrail}
          />
        </View>

        <View style={styles.group}>
          <WriteComponent
            informationSet={tourism}
            object={trail}
            optionSet={options}
            onEditProperty={onUpdateTrail}
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
        {isLoading && <Text style={styles.loadingText}>Saving...</Text>}

        <View style={styles.actionsContainer}>
          <Pressable style={[styles.btn, styles.btnSave]} onPress={onSubmitPress}>
            <Text style={styles.btnTextSave}>SAVE TRAIL</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnDelete]} onPress={() => onRemovePress(trail.id)}>
            <Text style={styles.btnTextDelete}>DELETE</Text>
          </Pressable>
        </View>

        <View style={{ margin: 50 }} />
      </ScrollView>
    </View>
  );
};

export default TESTWRITETRAIL;

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 24,
  },
  group: {
    padding: 10,
    marginHorizontal: 10,
    marginVertical: 6,
    backgroundColor: "#FFF",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  offlineMapBuilderCard: {
    margin: 10,
    padding: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.PRIMARY + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: 12,
    marginBottom: 14,
  },
  pointCountBadge: {
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#ADCCFC",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1A73E8",
  },
  builderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  builderButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  btnSave: {
    backgroundColor: Colors.PRIMARY,
  },
  btnDelete: {
    backgroundColor: "#FCE8E6",
    borderWidth: 1,
    borderColor: "#FAD2CF",
  },
  btnTextSave: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  btnTextDelete: {
    color: "#C5221F",
    fontWeight: "bold",
    fontSize: 15,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 8,
  },
  loadingText: {
    textAlign: "center",
    marginVertical: 8,
    color: "#666",
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
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
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
  },
  modalDoneBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});