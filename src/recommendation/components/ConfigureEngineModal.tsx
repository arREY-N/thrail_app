import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import getRecoID from "@/src/core/utility/recommendation";
import {
    CANONICAL_FEATURE_CONFIG,
    CATEGORY_GROUPS,
    CategoryGroupId,
    checkTarsHealth,
    DEFAULT_ENGINE_HYPERPARAMETERS,
    runTarsEngine,
    TarsBatchResponse
} from "@/src/features/SuperAdmin/services/tarsApiService";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export interface ConfigureEngineModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: (report: TarsBatchResponse) => void;
    userCount?: number;
    trailCount?: number;
    selectedUserIds?: string[];
    selectedUserNames?: string[];
    onClearSelectedUsers?: () => void;
}

type FormulaType = "GD" | "ED" | "CS";

const FORMULAS: { id: FormulaType; name: string; desc: string }[] = [
    { id: "GD", name: "Gower's Distance (GD)", desc: "Normalizes each feature difference naturally into [0.0, 1.0]." },
    { id: "ED", name: "Normalized Euclidean (ED)", desc: "Root Mean Squared Difference across all 28 features in [0.0, 1.0]." },
    { id: "CS", name: "Cosine Distance (CS)", desc: "1.0 - Cosine Similarity, measuring profile directional alignment." },
];

