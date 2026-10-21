import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import getRecoID from "@/src/core/utility/recommendation";
import { checkTarsHealth, runTarsEngine, TarsBatchResponse } from "@/src/features/SuperAdmin/services/tarsApiService";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
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
}

type FormulaType = "GD" | "ED" | "CS";

const FORMULAS: Array<{ id: FormulaType; name: string; desc: string }> = [
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
}: ConfigureEngineModalProps) {
    const [cbfEngine, setCbfEngine] = useState<FormulaType>("GD");
    const [cfEngine, setCfEngine] = useState<FormulaType>("GD");
    const [monthId, setMonthId] = useState<string>(getRecoID());
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<TarsBatchResponse | null>(null);

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

    const handleRunEngine = async () => {
        setIsRunning(true);
        setError(null);
        setReport(null);

        try {
            const result = await runTarsEngine({
                cbf_engine: cbfEngine,
                cf_engine: cfEngine,
                month_id: monthId.trim() || getRecoID(),
                commit_to_firestore: true,
            });

            setReport(result);
            if (onSuccess) {
                onSuccess(result);
            }
        } catch (err: any) {
            setError(err.message || "Failed to execute TARS batch recommendation.");
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
                                <Text style={styles.title}>TARS Recommendation Engine</Text>
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

                        {/* Error Banner */}
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

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
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
        fontSize: 11,
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
        fontSize: 11,
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
        fontSize: 11,
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
        fontSize: 11,
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
        fontSize: 11,
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
