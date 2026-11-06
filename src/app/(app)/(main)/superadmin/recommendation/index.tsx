/**
 * @file index.tsx
 * @description Orchestrator screen for the Superadmin Recommendation Datasets.
 * Coordinates dataset hooks, switches between domain dataset components (Trails, Users),
 * provides THARESYS recommendation engine configuration & batch execution modal, and user recommendation inspect viewer.
 */

import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import { useSuperadminDomain, useSuperadminNavigation } from "@/src/core/models/Superadmin/Superadmin";
import SuperadminShell from "@/src/features/SuperAdmin/components/SuperadminShell";
import { useBreakpoints } from "@/src/hooks/useBreakpoints";
import core from "@/src/recommendation/core";
import { useState, useMemo, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RecommendationRepo } from "@/src/core/models/Recommendation/Recommendation";
import getRecoID from "@/src/core/utility/recommendation";
import {
    ConfigureEngineModal,
    RecommendationMatrix,
    SimulationDataset,
    TrailDataset,
    UserDataset,
} from "../../../../../recommendation/components";

type DatasetType = "trails" | "users" | "recommendations" | "simulation";

export default function RecommendationDatasetScreen() {
    const { isMobile } = useBreakpoints();
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
    const [hasVisitedRecommendations, setHasVisitedRecommendations] = useState<boolean>(false);
    const [hasVisitedSimulation, setHasVisitedSimulation] = useState<boolean>(false);

    // THARESYS Recommendations Matrix state
    const [activeMonth, setActiveMonth] = useState<string>(getRecoID());
    const [recommendationsMap, setRecommendationsMap] = useState<Record<string, any>>({});
    const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(false);

    // THARESYS Engine Modal state
    const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

    // Selected Users for targeted recommendation generation
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    const handleToggleSelectUser = useCallback((userId: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    }, []);

    const handleSelectAllUsers = useCallback((userIds: string[]) => {
        setSelectedUserIds(userIds);
    }, []);

    const handleClearSelectedUsers = useCallback(() => {
        setSelectedUserIds([]);
    }, []);

    const selectedUserNames = useMemo(() => {
        const map = new Map(
            users.map((u) => [
                u.id,
                `${u.firstname || ""} ${u.lastname || ""}`.trim() || u.username || u.id,
            ])
        );
        return selectedUserIds.map((id) => map.get(id) || id);
    }, [users, selectedUserIds]);

    const fetchAllRecommendationsForMonth = useCallback(
        async (monthId: string) => {
            setIsLoadingRecommendations(true);
            try {
                const map: Record<string, any> = {};
                const profiledUsers = users.filter((u) => !!u.profile);
                await Promise.all(
                    profiledUsers.map(async (u) => {
                        try {
                            const reco = await RecommendationRepo.fetchByMonth(u.id, monthId);
                            if (reco) {
                                map[u.id] = reco;
                            }
                        } catch (err) {
                            console.warn(`Failed fetching recommendations for user ${u.id}:`, err);
                        }
                    })
                );
                setRecommendationsMap(map);
            } catch (err) {
                console.error("Failed fetching recommendations:", err);
            } finally {
                setIsLoadingRecommendations(false);
            }
        },
        [users]
    );

    const handleSwitchTab = (tab: DatasetType) => {
        setActiveDataset(tab);
        if (tab === "users" && !hasVisitedUsers) {
            setHasVisitedUsers(true);
        }
        if (tab === "recommendations" && !hasVisitedRecommendations) {
            setHasVisitedRecommendations(true);
            if (Object.keys(recommendationsMap).length === 0) {
                fetchAllRecommendationsForMonth(activeMonth);
            }
        }
        if (tab === "simulation" && !hasVisitedSimulation) {
            setHasVisitedSimulation(true);
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
                        style={[
                            styles.runEngineBtn,
                            selectedUserIds.length > 0 && styles.runEngineBtnSelected,
                            isMobile && styles.iconOnlyBtn,
                        ]}
                        onPress={() => setIsConfigModalOpen(true)}
                        accessibilityLabel="Configure and run THARESYS recommendation engine"
                    >
                        <CustomIcon library="Feather" name="cpu" size={15} color={Colors.WHITE} />
                        {!isMobile && (
                            <Text style={styles.runEngineBtnText}>
                                {selectedUserIds.length > 0
                                    ? `Run Engine (${selectedUserIds.length})`
                                    : "Run Engine"}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.refreshButton, isMobile && styles.iconOnlyBtn]}
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
                        {!isMobile && (
                            <Text style={[styles.refreshText, isLoading && { color: Colors.GRAY }]}>
                                {isLoading ? "Fetching..." : "Refresh"}
                            </Text>
                        )}
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

                    <TouchableOpacity
                        style={[
                            styles.switcherTab,
                            activeDataset === "recommendations" && styles.switcherTabActive,
                        ]}
                        onPress={() => handleSwitchTab("recommendations")}
                    >
                        <CustomIcon
                            library="Feather"
                            name="grid"
                            size={16}
                            color={activeDataset === "recommendations" ? Colors.WHITE : Colors.TEXT_SECONDARY}
                        />
                        <Text
                            style={[
                                styles.switcherLabel,
                                activeDataset === "recommendations" && styles.switcherLabelActive,
                            ]}
                        >
                            Recommendations
                        </Text>
                        <View
                            style={[
                                styles.badgeCount,
                                activeDataset === "recommendations" && styles.badgeCountActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.badgeCountText,
                                    activeDataset === "recommendations" && styles.badgeCountTextActive,
                                ]}
                            >
                                {Object.keys(recommendationsMap).length}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.switcherTab,
                            activeDataset === "simulation" && styles.switcherTabActive,
                        ]}
                        onPress={() => handleSwitchTab("simulation")}
                    >
                        <CustomIcon
                            library="Feather"
                            name="activity"
                            size={16}
                            color={activeDataset === "simulation" ? Colors.WHITE : Colors.TEXT_SECONDARY}
                        />
                        <Text
                            style={[
                                styles.switcherLabel,
                                activeDataset === "simulation" && styles.switcherLabelActive,
                            ]}
                        >
                            Simulation
                        </Text>
                        <View
                            style={[
                                styles.badgeCount,
                                activeDataset === "simulation" && styles.badgeCountActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.badgeCountText,
                                    activeDataset === "simulation" && styles.badgeCountTextActive,
                                ]}
                            >
                                24
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
                            selectedUserIds={selectedUserIds}
                            onToggleSelectUser={handleToggleSelectUser}
                            onSelectAllUsers={handleSelectAllUsers}
                            onClearSelectedUsers={handleClearSelectedUsers}
                        />
                    </View>
                )}

                {hasVisitedRecommendations && (
                    <View
                        style={[
                            styles.datasetSection,
                            activeDataset !== "recommendations" && styles.hiddenDataset,
                        ]}
                    >
                        <RecommendationMatrix
                            trails={trails}
                            users={users}
                            recommendationsMap={recommendationsMap}
                            isLoading={isLoadingRecommendations}
                            activeMonth={activeMonth}
                            onMonthChange={(m) => {
                                setActiveMonth(m);
                                fetchAllRecommendationsForMonth(m);
                            }}
                            onRefresh={() => fetchAllRecommendationsForMonth(activeMonth)}
                            onRunEnginePress={() => setIsConfigModalOpen(true)}
                        />
                    </View>
                )}

                {hasVisitedSimulation && (
                    <View
                        style={[
                            styles.datasetSection,
                            activeDataset !== "simulation" && styles.hiddenDataset,
                        ]}
                    >
                        <SimulationDataset />
                    </View>
                )}
            </View>

            {/* Modal: THARESYS Engine Configuration & Execution */}
            <ConfigureEngineModal
                visible={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                userCount={eligibleUsersCount}
                trailCount={trails.length}
                selectedUserIds={selectedUserIds}
                selectedUserNames={selectedUserNames}
                onClearSelectedUsers={handleClearSelectedUsers}
                onSuccess={(report) => {
                    refresh();
                    if (report?.recommendations && Object.keys(report.recommendations).length > 0) {
                        setRecommendationsMap((prev) => ({
                            ...prev,
                            ...report.recommendations,
                        }));
                    } else {
                        fetchAllRecommendationsForMonth(activeMonth);
                    }
                    // Automatically navigate to Recommendations Matrix tab to see newly generated results
                    setHasVisitedRecommendations(true);
                    setActiveDataset("recommendations");
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
    runEngineBtnSelected: {
        backgroundColor: Palette.Green700,
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
    iconOnlyBtn: {
        width: 36,
        height: 36,
        paddingHorizontal: 0,
        paddingVertical: 0,
        justifyContent: "center",
        alignItems: "center",
        gap: 0,
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