export default function ConfigureEngineModal({
    visible,
    onClose,
    onSuccess,
    userCount,
    trailCount,
    selectedUserIds = [],
    selectedUserNames = [],
    onClearSelectedUsers,
}: ConfigureEngineModalProps) {
    const [cbfEngine, setCbfEngine] = useState<FormulaType>("GD");
    const [cfEngine, setCfEngine] = useState<FormulaType>("GD");
    const [monthId, setMonthId] = useState<string>(getRecoID());
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<TarsBatchResponse | null>(null);

    // Adjustable Hyperparameters (defaulting to engine/parameters.py values)
    const [cfTau, setCfTau] = useState<string>(String(DEFAULT_ENGINE_HYPERPARAMETERS.cf_tau));
    const [cfK, setCfK] = useState<string>(String(DEFAULT_ENGINE_HYPERPARAMETERS.cf_k));
    const [alphaSteadyState, setAlphaSteadyState] = useState<string>(String(DEFAULT_ENGINE_HYPERPARAMETERS.alpha_steady_state));
    const [alphaThreshold, setAlphaThreshold] = useState<string>(String(DEFAULT_ENGINE_HYPERPARAMETERS.alpha_threshold));
    const [alphaOverride, setAlphaOverride] = useState<string>("");
    const [betaDivisor, setBetaDivisor] = useState<string>(String(DEFAULT_ENGINE_HYPERPARAMETERS.beta_divisor));
    const [monotonicityMinGap, setMonotonicityMinGap] = useState<string>(String(DEFAULT_ENGINE_HYPERPARAMETERS.monotonicity_min_gap));
    const [reviewActiveWeight, setReviewActiveWeight] = useState<string>(String(DEFAULT_ENGINE_HYPERPARAMETERS.review_active_weight));
    const [reviewBaselineWeight, setReviewBaselineWeight] = useState<string>(String(DEFAULT_ENGINE_HYPERPARAMETERS.review_baseline_weight));
    const [terrainThreshold, setTerrainThreshold] = useState<string>(String(DEFAULT_ENGINE_HYPERPARAMETERS.terrain_presence_threshold));
    const [commitToFirestore, setCommitToFirestore] = useState<boolean>(true);
    const [generateAiReasoning, setGenerateAiReasoning] = useState<boolean>(true);

    const handleResetHyperparameters = () => {
        if (isRunning) return;
        setCfTau(String(DEFAULT_ENGINE_HYPERPARAMETERS.cf_tau));
        setCfK(String(DEFAULT_ENGINE_HYPERPARAMETERS.cf_k));
        setAlphaSteadyState(String(DEFAULT_ENGINE_HYPERPARAMETERS.alpha_steady_state));
        setAlphaThreshold(String(DEFAULT_ENGINE_HYPERPARAMETERS.alpha_threshold));
        setAlphaOverride("");
        setBetaDivisor(String(DEFAULT_ENGINE_HYPERPARAMETERS.beta_divisor));
        setMonotonicityMinGap(String(DEFAULT_ENGINE_HYPERPARAMETERS.monotonicity_min_gap));
        setReviewActiveWeight(String(DEFAULT_ENGINE_HYPERPARAMETERS.review_active_weight));
        setReviewBaselineWeight(String(DEFAULT_ENGINE_HYPERPARAMETERS.review_baseline_weight));
        setTerrainThreshold(String(DEFAULT_ENGINE_HYPERPARAMETERS.terrain_presence_threshold));
        setGenerateAiReasoning(true);
    };

    // 5 Category Groups State
    const [categoryWeights, setCategoryWeights] = useState<Record<CategoryGroupId, string>>(() => {
        const initial: Record<CategoryGroupId, string> = {
            physical: "50.00",
            terrain: "20.00",
            route: "15.00",
            province: "10.00",
            scenery_amenities: "5.00",
        };
        return initial;
    });

    const [categoryEnabled, setCategoryEnabled] = useState<Record<CategoryGroupId, boolean>>({
        physical: true,
        terrain: true,
        province: true,
        route: true,
        scenery_amenities: true,
    });

    const [featureEnabled, setFeatureEnabled] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        for (const f of CANONICAL_FEATURE_CONFIG) {
            initial[f.key] = true;
        }
        return initial;
    });

    const [expandedCategories, setExpandedCategories] = useState<Record<CategoryGroupId, boolean>>({
        physical: false,
        terrain: false,
        province: false,
        route: false,
        scenery_amenities: false,
    });

    // Backend health state
    const [healthStatus, setHealthStatus] = useState<"checking" | "online" | "offline">("checking");
    const [healthMsg, setHealthMsg] = useState<string>("");

    const verifyHealth = async () => {
        setHealthStatus("checking");
        const res = await checkTarsHealth();
        if (res.healthy) {
            setHealthStatus("online");
            setHealthMsg(res.message);
        } else {
            setHealthStatus("offline");
            setHealthMsg(res.message);
        }
    };

    useEffect(() => {
        if (visible) {
            setError(null);
            setReport(null);
            setMonthId(getRecoID());
            verifyHealth();
        }
    }, [visible]);

    // Dynamic Feature Weight Compilation & Total Statistics
    const {
        compiledWeights,
        totalWeight,
        activeCategoryCount,
        activeFeatureCount,
        physicalWeightPct,
        isWeightValid,
    } = useMemo(() => {
        let total = 0;
        let activeCats = 0;
        let activeFeats = 0;
        const weightsMap: Record<string, number> = {};

        for (const group of CATEGORY_GROUPS) {
            const isCatActive = categoryEnabled[group.id];
            const catWeight = isCatActive ? (parseFloat(categoryWeights[group.id]) || 0) : 0;
            total += catWeight;
            if (isCatActive && catWeight > 0) activeCats += 1;

            // Features belonging to this group
            const featsInGroup = CANONICAL_FEATURE_CONFIG.filter(
                (f) => f.categoryGroupId === group.id
            );
            const activeInGroup = featsInGroup.filter(
                (f) => isCatActive && featureEnabled[f.key]
            );
            activeFeats += activeInGroup.length;

            if (!isCatActive || activeInGroup.length === 0 || catWeight <= 0) {
                featsInGroup.forEach((f) => {
                    weightsMap[f.key] = 0.0;
                });
            } else {
                // Proportional distribution among active features in this category
                const defaultSumActive = activeInGroup.reduce(
                    (acc, f) => acc + f.defaultWeight,
                    0
                );
                featsInGroup.forEach((f) => {
                    if (isCatActive && featureEnabled[f.key]) {
                        const proportion =
                            defaultSumActive > 0
                                ? f.defaultWeight / defaultSumActive
                                : 1 / activeInGroup.length;
                        weightsMap[f.key] =
                            Math.round(catWeight * proportion * 100) / 100;
                    } else {
                        weightsMap[f.key] = 0.0;
                    }
                });
            }
        }

        const roundedTotal = Math.round(total * 100) / 100;
        const physWeight = categoryEnabled.physical
            ? parseFloat(categoryWeights.physical) || 0
            : 0;
        const physPct =
            total > 0 ? Math.round((physWeight / total) * 100) : 0;

        return {
            compiledWeights: weightsMap,
            totalWeight: roundedTotal.toFixed(2),
            activeCategoryCount: activeCats,
            activeFeatureCount: activeFeats,
            physicalWeightPct: physPct,
            isWeightValid: Math.abs(roundedTotal - 100.00) <= 0.05,
        };
    }, [categoryWeights, categoryEnabled, featureEnabled]);

    // Handlers
    const handleCategoryWeightChange = (groupId: CategoryGroupId, text: string) => {
        if (isRunning) return;
        setCategoryWeights((prev) => ({
            ...prev,
            [groupId]: text,
        }));
    };

    const handleToggleCategory = (groupId: CategoryGroupId) => {
        if (isRunning) return;
        setCategoryEnabled((prev) => ({
            ...prev,
            [groupId]: !prev[groupId],
        }));
    };

    const toggleExpandCategory = (groupId: CategoryGroupId) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [groupId]: !prev[groupId],
        }));
    };

    const handleToggleFeature = (featKey: string) => {
        if (isRunning) return;
        setFeatureEnabled((prev) => ({
            ...prev,
            [featKey]: !prev[featKey],
        }));
    };

    const handleResetCategoryDefault = (groupId: CategoryGroupId) => {
        if (isRunning) return;
        const group = CATEGORY_GROUPS.find((g) => g.id === groupId);
        if (!group) return;
        setCategoryWeights((prev) => ({
            ...prev,
            [groupId]: group.defaultWeight.toFixed(2),
        }));
        setCategoryEnabled((prev) => ({
            ...prev,
            [groupId]: true,
        }));
    };

    const handleResetAllDefaults = () => {
        if (isRunning) return;
        const resetWeights: Record<CategoryGroupId, string> = {
            physical: "50.00",
            terrain: "20.00",
            route: "15.00",
            province: "10.00",
            scenery_amenities: "5.00",
        };
        const resetCatEnabled: Record<CategoryGroupId, boolean> = {
            physical: true,
            terrain: true,
            route: true,
            province: true,
            scenery_amenities: true,
        };
        const resetFeatEnabled: Record<string, boolean> = {};
        for (const f of CANONICAL_FEATURE_CONFIG) {
            resetFeatEnabled[f.key] = true;
        }
        setCategoryWeights(resetWeights);
        setCategoryEnabled(resetCatEnabled);
        setFeatureEnabled(resetFeatEnabled);
    };

    const handleBalanceTo100 = () => {
        if (isRunning) return;
        let activeSum = 0;
        const activeGroups = CATEGORY_GROUPS.filter((g) => categoryEnabled[g.id]);

        for (const g of activeGroups) {
            const w = parseFloat(categoryWeights[g.id]) || 0;
            if (w > 0) activeSum += w;
        }

        if (activeGroups.length === 0 || activeSum <= 0) return;

        const updated: Record<CategoryGroupId, string> = { ...categoryWeights };
        let distributed = 0;

        activeGroups.forEach((g, i) => {
            const originalWeight = parseFloat(categoryWeights[g.id]) || 0;
            if (i === activeGroups.length - 1) {
                const lastWeight = Math.max(0, Math.round((100.00 - distributed) * 100) / 100);
                updated[g.id] = lastWeight.toFixed(2);
            } else {
                const proportional = Math.round(((originalWeight / activeSum) * 100) * 100) / 100;
                distributed += proportional;
                updated[g.id] = proportional.toFixed(2);
            }
        });

        setCategoryWeights(updated);
    };

    const handlePhysicalOnly = () => {
        if (isRunning) return;
        setCategoryWeights({
            physical: "55.00",
            terrain: "25.00",
            route: "20.00",
            province: "0.00",
            scenery_amenities: "0.00",
        });
        setCategoryEnabled({
            physical: true,
            terrain: true,
            route: true,
            province: false,
            scenery_amenities: false,
        });
    };

    const handleRunEngine = async () => {
        setError(null);
        setReport(null);

        const currentTotal = parseFloat(totalWeight);

        // Validation: total weight must be exactly 100.00%
        if (Math.abs(currentTotal - 100.00) > 0.05) {
            const diff = (100.00 - currentTotal).toFixed(2);
            const diffMsg = currentTotal < 100
                ? `${Math.abs(parseFloat(diff)).toFixed(2)}% unallocated`
                : `${Math.abs(parseFloat(diff)).toFixed(2)}% over allocated`;
            const errorMsg = `Weight Allocation Error: Total weight must equal exactly 100.00% (currently ${currentTotal.toFixed(2)}%, ${diffMsg}). All 100% of the weights should be used. Please adjust category weights or click 'Balance to 100%' / 'Reset Defaults' before generating recommendations.`;

            setError(errorMsg);
            Alert.alert(
                "100% Weight Allocation Required",
                `The recommendation engine requires all 100% of the feature weights to be allocated.\n\nCurrently allocated: ${currentTotal.toFixed(2)}% (${diffMsg})\n\nPlease adjust the category weights or tap "Balance to 100%" or "Reset Defaults" before running the engine.`
            );
            return;
        }

        setIsRunning(true);
        try {
            const parsedTau = parseFloat(cfTau);
            const parsedK = parseInt(cfK, 10);
            const parsedAlphaSS = parseFloat(alphaSteadyState);
            const parsedAlphaThresh = parseInt(alphaThreshold, 10);
            const parsedAlphaOverride = alphaOverride.trim() !== "" ? parseFloat(alphaOverride) : null;
            const parsedBetaDiv = parseFloat(betaDivisor);
            const parsedMinGap = parseFloat(monotonicityMinGap);
            const parsedActiveW = parseFloat(reviewActiveWeight);
            const parsedBaselineW = parseFloat(reviewBaselineWeight);
            const parsedTerrThresh = parseFloat(terrainThreshold);

            const result = await runTarsEngine({
                cbf_engine: cbfEngine,
                cf_engine: cfEngine,
                month_id: monthId.trim() || getRecoID(),
                commit_to_firestore: commitToFirestore,
                feature_weights: compiledWeights,
                cf_tau: !isNaN(parsedTau) ? parsedTau : DEFAULT_ENGINE_HYPERPARAMETERS.cf_tau,
                cf_k: !isNaN(parsedK) && parsedK > 0 ? parsedK : DEFAULT_ENGINE_HYPERPARAMETERS.cf_k,
                alpha_steady_state: !isNaN(parsedAlphaSS) ? parsedAlphaSS : DEFAULT_ENGINE_HYPERPARAMETERS.alpha_steady_state,
                alpha_threshold: !isNaN(parsedAlphaThresh) && parsedAlphaThresh > 1 ? parsedAlphaThresh : DEFAULT_ENGINE_HYPERPARAMETERS.alpha_threshold,
                alpha_override: parsedAlphaOverride !== null && !isNaN(parsedAlphaOverride) ? parsedAlphaOverride : null,
                beta_divisor: !isNaN(parsedBetaDiv) && parsedBetaDiv > 0 ? parsedBetaDiv : DEFAULT_ENGINE_HYPERPARAMETERS.beta_divisor,
                monotonicity_min_gap: !isNaN(parsedMinGap) ? parsedMinGap : DEFAULT_ENGINE_HYPERPARAMETERS.monotonicity_min_gap,
                review_active_weight: !isNaN(parsedActiveW) ? parsedActiveW : DEFAULT_ENGINE_HYPERPARAMETERS.review_active_weight,
                review_baseline_weight: !isNaN(parsedBaselineW) ? parsedBaselineW : DEFAULT_ENGINE_HYPERPARAMETERS.review_baseline_weight,
                terrain_presence_threshold: !isNaN(parsedTerrThresh) ? parsedTerrThresh : DEFAULT_ENGINE_HYPERPARAMETERS.terrain_presence_threshold,
                target_user_ids: selectedUserIds && selectedUserIds.length > 0 ? selectedUserIds : undefined,
                generate_ai_reasoning: generateAiReasoning,
            });

            setReport(result);
            if (onSuccess) {
                onSuccess(result);
            }
        } catch (err: any) {
            setError(err.message || "Failed to execute THARESYS batch recommendation.");
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={isRunning ? undefined : onClose} />

                <View style={styles.modalCard}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.titleRow}>
                                <CustomIcon library="Feather" name="cpu" size={20} color={Colors.PRIMARY} />
                                <Text style={styles.title}>THARESYS Recommendation Engine</Text>
                            </View>
                            <Text style={styles.subtitle}>
                                Configure formulas and run monthly batch recommendations
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={onClose}
                            disabled={isRunning}
                        >
                            <CustomIcon library="Feather" name="x" size={18} color={Colors.TEXT_SECONDARY} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
                        {/* Selected User Generation Scope Banner */}
                        {selectedUserIds && selectedUserIds.length > 0 ? (
                            <View style={[styles.offlineAlert, { backgroundColor: Palette.Green50, borderColor: Palette.Green200, marginBottom: 12 }]}>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                                        <CustomIcon library="Feather" name="user-check" size={16} color={Palette.Green700} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.offlineAlertText, { color: Palette.Green900, fontWeight: "700" }]}>
                                                Selected Account Flow Active ({selectedUserIds.length} user{selectedUserIds.length > 1 ? "s" : ""})
                                            </Text>
                                            <Text style={[styles.offlineAlertText, { color: Palette.Green800, fontSize: 11, marginTop: 2 }]} numberOfLines={2}>
                                                Generating exclusively for: {selectedUserNames.length > 0 ? selectedUserNames.join(", ") : selectedUserIds.join(", ")}
                                            </Text>
                                        </View>
                                    </View>
                                    {onClearSelectedUsers && (
                                        <TouchableOpacity
                                            style={[styles.recheckBtn, { borderColor: Palette.Green300 }]}
                                            onPress={onClearSelectedUsers}
                                            disabled={isRunning}
                                        >
                                            <Text style={[styles.recheckText, { color: Palette.Green800 }]}>Clear</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ) : (
                            <View style={[styles.statusRow, { backgroundColor: Palette.Slate50, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: Palette.Slate200 }]}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                    <CustomIcon library="Feather" name="users" size={13} color={Colors.TEXT_SECONDARY} />
                                    <Text style={[styles.statusText, { fontSize: 12, color: Colors.TEXT_SECONDARY }]}>
                                        Target Scope: <Text style={{ fontWeight: "700", color: Palette.Slate800 }}>Default (All accounts with active profile)</Text>
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Server Status Pill */}
                        <View style={styles.statusRow}>
                            <View style={styles.statusIndicator}>
                                {healthStatus === "checking" ? (
                                    <ActivityIndicator size="small" color={Palette.Amber600} />
                                ) : (
                                    <View
                                        style={[
                                            styles.statusDot,
                                            healthStatus === "online" ? styles.dotOnline : styles.dotOffline,
                                        ]}
                                    />
                                )}
                                <Text style={styles.statusText}>
                                    Backend: {healthStatus === "online" ? "FastAPI Online" : healthStatus === "checking" ? "Checking connection..." : "Server Offline"}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.recheckBtn} onPress={verifyHealth}>
                                <CustomIcon library="Feather" name="refresh-cw" size={12} color={Colors.PRIMARY} />
                                <Text style={styles.recheckText}>Check</Text>
                            </TouchableOpacity>
                        </View>

                        {healthStatus === "offline" && (
                            <View style={styles.offlineAlert}>
                                <CustomIcon library="Feather" name="alert-triangle" size={14} color={Palette.Amber700} />
                                <Text style={styles.offlineAlertText}>
                                    {healthMsg}. Ensure Python server is running (`python app.py` in engine/).
                                </Text>
                            </View>
                        )}

                        {/* CBF Engine Formula Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>1. Content-Based Filtering (CBF) Formula</Text>
                            <Text style={styles.sectionDesc}>
                                Measures individual user preference alignment against trail feature vectors.
                            </Text>
                            <View style={styles.formulaGroup}>
                                {FORMULAS.map((f) => (
                                    <TouchableOpacity
                                        key={`cbf-${f.id}`}
                                        style={[styles.formulaCard, cbfEngine === f.id && styles.formulaCardActive]}
                                        onPress={() => setCbfEngine(f.id)}
                                        disabled={isRunning}
                                    >
                                        <View style={styles.formulaCardHeader}>
                                            <View
                                                style={[
                                                    styles.radioCircle,
                                                    cbfEngine === f.id && styles.radioCircleActive,
                                                ]}
                                            >
                                                {cbfEngine === f.id && <View style={styles.radioInner} />}
                                            </View>
                                            <Text
                                                style={[
                                                    styles.formulaName,
                                                    cbfEngine === f.id && styles.formulaNameActive,
                                                ]}
                                            >
                                                {f.name}
                                            </Text>
                                        </View>
                                        <Text style={styles.formulaDesc}>{f.desc}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* CF Engine Formula Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>2. Collaborative Filtering (CF) Formula</Text>
                            <Text style={styles.sectionDesc}>
                                Measures peer user similarity to incorporate community behavior patterns.
                            </Text>
                            <View style={styles.formulaGroup}>
                                {FORMULAS.map((f) => (
                                    <TouchableOpacity
                                        key={`cf-${f.id}`}
                                        style={[styles.formulaCard, cfEngine === f.id && styles.formulaCardActive]}
                                        onPress={() => setCfEngine(f.id)}
                                        disabled={isRunning}
                                    >
                                        <View style={styles.formulaCardHeader}>
                                            <View
                                                style={[
                                                    styles.radioCircle,
                                                    cfEngine === f.id && styles.radioCircleActive,
                                                ]}
                                            >
                                                {cfEngine === f.id && <View style={styles.radioInner} />}
                                            </View>
                                            <Text
                                                style={[
                                                    styles.formulaName,
                                                    cfEngine === f.id && styles.formulaNameActive,
                                                ]}
                                            >
                                                {f.name}
                                            </Text>
                                        </View>
                                        <Text style={styles.formulaDesc}>{f.desc}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Month Selector */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>3. Target Recommendation Month</Text>
                            <View style={styles.monthInputRow}>
                                <CustomIcon library="Feather" name="calendar" size={16} color={Colors.TEXT_SECONDARY} />
                                <TextInput
                                    style={styles.monthInput}
                                    value={monthId}
                                    onChangeText={setMonthId}
                                    placeholder="YYYY-MM (e.g. 2026-10)"
                                    maxLength={7}
                                    autoCapitalize="none"
                                    editable={!isRunning}
                                />
                            </View>
                        </View>

                        {/* Section 4: Feature Selection & Custom Weights Matrix */}
                        <View style={styles.section}>
                            <View style={styles.featureHeaderRow}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <Text style={styles.sectionTitle}>4. Category Importance & Weights Matrix</Text>
                                        <View style={styles.activePill}>
                                            <Text style={styles.activePillText}>
                                                {activeCategoryCount} / {CATEGORY_GROUPS.length} Categories ({activeFeatureCount} Features Active)
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.sectionDesc}>
                                        Assign relative weights across the 5 core hiking categories. The total weight across all active categories must equal 100.00%. Expand any category to customize or exclude specific individual features.
                                    </Text>
                                </View>
                            </View>

                            {/* Live Weights Summary Strip */}
                            <View style={[
                                styles.weightsSummaryStrip,
                                !isWeightValid && styles.weightsSummaryStripError,
                            ]}>
                                <View style={styles.summaryMetric}>
                                    <CustomIcon
                                        library="Feather"
                                        name={isWeightValid ? "check-circle" : "alert-triangle"}
                                        size={14}
                                        color={isWeightValid ? Palette.Green700 : Palette.Red600}
                                    />
                                    <Text style={styles.summaryMetricLabel}>Total Weight:</Text>
                                    <Text style={[
                                        styles.summaryMetricVal,
                                        { color: isWeightValid ? Palette.Green800 : Palette.Red700 },
                                    ]}>
                                        {totalWeight}%
                                    </Text>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryMetric}>
                                    <Text style={styles.summaryMetricLabel}>Physical Share:</Text>
                                    <Text style={[styles.summaryMetricVal, { color: Colors.PRIMARY }]}>
                                        {physicalWeightPct}%
                                    </Text>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryMetric}>
                                    <Text style={styles.summaryMetricLabel}>Non-Physical Share:</Text>
                                    <Text style={styles.summaryMetricVal}>
                                        {100 - physicalWeightPct}%
                                    </Text>
                                </View>
                            </View>

                            {/* Weight Warning Notice when not 100% */}
                            {!isWeightValid && (
                                <View style={styles.weightWarningBanner}>
                                    <CustomIcon library="Feather" name="alert-circle" size={15} color={Palette.Amber800} />
                                    <Text style={styles.weightWarningText}>
                                        <Text style={{ fontWeight: "700" }}>Notice: </Text>
                                        All 100% of category weights must be allocated to run the engine. Currently {totalWeight}% (
                                        {parseFloat(totalWeight) < 100
                                            ? `${(100 - parseFloat(totalWeight)).toFixed(2)}% unallocated`
                                            : `${(parseFloat(totalWeight) - 100).toFixed(2)}% over allocated`}
                                        ). Tap <Text style={{ fontWeight: "700" }}>Balance to 100%</Text> or <Text style={{ fontWeight: "700" }}>Reset Defaults</Text> to calibrate.
                                    </Text>
                                </View>
                            )}

                            {/* Quick Action Toolbar */}
                            <View style={styles.quickActionsToolbar}>
                                <TouchableOpacity
                                    style={styles.quickActionBtn}
                                    onPress={handleResetAllDefaults}
                                    disabled={isRunning}
                                >
                                    <CustomIcon library="Feather" name="rotate-ccw" size={12} color={Colors.PRIMARY} />
                                    <Text style={styles.quickActionBtnText}>Reset Defaults</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.quickActionBtn, !isWeightValid && styles.quickActionBtnHighlight]}
                                    onPress={handleBalanceTo100}
                                    disabled={isRunning}
                                >
                                    <CustomIcon library="Feather" name="sliders" size={12} color={Colors.PRIMARY} />
                                    <Text style={[styles.quickActionBtnText, !isWeightValid && { color: Palette.Amber900, fontWeight: "700" }]}>
                                        Balance to 100%
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.quickActionBtn}
                                    onPress={handlePhysicalOnly}
                                    disabled={isRunning}
                                >
                                    <CustomIcon library="Feather" name="zap" size={12} color={Palette.Amber700} />
                                    <Text style={[styles.quickActionBtnText, { color: Palette.Amber800 }]}>Physical Only</Text>
                                </TouchableOpacity>
                            </View>

                            {/* 5 Category Group Cards Container */}
                            <View style={styles.categoryCardsList}>
                                {CATEGORY_GROUPS.map((group) => {
                                    const isCatActive = categoryEnabled[group.id];
                                    const isExpanded = expandedCategories[group.id];
                                    const featsInGroup = CANONICAL_FEATURE_CONFIG.filter(
                                        (f) => f.categoryGroupId === group.id
                                    );
                                    const activeCountInGroup = featsInGroup.filter(
                                        (f) => isCatActive && featureEnabled[f.key]
                                    ).length;

                                    return (
                                        <View
                                            key={`group-card-${group.id}`}
                                            style={[
                                                styles.categoryGroupCard,
                                                !isCatActive && styles.categoryGroupCardDisabled,
                                            ]}
                                        >
                                            {/* Card Main Row */}
                                            <View style={styles.categoryCardHeader}>
                                                <TouchableOpacity
                                                    style={styles.categoryCheckboxRow}
                                                    onPress={() => handleToggleCategory(group.id)}
                                                    disabled={isRunning}
                                                    activeOpacity={0.7}
                                                >
                                                    <View
                                                        style={[
                                                            styles.checkboxBox,
                                                            isCatActive && styles.checkboxBoxActive,
                                                        ]}
                                                    >
                                                        {isCatActive && (
                                                            <CustomIcon
                                                                library="Feather"
                                                                name="check"
                                                                size={12}
                                                                color={Colors.WHITE}
                                                            />
                                                        )}
                                                    </View>

                                                    <View style={{ flex: 1, gap: 2 }}>
                                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                                            <Text
                                                                style={[
                                                                    styles.categoryTitle,
                                                                    !isCatActive && styles.textDisabled,
                                                                ]}
                                                            >
                                                                {group.name}
                                                            </Text>
                                                            <View
                                                                style={[
                                                                    styles.categoryBadge,
                                                                    {
                                                                        backgroundColor: `${group.badgeColor}15`,
                                                                        borderColor: group.badgeColor,
                                                                    },
                                                                ]}
                                                            >
                                                                <Text style={[styles.categoryBadgeText, { color: group.badgeColor }]}>
                                                                    {activeCountInGroup}/{group.featureKeys.length} features
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <Text
                                                            style={[
                                                                styles.categorySubtitle,
                                                                !isCatActive && styles.textDisabled,
                                                            ]}
                                                            numberOfLines={1}
                                                        >
                                                            {group.subtitle}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>

                                                {/* Weight Input Box */}
                                                <View style={styles.categoryWeightInputBox}>
                                                    <TextInput
                                                        style={[
                                                            styles.categoryWeightInput,
                                                            !isCatActive && styles.inputDisabled,
                                                        ]}
                                                        value={isCatActive ? categoryWeights[group.id] : "0.00"}
                                                        onChangeText={(text) => handleCategoryWeightChange(group.id, text)}
                                                        keyboardType="decimal-pad"
                                                        editable={isCatActive && !isRunning}
                                                        selectTextOnFocus
                                                    />
                                                    <Text style={[styles.percentSymbol, !isCatActive && styles.textDisabled]}>%</Text>
                                                    <TouchableOpacity
                                                        style={styles.categoryResetBtn}
                                                        onPress={() => handleResetCategoryDefault(group.id)}
                                                        disabled={!isCatActive || isRunning}
                                                    >
                                                        <CustomIcon
                                                            library="Feather"
                                                            name="rotate-ccw"
                                                            size={12}
                                                            color={isCatActive ? Colors.PRIMARY : Palette.Slate400}
                                                        />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            {/* Expand/Collapse Drawer Trigger */}
                                            <TouchableOpacity
                                                style={styles.expandDrawerBtn}
                                                onPress={() => toggleExpandCategory(group.id)}
                                                disabled={!isCatActive || isRunning}
                                            >
                                                <Text
                                                    style={[
                                                        styles.expandDrawerBtnText,
                                                        !isCatActive && styles.textDisabled,
                                                    ]}
                                                >
                                                    {isExpanded
                                                        ? `Hide ${featsInGroup.length} Features`
                                                        : `Customize Features (${featsInGroup.length})`}
                                                </Text>
                                                <CustomIcon
                                                    library="Feather"
                                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                                    size={13}
                                                    color={isCatActive ? Colors.PRIMARY : Palette.Slate400}
                                                />
                                            </TouchableOpacity>

                                            {/* Expanded Drawer Rows */}
                                            {isExpanded && isCatActive && (
                                                <View style={styles.featuresDrawer}>
                                                    {featsInGroup.map((feat, idx) => {
                                                        const isFeatActive = featureEnabled[feat.key];
                                                        const calculatedWeight = compiledWeights[feat.key] || 0.0;

                                                        return (
                                                            <View
                                                                key={`feat-subrow-${feat.key}`}
                                                                style={[
                                                                    styles.drawerRow,
                                                                    idx % 2 === 1 && styles.drawerRowEven,
                                                                ]}
                                                            >
                                                                <TouchableOpacity
                                                                    style={styles.drawerColA}
                                                                    onPress={() => handleToggleFeature(feat.key)}
                                                                    disabled={isRunning}
                                                                >
                                                                    <View
                                                                        style={[
                                                                            styles.checkboxBoxSmall,
                                                                            isFeatActive && styles.checkboxBoxActive,
                                                                        ]}
                                                                    >
                                                                        {isFeatActive && (
                                                                            <CustomIcon
                                                                                library="Feather"
                                                                                name="check"
                                                                                size={10}
                                                                                color={Colors.WHITE}
                                                                            />
                                                                        )}
                                                                    </View>
                                                                    <View style={{ flex: 1 }}>
                                                                        <Text
                                                                            style={[
                                                                                styles.drawerFeatLabel,
                                                                                !isFeatActive && styles.textDisabled,
                                                                            ]}
                                                                        >
                                                                            {feat.label}
                                                                        </Text>
                                                                        {feat.description && (
                                                                            <Text
                                                                                style={[
                                                                                    styles.drawerFeatSub,
                                                                                    !isFeatActive && styles.textDisabled,
                                                                                ]}
                                                                                numberOfLines={1}
                                                                            >
                                                                                {feat.description}
                                                                            </Text>
                                                                        )}
                                                                    </View>
                                                                </TouchableOpacity>

                                                                <View style={styles.drawerColB}>
                                                                    <Text
                                                                        style={[
                                                                            styles.calculatedWeightVal,
                                                                            !isFeatActive && styles.textDisabled,
                                                                        ]}
                                                                    >
                                                                        {calculatedWeight.toFixed(2)}%
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Section 5: Hyperparameters & Simulation Controls */}
                        <View style={styles.section}>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>5. Hyperparameters & Simulation Controls</Text>
                                    <Text style={styles.sectionDesc}>
                                        Optional overrides for Collaborative Filtering (τ, k), Hybrid Blending (α), and Adaptive Profile Evolution (β). Defaults come from engine/parameters.py.
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.quickActionBtn}
                                    onPress={handleResetHyperparameters}
                                    disabled={isRunning}
                                >
                                    <CustomIcon library="Feather" name="rotate-ccw" size={12} color={Colors.PRIMARY} />
                                    <Text style={styles.quickActionBtnText}>Reset Hyperparameters</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Simulation / Persistence Toggle */}
                            <TouchableOpacity
                                style={[
                                    styles.categoryGroupCard,
                                    { padding: 12, marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }
                                ]}
                                onPress={() => !isRunning && setCommitToFirestore((prev) => !prev)}
                                disabled={isRunning}
                            >
                                <View style={{ flex: 1, paddingRight: 12 }}>
                                    <Text style={styles.categoryTitle}>
                                        {commitToFirestore ? "Live Mode: Commit to Firestore" : "Simulation Mode (Dry Run)"}
                                    </Text>
                                    <Text style={styles.categorySubtitle}>
                                        {commitToFirestore
                                            ? "Saves generated recommendations and updated profiles to Firestore."
                                            : "Runs simulation in-memory without overwriting Firestore documents."}
                                    </Text>
                                </View>
                                <View style={[styles.checkboxBox, commitToFirestore && styles.checkboxBoxActive]}>
                                    {commitToFirestore && (
                                        <CustomIcon library="Feather" name="check" size={12} color={Colors.WHITE} />
                                    )}
                                </View>
                            </TouchableOpacity>

                            {/* Gemini AI Reasoning Toggle */}
                            <TouchableOpacity
                                style={[
                                    styles.categoryGroupCard,
                                    { padding: 12, marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }
                                ]}
                                onPress={() => !isRunning && setGenerateAiReasoning((prev) => !prev)}
                                disabled={isRunning}
                            >
                                <View style={{ flex: 1, paddingRight: 12 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <Text style={styles.categoryTitle}>
                                            {generateAiReasoning
                                                ? "Gemini AI Reasoning: Enabled"
                                                : "Gemini AI Reasoning: Disabled (Fast Simulation)"}
                                        </Text>
                                        <View
                                            style={[
                                                styles.activePill,
                                                !generateAiReasoning && { backgroundColor: Palette.Amber100 },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.activePillText,
                                                    !generateAiReasoning && { color: Palette.Amber800 },
                                                ]}
                                            >
                                                {generateAiReasoning ? "Standard" : "Fast (~10x Speedup)"}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.categorySubtitle}>
                                        {generateAiReasoning
                                            ? "Pre-generates personalized Gemini AI explanations for each user's top trail (takes ~1-2s per user)."
                                            : "Skips Gemini LLM calls to reduce processing time drastically during simulations and parameter sweeps."}
                                    </Text>
                                </View>
                                <View style={[styles.checkboxBox, generateAiReasoning && styles.checkboxBoxActive]}>
                                    {generateAiReasoning && (
                                        <CustomIcon library="Feather" name="check" size={12} color={Colors.WHITE} />
                                    )}
                                </View>
                            </TouchableOpacity>

                            {/* Grid of Hyperparameter Inputs */}
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                                <View style={[styles.categoryGroupCard, { flex: 1, minWidth: 165, padding: 10 }]}>
                                    <Text style={styles.drawerFeatLabel}>CF Cutoff Distance (τ)</Text>
                                    <Text style={styles.drawerFeatSub}>Max peer distance (default 0.35)</Text>
                                    <TextInput
                                        style={[styles.monthInput, { marginTop: 6, borderWidth: 1, borderColor: Palette.Slate200, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }]}
                                        value={cfTau}
                                        onChangeText={setCfTau}
                                        keyboardType="decimal-pad"
                                        editable={!isRunning}
                                    />
                                </View>

                                <View style={[styles.categoryGroupCard, { flex: 1, minWidth: 165, padding: 10 }]}>
                                    <Text style={styles.drawerFeatLabel}>CF Top-k Peers (k)</Text>
                                    <Text style={styles.drawerFeatSub}>Max closest peers (default 5)</Text>
                                    <TextInput
                                        style={[styles.monthInput, { marginTop: 6, borderWidth: 1, borderColor: Palette.Slate200, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }]}
                                        value={cfK}
                                        onChangeText={setCfK}
                                        keyboardType="number-pad"
                                        editable={!isRunning}
                                    />
                                </View>

                                <View style={[styles.categoryGroupCard, { flex: 1, minWidth: 165, padding: 10 }]}>
                                    <Text style={styles.drawerFeatLabel}>Steady-State Alpha (α)</Text>
                                    <Text style={styles.drawerFeatSub}>Min CBF weight (default 0.50)</Text>
                                    <TextInput
                                        style={[styles.monthInput, { marginTop: 6, borderWidth: 1, borderColor: Palette.Slate200, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }]}
                                        value={alphaSteadyState}
                                        onChangeText={setAlphaSteadyState}
                                        keyboardType="decimal-pad"
                                        editable={!isRunning}
                                    />
                                </View>

                                <View style={[styles.categoryGroupCard, { flex: 1, minWidth: 165, padding: 10 }]}>
                                    <Text style={styles.drawerFeatLabel}>Alpha User Threshold</Text>
                                    <Text style={styles.drawerFeatSub}>Users for steady α (default 50)</Text>
                                    <TextInput
                                        style={[styles.monthInput, { marginTop: 6, borderWidth: 1, borderColor: Palette.Slate200, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }]}
                                        value={alphaThreshold}
                                        onChangeText={setAlphaThreshold}
                                        keyboardType="number-pad"
                                        editable={!isRunning}
                                    />
                                </View>

                                <View style={[styles.categoryGroupCard, { flex: 1, minWidth: 165, padding: 10 }]}>
                                    <Text style={styles.drawerFeatLabel}>Fixed Alpha Override</Text>
                                    <Text style={styles.drawerFeatSub}>Blank = dynamic, or [0.0–1.0]</Text>
                                    <TextInput
                                        style={[styles.monthInput, { marginTop: 6, borderWidth: 1, borderColor: Palette.Slate200, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }]}
                                        value={alphaOverride}
                                        onChangeText={setAlphaOverride}
                                        placeholder="Auto (Dynamic)"
                                        keyboardType="decimal-pad"
                                        editable={!isRunning}
                                    />
                                </View>

                                <View style={[styles.categoryGroupCard, { flex: 1, minWidth: 165, padding: 10 }]}>
                                    <Text style={styles.drawerFeatLabel}>Beta Divisor (β)</Text>
                                    <Text style={styles.drawerFeatSub}>Learning step divisor (default 2.0)</Text>
                                    <TextInput
                                        style={[styles.monthInput, { marginTop: 6, borderWidth: 1, borderColor: Palette.Slate200, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }]}
                                        value={betaDivisor}
                                        onChangeText={setBetaDivisor}
                                        keyboardType="decimal-pad"
                                        editable={!isRunning}
                                    />
                                </View>

                                <View style={[styles.categoryGroupCard, { flex: 1, minWidth: 165, padding: 10 }]}>
                                    <Text style={styles.drawerFeatLabel}>Monotonicity Gap</Text>
                                    <Text style={styles.drawerFeatSub}>Min Easy/Diff gap (default 0.05)</Text>
                                    <TextInput
                                        style={[styles.monthInput, { marginTop: 6, borderWidth: 1, borderColor: Palette.Slate200, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }]}
                                        value={monotonicityMinGap}
                                        onChangeText={setMonotonicityMinGap}
                                        keyboardType="decimal-pad"
                                        editable={!isRunning}
                                    />
                                </View>

                                <View style={[styles.categoryGroupCard, { flex: 1, minWidth: 165, padding: 10 }]}>
                                    <Text style={styles.drawerFeatLabel}>Baseline Factor Weight</Text>
                                    <Text style={styles.drawerFeatSub}>Unselected weight (default 0.20)</Text>
                                    <TextInput
                                        style={[styles.monthInput, { marginTop: 6, borderWidth: 1, borderColor: Palette.Slate200, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }]}
                                        value={reviewBaselineWeight}
                                        onChangeText={setReviewBaselineWeight}
                                        keyboardType="decimal-pad"
                                        editable={!isRunning}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Error Banner inside scroll body */}
                        {error && (
                            <View style={styles.errorBox}>
                                <CustomIcon library="Feather" name="alert-circle" size={16} color={Palette.Red700} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Success Report */}
                        {report && (
                            <View style={styles.successBox}>
                                <View style={styles.successHeader}>
                                    <CustomIcon library="Feather" name="check-circle" size={18} color={Palette.Green700} />
                                    <Text style={styles.successTitle}>Batch Execution Successful!</Text>
                                </View>
                                <Text style={styles.successDesc}>
                                    Generated and saved monthly recommendation documents for month {report.month}.
                                </Text>
                                <View style={styles.reportRow}>
                                    <Text style={styles.reportLabel}>Users Processed:</Text>
                                    <Text style={styles.reportVal}>{report.total_users_processed}</Text>
                                </View>
                                <View style={styles.reportRow}>
                                    <Text style={styles.reportLabel}>Trails Scored:</Text>
                                    <Text style={styles.reportVal}>{report.total_trails_scored}</Text>
                                </View>
                                <View style={styles.reportRow}>
                                    <Text style={styles.reportLabel}>Applied Alpha:</Text>
                                    <Text style={styles.reportVal}>{report.alpha}</Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Persistent Error Banner when run error / weight mismatch occurs */}
                    {error && (
                        <View style={styles.persistentErrorBox}>
                            <CustomIcon library="Feather" name="alert-triangle" size={16} color={Palette.Red700} />
                            <Text style={styles.persistentErrorText}>{error}</Text>
                        </View>
                    )}

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={onClose}
                            disabled={isRunning}
                        >
                            <Text style={styles.cancelBtnText}>{report ? "Close" : "Cancel"}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.runBtn,
                                isRunning && styles.runBtnDisabled,
                            ]}
                            onPress={handleRunEngine}
                            disabled={isRunning}
                        >
                            {isRunning ? (
                                <>
                                    <ActivityIndicator size="small" color={Colors.WHITE} />
                                    <Text style={styles.runBtnText}>Running Engine...</Text>
                                </>
                            ) : (
                                <>
                                    <CustomIcon library="Feather" name="play" size={16} color={Colors.WHITE} />
                                    <Text style={styles.runBtnText}>Generate Recommendations</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function getCategoryBadgeStyle(category: string) {
    switch (category) {
        case "Physical Exertion":
            return { backgroundColor: Palette.Green50, borderColor: Palette.Green200 };
        case "Provinces":
            return { backgroundColor: "#EEF2FF", borderColor: "#C7D2FE" };
        case "Terrains":
            return { backgroundColor: Palette.Amber50, borderColor: Palette.Amber200 };
        case "Route Type":
            return { backgroundColor: "#F5F3FF", borderColor: "#DDD6FE" };
        case "Waterforms":
            return { backgroundColor: "#F0F9FF", borderColor: "#BAE6FD" };
        case "Tourism Amenities":
        default:
            return { backgroundColor: Palette.Slate100, borderColor: Palette.Slate200 };
    }
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    backdrop: {
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    },
    modalCard: {
        width: "100%",
        maxWidth: 620,
        maxHeight: "90%",
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        backgroundColor: Palette.Slate50,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    subtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    closeBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: Palette.Slate200,
    },
    body: {
        flex: 1,
    },
    bodyContent: {
        padding: 20,
        gap: 16,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: Palette.Slate50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    statusIndicator: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotOnline: {
        backgroundColor: Palette.Green600,
    },
    dotOffline: {
        backgroundColor: Palette.Red600,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    recheckBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: Palette.Green50,
    },
    recheckText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.PRIMARY,
    },
    offlineAlert: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: Palette.Amber50,
        borderWidth: 1,
        borderColor: Palette.Amber200,
        borderRadius: 8,
        padding: 10,
    },
    offlineAlertText: {
        flex: 1,
        fontSize: 12,
        color: Palette.Amber800,
    },
    section: {
        gap: 6,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    sectionDesc: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    formulaGroup: {
        gap: 8,
        marginTop: 4,
    },
    formulaCard: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: Palette.Slate50,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    formulaCardActive: {
        backgroundColor: Palette.Green50,
        borderColor: Colors.PRIMARY,
    },
    formulaCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    radioCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: Palette.Slate400,
        alignItems: "center",
        justifyContent: "center",
    },
    radioCircleActive: {
        borderColor: Colors.PRIMARY,
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.PRIMARY,
    },
    formulaName: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    formulaNameActive: {
        color: Colors.PRIMARY,
        fontWeight: "700",
    },
    formulaDesc: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 4,
        marginLeft: 24,
    },
    monthInputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: Palette.Slate50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    monthInput: {
        flex: 1,
        fontSize: 13,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
        padding: 0,
    },

    // Feature Weights & Table Styles
    featureHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    activePill: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green200,
    },
    activePillText: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Green800,
    },
    weightsSummaryStrip: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        backgroundColor: Palette.Slate50,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    weightsSummaryStripError: {
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
    },
    weightWarningBanner: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        backgroundColor: "#FFFBEB",
        borderWidth: 1,
        borderColor: "#FDE68A",
        borderRadius: 8,
        padding: 10,
    },
    weightWarningText: {
        flex: 1,
        fontSize: 12,
        color: "#92400E",
        lineHeight: 16,
    },
    summaryMetric: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    summaryMetricLabel: {
        fontSize: 12,
        color: Palette.Slate600,
        fontWeight: "500",
    },
    summaryMetricVal: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Slate900,
    },
    summaryDivider: {
        width: 1,
        height: 14,
        backgroundColor: Palette.Slate200,
    },
    quickActionsToolbar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
    },
    quickActionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 6,
        backgroundColor: Palette.Slate100,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    quickActionBtnHighlight: {
        backgroundColor: "#FEF3C7",
        borderColor: "#FCD34D",
    },
    quickActionBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.PRIMARY,
    },
    // 5 Category Groups & Drawers Styles
    categoryCardsList: {
        gap: 10,
        marginTop: 4,
    },
    categoryGroupCard: {
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 10,
        backgroundColor: Colors.WHITE,
        overflow: "hidden",
        padding: 12,
        gap: 8,
    },
    categoryGroupCardDisabled: {
        opacity: 0.55,
        backgroundColor: Palette.Slate50,
    },
    categoryCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    categoryCheckboxRow: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    checkboxBox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: Palette.Slate400,
        backgroundColor: Colors.WHITE,
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxBoxActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    checkboxBoxSmall: {
        width: 16,
        height: 16,
        borderRadius: 3,
        borderWidth: 1.5,
        borderColor: Palette.Slate400,
        backgroundColor: Colors.WHITE,
        justifyContent: "center",
        alignItems: "center",
    },
    categoryTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: Palette.Slate900,
    },
    categorySubtitle: {
        fontSize: 12,
        color: Palette.Slate500,
    },
    categoryBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    categoryBadgeText: {
        fontSize: 12,
        fontWeight: "700",
    },
    categoryWeightInputBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Palette.Slate50,
        borderWidth: 1,
        borderColor: Palette.Slate300,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    categoryWeightInput: {
        width: 52,
        fontSize: 13,
        fontWeight: "700",
        color: Palette.Slate900,
        textAlign: "right",
        paddingVertical: 2,
    },
    percentSymbol: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Slate600,
    },
    categoryResetBtn: {
        padding: 4,
        borderRadius: 4,
        backgroundColor: Palette.Slate100,
        marginLeft: 2,
    },
    expandDrawerBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 6,
        backgroundColor: Palette.Slate50,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    expandDrawerBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.PRIMARY,
    },
    featuresDrawer: {
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 6,
        overflow: "hidden",
        marginTop: 4,
    },
    drawerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate100,
        backgroundColor: Colors.WHITE,
    },
    drawerRowEven: {
        backgroundColor: "#fafbfc",
    },
    drawerColA: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    drawerColB: {
        width: 70,
        alignItems: "flex-end",
    },
    drawerFeatLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: Palette.Slate800,
    },
    drawerFeatSub: {
        fontSize: 12,
        color: Palette.Slate400,
    },
    calculatedWeightVal: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.PRIMARY,
    },
    textDisabled: {
        color: Palette.Slate400,
    },
    inputDisabled: {
        color: Palette.Slate400,
        backgroundColor: Palette.Slate100,
    },

    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: Palette.Red50,
        borderWidth: 1,
        borderColor: Palette.Red200,
        borderRadius: 8,
        padding: 12,
    },
    errorText: {
        flex: 1,
        fontSize: 12,
        color: Palette.Red700,
    },
    persistentErrorBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#FEF2F2",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#FECACA",
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    persistentErrorText: {
        flex: 1,
        fontSize: 12,
        color: "#B91C1C",
        fontWeight: "600",
        lineHeight: 16,
    },
    successBox: {
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green200,
        borderRadius: 10,
        padding: 14,
        gap: 6,
    },
    successHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    successTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: Palette.Green800,
    },
    successDesc: {
        fontSize: 12,
        color: Palette.Green700,
    },
    reportRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)",
    },
    reportLabel: {
        fontSize: 12,
        color: Palette.Green800,
    },
    reportVal: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Green900,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: Palette.Slate200,
        backgroundColor: Palette.Slate50,
    },
    cancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    cancelBtnText: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    runBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    runBtnDisabled: {
        opacity: 0.6,
    },
    runBtnText: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.WHITE,
    },
});
