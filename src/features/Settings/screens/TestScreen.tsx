/**
 * @file TestScreen.tsx
 * @description Dedicated developer scratchpad screen accessible only in development (__DEV__).
 * Features an interactive Cancellation Lifecycle Simulator and Full Backend vs. UI Coverage Matrix
 * with strictly ZERO database impact (100% in-memory React state).
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { Booking, BookingStatus, Requirements } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import AdminBookingCard from '@/src/features/Admin/screens/Offer/components/AdminBookingCard';
import AdminCancellationCard from '@/src/features/Admin/screens/Booking/components/AdminCancellationCard';
import DocumentReviewCard from '@/src/features/Admin/screens/Booking/components/DocumentReviewCard';
import { CANCELLATION_DECLINE_REASONS } from '@/src/features/Admin/utils/reviewMessages';
import BookingStatusComponent from '@/src/features/Book/screens/MyBookings/components/BookingStatus';
import CancelBookingModal from '@/src/features/Book/screens/MyBookings/components/CancelBookingModal';
import CancellationCard from '@/src/features/Book/screens/MyBookings/components/CancellationCard';
import RequiredDocumentsSection from '@/src/features/Book/screens/MyBookings/components/RequiredDocumentsSection';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

import {
    CoverageItem,
    createMockBooking,
    createMockCancellation,
    PRESET_SCENARIOS,
    ScenarioDefinition,
    STATUS_COVERAGE_MATRIX,
} from './cancellationTestData';

export interface TestScreenProps {
    onBackPress: () => void;
}

type ScreenMode = 'simulator' | 'matrix';
type CategoryFilter = 'ALL' | 'Phase 1: Verification' | 'Phase 2: Payment' | 'Phase 3: Operations' | 'Sub-Approval: Cancellation' | 'Sub-Approval: Reschedule';

export const TestScreen: React.FC<TestScreenProps> = ({ onBackPress }) => {
    const { isMobile } = useBreakpoints();

    // Mode Switcher: 'simulator' vs 'matrix'
    const [mode, setMode] = useState<ScreenMode>('simulator');

    // Simulator State
    const [selectedScenarioId, setSelectedScenarioId] = useState<string>(PRESET_SCENARIOS[0].id);
    const [simulatedBooking, setSimulatedBooking] = useState<Booking>(() => {
        const initialDef = PRESET_SCENARIOS[0];
        return createMockBooking(initialDef.simulatedBookingStatus, {
            cancellationReason: initialDef.userReason,
            cancelledBy: initialDef.cancelledBy,
        });
    });
    const [simulatedCancellation, setSimulatedCancellation] = useState<Cancellation | null>(() => {
        const initialDef = PRESET_SCENARIOS[0];
        return initialDef.simulatedCancellationStatus
            ? createMockCancellation(initialDef.simulatedCancellationStatus, {
                reason: initialDef.userReason,
                adminNote: initialDef.adminNote,
                cancelledBy: initialDef.cancelledBy,
            })
            : null;
    });
    const [simulatedDocs, setSimulatedDocs] = useState<Requirements[]>(() => {
        const initialDef = PRESET_SCENARIOS[0];
        const docs = createMockBooking(initialDef.simulatedBookingStatus).documents;
        return docs.map(d => ({ ...d, valid: 'pending' as const }));
    });
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isSimulatingDecline, setIsSimulatingDecline] = useState(false);
    const [simulatedDeclineReason, setSimulatedDeclineReason] = useState('');
    const [currentStepIndex, setCurrentStepIndex] = useState<1 | 2 | 3 | 4>(PRESET_SCENARIOS[0].currentPipelineStep);
    const [actionNotice, setActionNotice] = useState<string | null>(null);

    // Matrix View State
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL');

    // Current Scenario Definition
    const activeScenarioDef = useMemo<ScenarioDefinition>(() => {
        const match = PRESET_SCENARIOS.find(s => s.id === selectedScenarioId);
        return match || PRESET_SCENARIOS[0];
    }, [selectedScenarioId]);

    // Handle Scenario Selection
    const handleSelectScenario = useCallback((scenario: ScenarioDefinition) => {
        setSelectedScenarioId(scenario.id);
        const isPaid = scenario.initialStatus === 'paid';
        const isDownpayment = scenario.initialStatus === 'downpayment';

        const freshBooking = createMockBooking(scenario.simulatedBookingStatus, {
            cancellationReason: scenario.userReason,
            cancelledBy: scenario.cancelledBy,
            isPaid,
            isDownpayment,
        });
        setSimulatedBooking(freshBooking);

        if (scenario.simulatedCancellationStatus) {
            setSimulatedCancellation(
                createMockCancellation(scenario.simulatedCancellationStatus, {
                    reason: scenario.userReason,
                    adminNote: scenario.adminNote,
                    cancelledBy: scenario.cancelledBy,
                })
            );
        } else {
            setSimulatedCancellation(null);
        }

        const isPendingPhase = scenario.initialStatus === 'for-reservation';
        setSimulatedDocs(
            isPendingPhase
                ? freshBooking.documents.map(d => ({ ...d, valid: 'pending' as const }))
                : freshBooking.documents
        );
        setIsSimulatingDecline(false);
        setSimulatedDeclineReason('');
        setIsCancelModalOpen(false);

        setCurrentStepIndex(scenario.currentPipelineStep);
        setActionNotice(`Loaded preset: "${scenario.title}"`);
    }, []);

    // Simulator Transition Handlers
    const handleSimulateUserRequestCancel = useCallback(() => {
        const isPreApprovalDraft = simulatedBooking.status === 'for-reservation';
        if (isPreApprovalDraft) {
            setSimulatedCancellation(null);
            setActionNotice('Cancelled initial reservation draft (deleted immediately, no request created).');
            return;
        }

        const reason = 'User requested cancellation (simulator). Schedule conflict with personal obligations.';
        setSimulatedBooking(prev => ({
            ...prev,
            status: 'for-cancellation' as BookingStatus,
            cancellationReason: reason,
            cancelledBy: 'user',
        }));
        setSimulatedCancellation(
            createMockCancellation('pending', {
                reason,
                cancelledBy: 'user',
            })
        );
        setCurrentStepIndex(2);
        setIsSimulatingDecline(false);
        setActionNotice('Transitioned to "for-cancellation" (Sub-Approval Pending). Booking routed to Pending tab.');
    }, [simulatedBooking.status]);

    const handleModalCancelSubmit = useCallback((reason: string) => {
        setIsCancelModalOpen(false);
        setSimulatedBooking(prev => ({
            ...prev,
            status: 'for-cancellation' as BookingStatus,
            cancellationReason: reason,
            cancelledBy: 'user',
        }));
        setSimulatedCancellation(
            createMockCancellation('pending', {
                reason,
                cancelledBy: 'user',
            })
        );
        setCurrentStepIndex(2);
        setIsSimulatingDecline(false);
        setActionNotice(`CancelBookingModal submitted with reason: "${reason}". Status is now "for-cancellation".`);
    }, []);

    const handleSimulateAdminApprove = useCallback(() => {
        const isPaidHike = simulatedBooking.payment.length > 0;
        const targetStatus: BookingStatus = isPaidHike ? 'refund' : 'cancelled';

        setSimulatedBooking(prev => ({
            ...prev,
            status: targetStatus,
        }));
        setSimulatedCancellation(prev =>
            prev
                ? {
                    ...prev,
                    status: 'approved',
                    adminNote: 'Admin approved cancellation request.',
                }
                : createMockCancellation('approved', {
                    reason: simulatedBooking.cancellationReason || 'Admin approved cancellation.',
                    adminNote: 'Admin approved cancellation request.',
                })
        );
        setCurrentStepIndex(4);
        setIsSimulatingDecline(false);
        setActionNotice(
            isPaidHike
                ? 'Admin Approved. Status transitioned to "refund" (PayMongo SLA). Moved to History.'
                : 'Admin Approved. Status transitioned to "cancelled". Spot released. Moved to History.'
        );
    }, [simulatedBooking.payment.length, simulatedBooking.cancellationReason]);

    const handleSimulateAdminDecline = useCallback(() => {
        setIsSimulatingDecline(prev => !prev);
        setActionNotice('Toggled Admin Decline Mode. Select a reason suggestion or enter custom feedback below.');
    }, []);

    const handleConfirmSimulatedDecline = useCallback(() => {
        const declineNote = simulatedDeclineReason || 'Declined: Request submitted within 24 hours of hike departure. Policy requires 72 hours notice.';
        setSimulatedBooking(prev => ({
            ...prev,
            status: 'cancellation-rejected' as BookingStatus,
        }));
        setSimulatedCancellation(prev =>
            prev
                ? {
                    ...prev,
                    status: 'rejected',
                    adminNote: declineNote,
                }
                : createMockCancellation('rejected', {
                    reason: simulatedBooking.cancellationReason || 'Previous request',
                    adminNote: declineNote,
                })
        );
        setCurrentStepIndex(3);
        setIsSimulatingDecline(false);
        setActionNotice(`Admin Declined with Note: "${declineNote}". Status transitioned to "cancellation-rejected" (Action Needed).`);
    }, [simulatedDeclineReason, simulatedBooking.cancellationReason]);

    const handleSimulateHikerAppeal = useCallback(() => {
        const appealReason = 'APPEAL: Attached certified medical certificate from St. Luke\'s Medical Center.';
        setSimulatedBooking(prev => ({
            ...prev,
            status: 'for-cancellation' as BookingStatus,
            cancellationReason: appealReason,
        }));
        setSimulatedCancellation(prev => ({
            ...(prev || createMockCancellation('pending')),
            status: 'pending',
            reason: appealReason,
            updatedAt: new Date(),
        }));
        setCurrentStepIndex(2);
        setActionNotice('Hiker submitted Appeal. Status reset to "for-cancellation" (Awaiting re-review).');
    }, []);

    const handleSimulateHikerWithdraw = useCallback(() => {
        setSimulatedBooking(prev => ({
            ...prev,
            status: 'paid' as BookingStatus,
            cancellationReason: undefined,
        }));
        setSimulatedCancellation(null);
        setCurrentStepIndex(4);
        setActionNotice('Hiker withdrew cancellation request. Booking reverted to "paid" in Upcoming tab.');
    }, []);

    const handleSimulateOrganizerCancelHike = useCallback(() => {
        const weatherNote = 'Trail closed by DENR due to heavy monsoon rain and flash flood warnings. Safety priority.';
        setSimulatedBooking(prev => ({
            ...prev,
            status: 'cancelled' as BookingStatus,
            cancelledBy: 'admin',
        }));
        setSimulatedCancellation(
            createMockCancellation('approved', {
                reason: weatherNote,
                adminNote: weatherNote,
                cancelledBy: 'admin',
            })
        );
        setCurrentStepIndex(4);
        setActionNotice('Organizer Cancelled Hike. CancellationCard displays refund and reschedule actions.');
    }, []);

    const handleResetSimulation = useCallback(() => {
        handleSelectScenario(activeScenarioDef);
    }, [activeScenarioDef, handleSelectScenario]);

    // Filtered Matrix List
    const filteredMatrix = useMemo<CoverageItem[]>(() => {
        if (selectedCategory === 'ALL') return STATUS_COVERAGE_MATRIX;
        return STATUS_COVERAGE_MATRIX.filter(item => item.category === selectedCategory);
    }, [selectedCategory]);

    // Hiker Tab & Status derived for current simulation state
    const currentHikerTab: 'pending' | 'upcoming' | 'history' = useMemo(() => {
        const status = simulatedBooking.status;
        if (['cancelled', 'refund', 'refunded', 'finished', 'expired'].includes(status)) {
            return 'history';
        }
        if (['paid', 'downpayment', 'rescheduled', 'completed'].includes(status)) {
            return 'upcoming';
        }
        return 'pending';
    }, [simulatedBooking.status]);

    const currentAdminTab: string = useMemo(() => {
        const status = simulatedBooking.status;
        if (['for-reservation', 'for-cancellation'].includes(status)) {
            return 'Needs Review';
        }
        if (status === 'for-payment') return 'For Payment';
        if (['paid', 'downpayment'].includes(status)) return 'Fully Paid';
        return 'Rejected / Cancelled';
    }, [simulatedBooking.status]);

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                title="Cancellation & Parity Inspector"
                centerTitle={true}
                onBackPress={onBackPress}
            />

            <ScrollView
                style={styles.container}
                contentContainerStyle={[styles.scrollContent, !isMobile && styles.desktopContent]}
                showsVerticalScrollIndicator={false}
            >
                {/* Developer Safety Notice Banner */}
                <View style={styles.devBanner}>
                    <View style={styles.devBannerRow}>
                        <CustomIcon library="Feather" name="shield" size={18} color={Colors.PRIMARY} />
                        <CustomText variant="caption" style={styles.devBannerTitle}>
                            DEVELOPER LIFECYCLE SIMULATOR & COVERAGE INSPECTOR
                        </CustomText>
                    </View>
                    <CustomText variant="caption" style={styles.devBannerSubtitle}>
                        100% in-memory React state. Zero database impact. Audits frontend UI coverage against backend catches.
                    </CustomText>
                </View>

                {/* Segmented Mode Selector */}
                <View style={styles.segmentedContainer}>
                    <TouchableOpacity
                        style={[styles.segmentBtn, mode === 'simulator' && styles.segmentBtnActive]}
                        onPress={() => setMode('simulator')}
                        activeOpacity={0.8}
                    >
                        <CustomIcon
                            library="Feather"
                            name="play-circle"
                            size={16}
                            color={mode === 'simulator' ? Colors.WHITE : Colors.TEXT_SECONDARY}
                        />
                        <CustomText
                            variant="body"
                            style={[styles.segmentText, mode === 'simulator' && styles.segmentTextActive]}
                        >
                            Interactive Simulator
                        </CustomText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.segmentBtn, mode === 'matrix' && styles.segmentBtnActive]}
                        onPress={() => setMode('matrix')}
                        activeOpacity={0.8}
                    >
                        <CustomIcon
                            library="Feather"
                            name="grid"
                            size={16}
                            color={mode === 'matrix' ? Colors.WHITE : Colors.TEXT_SECONDARY}
                        />
                        <CustomText
                            variant="body"
                            style={[styles.segmentText, mode === 'matrix' && styles.segmentTextActive]}
                        >
                            Backend vs. UI Matrix
                        </CustomText>
                    </TouchableOpacity>
                </View>

                {/* MODE A: INTERACTIVE SIMULATOR */}
                {mode === 'simulator' && (
                    <View style={styles.sectionGap}>
                        {/* 1. Visual Progress Pipeline */}
                        <View style={styles.card}>
                            <View style={styles.cardHeaderRow}>
                                <CustomIcon library="Feather" name="git-commit" size={18} color={Colors.PRIMARY} />
                                <CustomText variant="h3" style={styles.cardTitle}>
                                    Sub-Approval Pipeline Progress
                                </CustomText>
                            </View>

                            <View style={styles.pipelineBar}>
                                <View style={[styles.pipelineStep, currentStepIndex >= 1 && styles.pipelineStepActive]}>
                                    <View style={[styles.stepCircle, currentStepIndex >= 1 && styles.stepCircleActive]}>
                                        <CustomText variant="caption" style={currentStepIndex >= 1 ? styles.stepNumActive : styles.stepNum}>1</CustomText>
                                    </View>
                                    <CustomText variant="caption" style={styles.stepLabel}>Initial Phase</CustomText>
                                </View>

                                <View style={[styles.pipelineConnector, currentStepIndex >= 2 && styles.pipelineConnectorActive]} />

                                <View style={[styles.pipelineStep, currentStepIndex >= 2 && styles.pipelineStepActive]}>
                                    <View style={[styles.stepCircle, currentStepIndex >= 2 && styles.stepCircleActive]}>
                                        <CustomText variant="caption" style={currentStepIndex >= 2 ? styles.stepNumActive : styles.stepNum}>2</CustomText>
                                    </View>
                                    <CustomText variant="caption" style={styles.stepLabel}>Sub-Approval</CustomText>
                                </View>

                                <View style={[styles.pipelineConnector, currentStepIndex >= 3 && styles.pipelineConnectorActive]} />

                                <View style={[styles.pipelineStep, currentStepIndex >= 3 && styles.pipelineStepActive]}>
                                    <View style={[styles.stepCircle, currentStepIndex >= 3 && styles.stepCircleActive]}>
                                        <CustomText variant="caption" style={currentStepIndex >= 3 ? styles.stepNumActive : styles.stepNum}>3</CustomText>
                                    </View>
                                    <CustomText variant="caption" style={styles.stepLabel}>Admin Decision</CustomText>
                                </View>

                                <View style={[styles.pipelineConnector, currentStepIndex >= 4 && styles.pipelineConnectorActive]} />

                                <View style={[styles.pipelineStep, currentStepIndex >= 4 && styles.pipelineStepActive]}>
                                    <View style={[styles.stepCircle, currentStepIndex >= 4 && styles.stepCircleActive]}>
                                        <CustomText variant="caption" style={currentStepIndex >= 4 ? styles.stepNumActive : styles.stepNum}>4</CustomText>
                                    </View>
                                    <CustomText variant="caption" style={styles.stepLabel}>Resolution</CustomText>
                                </View>
                            </View>

                            <View style={styles.activeStatusPillRow}>
                                <CustomText variant="caption" style={styles.statusPillLabel}>Simulated Status:</CustomText>
                                <View style={styles.activeStatusPill}>
                                    <CustomText variant="caption" style={styles.activeStatusPillText}>
                                        {simulatedBooking.status}
                                    </CustomText>
                                </View>
                                {simulatedCancellation?.status && (
                                    <View style={[styles.activeStatusPill, { backgroundColor: '#EDE9FE' }]}>
                                        <CustomText variant="caption" style={[styles.activeStatusPillText, { color: '#6D28D9' }]}>
                                            cancellation: {simulatedCancellation.status}
                                        </CustomText>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* 2. Preset Scenario Selector */}
                        <View style={styles.card}>
                            <View style={styles.cardHeaderRow}>
                                <CustomIcon library="Feather" name="list" size={18} color={Colors.PRIMARY} />
                                <CustomText variant="h3" style={styles.cardTitle}>
                                    Select Preset Scenario (10 Scenarios)
                                </CustomText>
                            </View>
                            <CustomText variant="caption" style={styles.cardDescription}>
                                Tap any preset to immediately load its corresponding booking phase, sub-approval state, and audit catch:
                            </CustomText>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.presetScroll}
                            >
                                {PRESET_SCENARIOS.map(preset => {
                                    const isSelected = preset.id === selectedScenarioId;
                                    return (
                                        <TouchableOpacity
                                            key={preset.id}
                                            style={[styles.presetChip, isSelected && styles.presetChipActive]}
                                            onPress={() => handleSelectScenario(preset)}
                                            activeOpacity={0.8}
                                        >
                                            <CustomText
                                                variant="caption"
                                                style={[styles.presetChipTitle, isSelected && styles.presetChipTitleActive]}
                                            >
                                                {preset.title}
                                            </CustomText>
                                            <CustomText
                                                variant="caption"
                                                style={[styles.presetChipSubtitle, isSelected && styles.presetChipSubtitleActive]}
                                                numberOfLines={1}
                                            >
                                                {preset.subtitle}
                                            </CustomText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* 3. Interactive Transition Controls */}
                        <View style={styles.card}>
                            <View style={styles.cardHeaderRow}>
                                <CustomIcon library="Feather" name="sliders" size={18} color={Colors.PRIMARY} />
                                <CustomText variant="h3" style={styles.cardTitle}>
                                    Manual Transition Controls
                                </CustomText>
                            </View>

                            <View style={styles.actionButtonsWrap}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { borderColor: '#D97706' }]}
                                    onPress={handleSimulateUserRequestCancel}
                                >
                                    <CustomIcon library="Feather" name="corner-down-right" size={14} color="#D97706" />
                                    <CustomText variant="caption" style={[styles.actionBtnText, { color: '#D97706' }]}>
                                        [Hiker] Request Cancel
                                    </CustomText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, { borderColor: Colors.PRIMARY }]}
                                    onPress={handleSimulateAdminApprove}
                                >
                                    <CustomIcon library="Feather" name="check-circle" size={14} color={Colors.PRIMARY} />
                                    <CustomText variant="caption" style={[styles.actionBtnText, { color: Colors.PRIMARY }]}>
                                        [Admin] Approve Cancel
                                    </CustomText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, { borderColor: Colors.ERROR }]}
                                    onPress={handleSimulateAdminDecline}
                                >
                                    <CustomIcon library="Feather" name="x-circle" size={14} color={Colors.ERROR} />
                                    <CustomText variant="caption" style={[styles.actionBtnText, { color: Colors.ERROR }]}>
                                        [Admin] Decline with Note
                                    </CustomText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, { borderColor: '#2563EB' }]}
                                    onPress={handleSimulateHikerAppeal}
                                >
                                    <CustomIcon library="Feather" name="refresh-cw" size={14} color="#2563EB" />
                                    <CustomText variant="caption" style={[styles.actionBtnText, { color: '#2563EB' }]}>
                                        [Hiker] Appeal Decline
                                    </CustomText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, { borderColor: '#4B5563' }]}
                                    onPress={handleSimulateHikerWithdraw}
                                >
                                    <CustomIcon library="Feather" name="rotate-ccw" size={14} color="#4B5563" />
                                    <CustomText variant="caption" style={[styles.actionBtnText, { color: '#4B5563' }]}>
                                        [Hiker] Withdraw Request
                                    </CustomText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, { borderColor: '#7C3AED' }]}
                                    onPress={handleSimulateOrganizerCancelHike}
                                >
                                    <CustomIcon library="Feather" name="alert-triangle" size={14} color="#7C3AED" />
                                    <CustomText variant="caption" style={[styles.actionBtnText, { color: '#7C3AED' }]}>
                                        [Admin] Force Cancel Hike
                                    </CustomText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, { borderColor: Colors.GRAY_MEDIUM, borderStyle: 'dashed' }]}
                                    onPress={handleResetSimulation}
                                >
                                    <CustomIcon library="Feather" name="repeat" size={14} color={Colors.TEXT_SECONDARY} />
                                    <CustomText variant="caption" style={[styles.actionBtnText, { color: Colors.TEXT_SECONDARY }]}>
                                        Reset to Preset
                                    </CustomText>
                                </TouchableOpacity>
                            </View>

                            {actionNotice && (
                                <View style={styles.actionNoticeBox}>
                                    <CustomIcon library="Feather" name="info" size={14} color={Colors.PRIMARY} />
                                    <CustomText variant="caption" style={styles.actionNoticeText}>
                                        {actionNotice}
                                    </CustomText>
                                </View>
                            )}
                        </View>

                        {/* 4. Active Step Coverage & Parity Inspector */}
                        <View style={[styles.card, styles.inspectorCard]}>
                            <View style={styles.cardHeaderRow}>
                                <CustomIcon library="Feather" name="cpu" size={18} color="#059669" />
                                <CustomText variant="h3" style={styles.cardTitle}>
                                    Live Step Coverage & Parity Inspector
                                </CustomText>
                            </View>

                            {/* UI Display Coverage */}
                            <View style={styles.inspectorBlock}>
                                <View style={styles.inspectorHeaderRow}>
                                    <CustomText variant="body" style={styles.inspectorBlockTitle}>
                                        1. Frontend UI Coverage:
                                    </CustomText>
                                    <View style={styles.badgeSuccess}>
                                        <CustomText variant="caption" style={styles.badgeSuccessText}>
                                            ✅ FULLY COVERED IN UI
                                        </CustomText>
                                    </View>
                                </View>
                                <CustomText variant="caption" style={styles.inspectorDesc}>
                                    {activeScenarioDef.uiCoverage.description}
                                </CustomText>
                                <View style={styles.pillWrap}>
                                    {activeScenarioDef.uiCoverage.screens.map((screen, idx) => (
                                        <View key={idx} style={styles.techPill}>
                                            <CustomText variant="caption" style={styles.techPillText}>
                                                {screen}
                                            </CustomText>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Backend Implementation Status */}
                            <View style={styles.inspectorBlock}>
                                <View style={styles.inspectorHeaderRow}>
                                    <CustomText variant="body" style={styles.inspectorBlockTitle}>
                                        2. Backend Implementation Status:
                                    </CustomText>
                                    <View
                                        style={[
                                            styles.badgeGeneral,
                                            activeScenarioDef.backendCoverage.status === 'SUPPORTED'
                                                ? styles.badgeSuccess
                                                : activeScenarioDef.backendCoverage.status === 'DEFECT' || activeScenarioDef.backendCoverage.status === 'GAP'
                                                    ? styles.badgeError
                                                    : styles.badgeWarning,
                                        ]}
                                    >
                                        <CustomText
                                            variant="caption"
                                            style={
                                                activeScenarioDef.backendCoverage.status === 'SUPPORTED'
                                                    ? styles.badgeSuccessText
                                                    : activeScenarioDef.backendCoverage.status === 'DEFECT' || activeScenarioDef.backendCoverage.status === 'GAP'
                                                        ? styles.badgeErrorText
                                                        : styles.badgeWarningText
                                            }
                                        >
                                            {activeScenarioDef.backendCoverage.status === 'SUPPORTED' && '✅ SUPPORTED'}
                                            {activeScenarioDef.backendCoverage.status === 'STUBBED' && '⚠️ STUBBED'}
                                            {activeScenarioDef.backendCoverage.status === 'DEFECT' && '❌ DEFECT'}
                                            {activeScenarioDef.backendCoverage.status === 'GAP' && '❌ CRITICAL GAP'}
                                        </CustomText>
                                    </View>
                                </View>
                                <CustomText variant="caption" style={styles.hookRefText}>
                                    Source: {activeScenarioDef.backendCoverage.hookOrStore}
                                </CustomText>
                                <CustomText variant="caption" style={styles.inspectorDesc}>
                                    {activeScenarioDef.backendCoverage.detail}
                                </CustomText>
                            </View>

                            {/* Parity Discrepancy Breakdown */}
                            <View style={styles.discrepancyBox}>
                                <CustomText variant="body" style={styles.discrepancyTitle}>
                                    Parity Breakdown (UI vs. Backend):
                                </CustomText>
                                <CustomText variant="caption" style={styles.discrepancyText}>
                                    {activeScenarioDef.parityBreakdown}
                                </CustomText>
                            </View>

                            {/* Expected Firestore Payload */}
                            <View style={styles.payloadBox}>
                                <CustomText variant="caption" style={styles.payloadTitle}>
                                    Expected Payload for arREY-N:
                                </CustomText>
                                <CustomText variant="caption" style={styles.payloadCode}>
                                    {activeScenarioDef.expectedFirestorePayload}
                                </CustomText>
                            </View>
                        </View>

                        {/* 5. Dual-Perspective Live Previews */}
                        {/* A: Hiker POV */}
                        <View style={styles.card}>
                            <View style={styles.cardHeaderRow}>
                                <CustomIcon library="Feather" name="smartphone" size={18} color={Colors.PRIMARY} />
                                <CustomText variant="h3" style={styles.cardTitle}>
                                    Hiker Mobile App Perspective
                                </CustomText>
                            </View>

                            <View style={styles.povMetadataRow}>
                                <View style={styles.povMetaItem}>
                                    <CustomText variant="caption" style={styles.povMetaLabel}>MyBookings Tab:</CustomText>
                                    <View style={styles.povMetaBadge}>
                                        <CustomText variant="caption" style={styles.povMetaBadgeText}>
                                            {currentHikerTab.toUpperCase()}
                                        </CustomText>
                                    </View>
                                </View>

                                <View style={styles.povMetaItem}>
                                    <CustomText variant="caption" style={styles.povMetaLabel}>Display Badge:</CustomText>
                                    <View
                                        style={[
                                            styles.povMetaBadge,
                                            {
                                                backgroundColor: activeScenarioDef.hikerBadgeBg,
                                            },
                                        ]}
                                    >
                                        <CustomText
                                            variant="caption"
                                            style={{
                                                color: activeScenarioDef.hikerBadgeColor,
                                                fontWeight: 'bold',
                                                fontSize: 11,
                                            }}
                                        >
                                            {activeScenarioDef.hikerBadgeText}
                                        </CustomText>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <CustomText variant="caption" style={styles.componentPreviewLabel}>
                                LIVE 4-STEP TRACKER (BookingStatus.tsx):
                            </CustomText>
                            <BookingStatusComponent
                                status={simulatedBooking.status}
                                isPaid={simulatedBooking.payment.length > 0}
                            />

                            <CustomText variant="caption" style={styles.componentPreviewLabel}>
                                LIVE LIFECYCLE CARD (CancellationCard.tsx):
                            </CustomText>

                            <CancellationCard
                                booking={simulatedBooking}
                                cancellation={simulatedCancellation}
                                onWithdraw={handleSimulateHikerWithdraw}
                                onAppeal={handleSimulateHikerAppeal}
                                onAcceptAdminCancellation={handleSimulateHikerWithdraw}
                                onReschedule={() => setActionNotice('Reschedule triggered. Opens RescheduleModal in live app.')}
                            />

                            <CustomText variant="caption" style={styles.componentPreviewLabel}>
                                LIVE REQUIRED DOCUMENTS (RequiredDocumentsSection.tsx):
                            </CustomText>
                            <RequiredDocumentsSection
                                localDocs={simulatedDocs}
                                originalRejectedIndices={[]}
                                stagedReplacements={{}}
                                displayStatus={simulatedBooking.status}
                                isCancelled={['cancelled', 'refund', 'refunded'].includes(simulatedBooking.status)}
                                onUploadSuccess={(_idx, _url, docName) => {
                                    setActionNotice(`Uploaded replacement for "${docName}" (simulator).`);
                                }}
                                onPreviewDoc={(url) => {
                                    setActionNotice(`Preview document: ${url}`);
                                }}
                            />

                            <TouchableOpacity
                                style={styles.openModalBtn}
                                onPress={() => setIsCancelModalOpen(true)}
                                activeOpacity={0.8}
                            >
                                <CustomIcon library="Feather" name="external-link" size={14} color={Colors.WHITE} />
                                <CustomText variant="caption" style={styles.openModalBtnText}>
                                    Test UI: Open Cancel Booking Modal
                                </CustomText>
                            </TouchableOpacity>
                        </View>

                        {/* B: Admin POV */}
                        <View style={styles.card}>
                            <View style={styles.cardHeaderRow}>
                                <CustomIcon library="Feather" name="monitor" size={18} color={Colors.PRIMARY} />
                                <CustomText variant="h3" style={styles.cardTitle}>
                                    Tour Organizer Perspective (Web Admin)
                                </CustomText>
                            </View>

                            <View style={styles.povMetadataRow}>
                                <View style={styles.povMetaItem}>
                                    <CustomText variant="caption" style={styles.povMetaLabel}>Offer Filter Tab:</CustomText>
                                    <View style={styles.povMetaBadge}>
                                        <CustomText variant="caption" style={styles.povMetaBadgeText}>
                                            {currentAdminTab}
                                        </CustomText>
                                    </View>
                                </View>
                            </View>

                            <CustomText variant="caption" style={styles.componentPreviewLabel}>
                                LIVE OFFER MANIFEST CARD (AdminBookingCard.tsx):
                            </CustomText>
                            <AdminBookingCard
                                booking={simulatedBooking}
                                offerId={simulatedBooking.offer?.id || 'offer-sim-404'}
                                onViewBooking={() => setActionNotice('Tapped AdminBookingCard in manifest.')}
                            />

                            {(simulatedBooking.status === 'for-cancellation' || simulatedCancellation?.status === 'rejected') && (
                                <>
                                    <CustomText variant="caption" style={styles.componentPreviewLabel}>
                                        LIVE CANCELLATION DETAILS BANNER (AdminCancellationCard.tsx):
                                    </CustomText>
                                    <AdminCancellationCard
                                        status={simulatedBooking.status}
                                        cancellationReason={simulatedBooking.cancellationReason || simulatedCancellation?.reason}
                                        declineReason={simulatedCancellation?.adminNote}
                                        totalAmountPaid={simulatedBooking.payment.reduce((acc, p) => acc + (p.amount || 0), 0)}
                                        requestedAt={simulatedCancellation?.createdAt || simulatedBooking.updatedAt}
                                        cancelledBy={simulatedBooking.cancelledBy || simulatedCancellation?.cancelledBy}
                                    />
                                </>
                            )}

                            {isSimulatingDecline && (
                                <View style={styles.declineBoxContainer}>
                                    <CustomFeedbackInput
                                        label="Decline Reason *"
                                        helperText="Select a reason suggestion chip or type custom feedback."
                                        placeholder="Explain why cancellation cannot be approved..."
                                        value={simulatedDeclineReason}
                                        onChangeText={setSimulatedDeclineReason}
                                        suggestions={[...CANCELLATION_DECLINE_REASONS]}
                                        variant="danger"
                                    />
                                    <View style={styles.declineActionBtnsRow}>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: Colors.ERROR, borderColor: Colors.ERROR }]}
                                            onPress={handleConfirmSimulatedDecline}
                                        >
                                            <CustomIcon library="Feather" name="x-circle" size={14} color={Colors.WHITE} />
                                            <CustomText variant="caption" style={[styles.actionBtnText, { color: Colors.WHITE }]}>
                                                Submit Decline
                                            </CustomText>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { borderColor: Colors.GRAY_MEDIUM }]}
                                            onPress={() => setIsSimulatingDecline(false)}
                                        >
                                            <CustomText variant="caption" style={[styles.actionBtnText, { color: Colors.TEXT_SECONDARY }]}>
                                                Cancel
                                            </CustomText>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {simulatedDocs.length > 0 && (
                                <>
                                    <CustomText variant="caption" style={styles.componentPreviewLabel}>
                                        LIVE DOCUMENT REVIEW CARDS (DocumentReviewCard.tsx):
                                    </CustomText>
                                    {simulatedDocs.map((doc, idx) => (
                                        <DocumentReviewCard
                                            key={idx}
                                            doc={{
                                                name: doc.name || 'Document',
                                                file: doc.file || 'https://example.com/file.jpg',
                                                valid: (doc.valid === 'approved' || doc.valid === 'rejected') ? doc.valid : 'pending',
                                            }}
                                            index={idx}
                                            needsReview={doc.valid !== 'approved' && doc.valid !== 'rejected'}
                                            isViewed={true}
                                            isReviewComplete={false}
                                            isCancelledStatus={['cancelled', 'refund', 'refunded'].includes(simulatedBooking.status)}
                                            onViewFile={(fileUrl) => setActionNotice(`View attachment: ${fileUrl}`)}
                                            onToggleDecision={(index, status) => {
                                                setSimulatedDocs(prev => {
                                                    const copy = [...prev];
                                                    copy[index] = { ...copy[index], valid: status };
                                                    return copy;
                                                });
                                                setActionNotice(`Admin marked document #${index + 1} as "${status}".`);
                                            }}
                                        />
                                    ))}
                                </>
                            )}

                            <View style={styles.adminManifestCard}>
                                <View style={styles.adminManifestRow}>
                                    <CustomText variant="body" style={styles.adminHikerName}>
                                        Echo Hiker (1 Pax)
                                    </CustomText>
                                    <View style={styles.adminStatusTag}>
                                        <CustomText variant="caption" style={styles.adminStatusTagText}>
                                            {simulatedBooking.status}
                                        </CustomText>
                                    </View>
                                </View>
                                <CustomText variant="caption" style={styles.adminTrailName}>
                                    Mt. Daraitan & Tinipak River Trail
                                </CustomText>
                                <CustomText variant="caption" style={styles.adminAvailableActionsLabel}>
                                    Organizer Actions Enabled in this State:
                                </CustomText>
                                <View style={styles.adminActionTagsWrap}>
                                    {activeScenarioDef.adminActions.map((act, i) => (
                                        <View key={i} style={styles.adminActionTag}>
                                            <CustomText variant="caption" style={styles.adminActionTagText}>
                                                {act}
                                            </CustomText>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* MODE B: FULL BACKEND VS. UI COVERAGE MATRIX */}
                {mode === 'matrix' && (
                    <View style={styles.sectionGap}>
                        {/* KPI Summary Cards */}
                        <View style={styles.kpiGrid}>
                            <View style={styles.kpiCard}>
                                <CustomText variant="caption" style={styles.kpiLabel}>Cataloged Statuses</CustomText>
                                <CustomText variant="h2" style={styles.kpiValue}>18</CustomText>
                                <CustomText variant="caption" style={styles.kpiDesc}>Complete System</CustomText>
                            </View>

                            <View style={styles.kpiCard}>
                                <CustomText variant="caption" style={styles.kpiLabel}>UI Fully Covered</CustomText>
                                <CustomText variant="h2" style={[styles.kpiValue, { color: '#059669' }]}>18 / 18</CustomText>
                                <CustomText variant="caption" style={styles.kpiDesc}>100% Frontend Ready</CustomText>
                            </View>

                            <View style={styles.kpiCard}>
                                <CustomText variant="caption" style={styles.kpiLabel}>Backend Gaps</CustomText>
                                <CustomText variant="h2" style={[styles.kpiValue, { color: Colors.ERROR }]}>7</CustomText>
                                <CustomText variant="caption" style={styles.kpiDesc}>Catches 23–29</CustomText>
                            </View>
                        </View>

                        {/* Category Filter Pills */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoryScroll}
                        >
                            {(
                                [
                                    'ALL',
                                    'Phase 1: Verification',
                                    'Phase 2: Payment',
                                    'Phase 3: Operations',
                                    'Sub-Approval: Cancellation',
                                    'Sub-Approval: Reschedule',
                                ] as CategoryFilter[]
                            ).map(cat => {
                                const isSelected = selectedCategory === cat;
                                return (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                                        onPress={() => setSelectedCategory(cat)}
                                        activeOpacity={0.8}
                                    >
                                        <CustomText
                                            variant="caption"
                                            style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}
                                        >
                                            {cat}
                                        </CustomText>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Matrix List Items */}
                        <View style={styles.matrixList}>
                            {filteredMatrix.map((item, index) => {
                                const isGap = item.verdict === 'GAP_BACKEND' || item.verdict === 'DEFECT_BACKEND';
                                const isPartial = item.verdict === 'PARTIAL_BACKEND';

                                return (
                                    <View key={item.status} style={styles.matrixCard}>
                                        <View style={styles.matrixHeaderRow}>
                                            <View style={styles.matrixStatusCol}>
                                                <View style={styles.statusIndexPill}>
                                                    <CustomText variant="caption" style={styles.statusIndexText}>
                                                        #{index + 1}
                                                    </CustomText>
                                                </View>
                                                <CustomText variant="h3" style={styles.matrixStatusName}>
                                                    {item.status}
                                                </CustomText>
                                            </View>
                                            <View
                                                style={[
                                                    styles.badgeGeneral,
                                                    isGap
                                                        ? styles.badgeError
                                                        : isPartial
                                                            ? styles.badgeWarning
                                                            : styles.badgeSuccess,
                                                ]}
                                            >
                                                <CustomText
                                                    variant="caption"
                                                    style={
                                                        isGap
                                                            ? styles.badgeErrorText
                                                            : isPartial
                                                                ? styles.badgeWarningText
                                                                : styles.badgeSuccessText
                                                    }
                                                >
                                                    {item.verdictLabel}
                                                </CustomText>
                                            </View>
                                        </View>

                                        <CustomText variant="caption" style={styles.matrixCategoryLabel}>
                                            Category: {item.category}
                                        </CustomText>

                                        <View style={styles.matrixDivider} />

                                        {/* Existing on Backend */}
                                        <View style={styles.matrixRow}>
                                            <CustomText variant="caption" style={styles.matrixSectionLabel}>
                                                Existing on Backend:
                                            </CustomText>
                                            <CustomText variant="caption" style={styles.matrixBackendText}>
                                                {item.existingOnBackend}
                                            </CustomText>
                                        </View>

                                        {/* Displayed by UI */}
                                        <View style={styles.matrixRow}>
                                            <CustomText variant="caption" style={styles.matrixSectionLabel}>
                                                Displayed by UI:
                                            </CustomText>
                                            <CustomText variant="caption" style={styles.matrixUiText}>
                                                {item.displayedByUI}
                                            </CustomText>
                                        </View>

                                        {/* Action Required */}
                                        {item.catchRef !== 'None' && (
                                            <View style={styles.matrixActionRequiredBox}>
                                                <CustomText variant="caption" style={styles.matrixActionLabel}>
                                                    Backend Modification Needed ({item.catchRef}):
                                                </CustomText>
                                                <CustomText variant="caption" style={styles.matrixActionText}>
                                                    {item.backendActionRequired}
                                                </CustomText>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Live CancelBookingModal for Simulator Testing */}
            <CancelBookingModal
                visible={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={handleModalCancelSubmit}
                actionType={simulatedBooking.status === 'cancellation-rejected' ? 'update' : simulatedBooking.payment.length > 0 ? 'refund' : 'cancel'}
                initialReason={simulatedBooking.cancellationReason}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 48,
    },
    desktopContent: {
        alignSelf: 'center',
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
    },
    sectionGap: {
        gap: 16,
    },
    devBanner: {
        backgroundColor: '#ECFDF5',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        marginBottom: 14,
    },
    devBannerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    devBannerTitle: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 11,
        letterSpacing: 0.5,
    },
    devBannerSubtitle: {
        color: '#065F46',
        fontSize: 12,
        lineHeight: 16,
    },
    segmentedContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginBottom: 16,
    },
    segmentBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 8,
    },
    segmentBtnActive: {
        backgroundColor: Colors.PRIMARY,
    },
    segmentText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
        fontSize: 13,
    },
    segmentTextActive: {
        color: Colors.WHITE,
    },
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    cardTitle: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardDescription: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        lineHeight: 16,
        marginBottom: 12,
    },
    pipelineBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    pipelineStep: {
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    pipelineStepActive: {
        opacity: 1,
    },
    stepCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: Colors.GRAY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircleActive: {
        backgroundColor: Colors.PRIMARY,
    },
    stepNum: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
        fontWeight: 'bold',
    },
    stepNumActive: {
        color: Colors.WHITE,
        fontSize: 11,
        fontWeight: 'bold',
    },
    stepLabel: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
    },
    pipelineConnector: {
        height: 2,
        flex: 0.6,
        backgroundColor: Colors.GRAY_LIGHT,
        marginBottom: 14,
    },
    pipelineConnectorActive: {
        backgroundColor: Colors.PRIMARY,
    },
    activeStatusPillRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
    },
    statusPillLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
    },
    activeStatusPill: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    activeStatusPillText: {
        color: '#92400E',
        fontWeight: 'bold',
        fontSize: 11,
    },
    presetScroll: {
        gap: 10,
        paddingVertical: 4,
    },
    presetChip: {
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        width: 170,
    },
    presetChipActive: {
        backgroundColor: '#ECFDF5',
        borderColor: Colors.PRIMARY,
    },
    presetChipTitle: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '700',
        fontSize: 12,
        marginBottom: 4,
    },
    presetChipTitleActive: {
        color: Colors.PRIMARY,
    },
    presetChipSubtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 10,
    },
    presetChipSubtitleActive: {
        color: '#065F46',
    },
    actionButtonsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: Colors.WHITE,
    },
    actionBtnText: {
        fontWeight: '600',
        fontSize: 11,
    },
    actionNoticeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        padding: 10,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    actionNoticeText: {
        color: '#166534',
        fontSize: 12,
        flex: 1,
    },
    inspectorCard: {
        backgroundColor: '#F8FAFC',
        borderColor: '#CBD5E1',
    },
    inspectorBlock: {
        marginBottom: 12,
    },
    inspectorHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    inspectorBlockTitle: {
        fontWeight: '700',
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
    },
    inspectorDesc: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        lineHeight: 16,
        marginBottom: 6,
    },
    hookRefText: {
        color: Colors.PRIMARY,
        fontWeight: '600',
        fontSize: 11,
        marginBottom: 4,
    },
    pillWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    techPill: {
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    techPillText: {
        color: '#475569',
        fontSize: 10,
        fontWeight: '600',
    },
    badgeGeneral: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeSuccess: {
        backgroundColor: '#D1FAE5',
    },
    badgeSuccessText: {
        color: '#065F46',
        fontWeight: 'bold',
        fontSize: 10,
    },
    badgeWarning: {
        backgroundColor: '#FEF3C7',
    },
    badgeWarningText: {
        color: '#92400E',
        fontWeight: 'bold',
        fontSize: 10,
    },
    badgeError: {
        backgroundColor: '#FEE2E2',
    },
    badgeErrorText: {
        color: '#991B1B',
        fontWeight: 'bold',
        fontSize: 10,
    },
    discrepancyBox: {
        backgroundColor: '#FFFBEB',
        borderRadius: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: '#FDE68A',
        marginBottom: 10,
    },
    discrepancyTitle: {
        color: '#92400E',
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 2,
    },
    discrepancyText: {
        color: '#78350F',
        fontSize: 11,
        lineHeight: 16,
    },
    payloadBox: {
        backgroundColor: '#0F172A',
        borderRadius: 8,
        padding: 10,
    },
    payloadTitle: {
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 4,
    },
    payloadCode: {
        color: '#38BDF8',
        fontSize: 10,
        fontFamily: 'monospace',
        lineHeight: 14,
    },
    povMetadataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 10,
    },
    povMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    povMetaLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
    },
    povMetaBadge: {
        backgroundColor: Colors.BACKGROUND,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    povMetaBadgeText: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '700',
        fontSize: 11,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        marginVertical: 12,
    },
    componentPreviewLabel: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '700',
        fontSize: 10,
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    adminManifestCard: {
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    adminManifestRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    adminHikerName: {
        fontWeight: 'bold',
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
    },
    adminStatusTag: {
        backgroundColor: '#E0E7FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    adminStatusTagText: {
        color: '#3730A3',
        fontWeight: 'bold',
        fontSize: 10,
    },
    adminTrailName: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        marginBottom: 10,
    },
    adminAvailableActionsLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 6,
    },
    adminActionTagsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    adminActionTag: {
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    adminActionTagText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 11,
        fontWeight: '500',
    },
    kpiGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    kpiCard: {
        flex: 1,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        alignItems: 'center',
    },
    kpiLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 10,
        textAlign: 'center',
    },
    kpiValue: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        marginVertical: 4,
    },
    kpiDesc: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 9,
        textAlign: 'center',
    },
    categoryScroll: {
        gap: 8,
        paddingVertical: 4,
    },
    categoryPill: {
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    categoryPillActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    categoryPillText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: '600',
    },
    categoryPillTextActive: {
        color: Colors.WHITE,
    },
    matrixList: {
        gap: 12,
    },
    matrixCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    matrixHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    matrixStatusCol: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusIndexPill: {
        backgroundColor: Colors.BACKGROUND,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusIndexText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 10,
        fontWeight: 'bold',
    },
    matrixStatusName: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 15,
        fontWeight: 'bold',
    },
    matrixCategoryLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
    },
    matrixDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        marginVertical: 10,
    },
    matrixRow: {
        marginBottom: 6,
    },
    matrixSectionLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    matrixBackendText: {
        color: '#1E293B',
        fontSize: 12,
        lineHeight: 16,
    },
    matrixUiText: {
        color: '#065F46',
        fontSize: 12,
        lineHeight: 16,
    },
    matrixActionRequiredBox: {
        backgroundColor: '#FFF7ED',
        borderRadius: 8,
        padding: 8,
        marginTop: 6,
        borderWidth: 1,
        borderColor: '#FFEDD5',
    },
    matrixActionLabel: {
        color: '#C2410C',
        fontWeight: 'bold',
        fontSize: 10,
        marginBottom: 2,
    },
    matrixActionText: {
        color: '#9A3412',
        fontSize: 11,
        lineHeight: 15,
    },
    openModalBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginTop: 12,
    },
    openModalBtnText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 12,
    },
    declineBoxContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginVertical: 10,
    },
    declineActionBtnsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
});

export default TestScreen;
