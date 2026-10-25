/**
 * @file index.tsx
 * @description Orchestrator screen for the Superadmin Recommendation Datasets.
 * Coordinates dataset hooks, switches between domain dataset components (Trails, Users),
 * provides THARESYS recommendation engine configuration & batch execution modal, and user recommendation inspect viewer.
 */

import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import { useSuperadminDomain, useSuperadminNavigation } from "@/src/core/models/Superadmin/Superadmin";
import { User } from "@/src/core/models/User/User";
import SuperadminShell from "@/src/features/SuperAdmin/components/SuperadminShell";
import core from "@/src/recommendation/core";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
    ConfigureEngineModal,
    TrailDataset,
    UserDataset,
} from "../../../../../recommendation/components";

type DatasetType = "trails" | "users";

export default function RecommendationDatasetScreen() {
    const {
        trails,
        trailProfiles,
        startElevations,
        missingProfilesCount,
        isSyncingProfiles,
        users,
        hikes,
        reviews,
        hikesByUser,
        reviewsByUser,
        isLoading,
        error,
        refresh,
        syncProfilesToFirestore,
        generateUserProfile,
        saveUserProfile,
    } = core();

    const { pendingApplication } = useSuperadminDomain(null);
    const { onTabPress, onBackToSettingsPress } = useSuperadminNavigation();
    const pendingCount = pendingApplication?.length || 0;

    const [activeDataset, setActiveDataset] = useState<DatasetType>("trails");
    const [hasVisitedUsers, setHasVisitedUsers] = useState<boolean>(false);

    // THARESYS Engine Modal state
    const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

    const handleSwitchTab = (tab: DatasetType) => {
        setActiveDataset(tab);
        if (tab === "users" && !hasVisitedUsers) {
            setHasVisitedUsers(true);
        }
    };

    // Count of users who have a profile in Firestore (eligible for recommendations)
    const eligibleUsersCount = users.filter((u) => !!u.profile).length;

    return (
        <SuperadminShell
            activeTab="recommendation"
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={onBackToSettingsPress}
            noScroll={true}
            rightActions={
                <View style={styles.rightActionsRow}>
                    <TouchableOpacity
                        style={styles.runEngineBtn}
                        onPress={() => setIsConfigModalOpen(true)}
                        accessibilityLabel="Configure and run THARESYS recommendation engine"
                    >
                        <CustomIcon library="Feather" name="cpu" size={15} color={Colors.WHITE} />
                        <Text style={styles.runEngineBtnText}>Run Engine</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={() => refresh()}
                        disabled={isLoading}
                        accessibilityLabel="Refresh recommendation datasets"
                    >
                        <CustomIcon
                            library="Feather"
                            name="rotate-cw"
                            size={15}
                            color={isLoading ? Colors.GRAY : Colors.PRIMARY}
                        />
                        <Text style={[styles.refreshText, isLoading && { color: Colors.GRAY }]}>
                            {isLoading ? "Fetching..." : "Refresh"}
                        </Text>
                    </TouchableOpacity>
                </View>
            }
        >
            <View style={styles.container}>
                {/* Dataset Navigation Switcher */}
                <View style={styles.switcherContainer}>
                    <TouchableOpacity
                        style={[
                            styles.switcherTab,
                            activeDataset === "trails" && styles.switcherTabActive,
                        ]}
                        onPress={() => handleSwitchTab("trails")}
                    >
                        <CustomIcon
                            library="Feather"
                            name="map"
                            size={16}
                            color={activeDataset === "trails" ? Colors.WHITE : Colors.TEXT_SECONDARY}
                        />
                        <Text
                            style={[
                                styles.switcherLabel,
                                activeDataset === "trails" && styles.switcherLabelActive,
                            ]}
                        >
                            Trails Dataset
                        </Text>
                        <View
                            style={[
                                styles.badgeCount,
                                activeDataset === "trails" && styles.badgeCountActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.badgeCountText,
                                    activeDataset === "trails" && styles.badgeCountTextActive,
                                ]}
                            >
                                {trails.length}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.switcherTab,
                            activeDataset === "users" && styles.switcherTabActive,
                        ]}
                        onPress={() => handleSwitchTab("users")}
                    >
                        <CustomIcon
                            library="Feather"
                            name="users"
                            size={16}
                            color={activeDataset === "users" ? Colors.WHITE : Colors.TEXT_SECONDARY}
                        />
                        <Text
                            style={[
                                styles.switcherLabel,
                                activeDataset === "users" && styles.switcherLabelActive,
                            ]}
                        >
                            Users Dataset
                        </Text>
                        <View
                            style={[
                                styles.badgeCount,
                                activeDataset === "users" && styles.badgeCountActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.badgeCountText,
                                    activeDataset === "users" && styles.badgeCountTextActive,
                                ]}
                            >
                                {users.length}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Active Dataset Section with Instant Display Toggling */}
                <View style={[styles.datasetSection, activeDataset !== "trails" && styles.hiddenDataset]}>
                    <TrailDataset
                        trails={trails}
                        trailProfiles={trailProfiles}
                        startElevations={startElevations}
                        missingProfilesCount={missingProfilesCount}
                        isSyncingProfiles={isSyncingProfiles}
                        isLoading={isLoading}
                        error={error}
                        refresh={refresh}
                        syncProfilesToFirestore={syncProfilesToFirestore}
                    />
                </View>

                {hasVisitedUsers && (
                    <View style={[styles.datasetSection, activeDataset !== "users" && styles.hiddenDataset]}>
                        <UserDataset
                            users={users}
                            trails={trails}
                            startElevations={startElevations}
                            generateUserProfile={generateUserProfile}
                            saveUserProfile={saveUserProfile}
                            onRunEnginePress={() => setIsConfigModalOpen(true)}
                            hikes={hikes}
                            hikesByUser={hikesByUser}
                            reviews={reviews}
                            reviewsByUser={reviewsByUser}
                            isLoading={isLoading}
                            error={error}
                            refresh={refresh}
                        />
                    </View>
                )}
            </View>

            {/* Modal: THARESYS Engine Configuration & Execution */}
            <ConfigureEngineModal
                visible={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                userCount={eligibleUsersCount}
                trailCount={trails.length}
                onSuccess={() => {
                    refresh();
                }}
            />
        </SuperadminShell>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 12,
    },
    rightActionsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    runEngineBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: Colors.PRIMARY,
        shadowColor: Colors.PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
    },
    runEngineBtnText: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.WHITE,
    },
    switcherContainer: {
        flexDirection: "row",
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 6,
        gap: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    switcherTab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: Palette.Slate100,
    },
    switcherTabActive: {
        backgroundColor: Colors.PRIMARY,
    },
    switcherLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    switcherLabelActive: {
        color: Colors.WHITE,
    },
    badgeCount: {
        backgroundColor: Palette.Slate200,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeCountActive: {
        backgroundColor: "rgba(255, 255, 255, 0.25)",
    },
    badgeCountText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    badgeCountTextActive: {
        color: Colors.WHITE,
    },
    refreshButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green200,
    },
    refreshText: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.PRIMARY,
    },
    datasetSection: {
        flex: 1,
    },
    hiddenDataset: {
        display: "none",
    },
});
