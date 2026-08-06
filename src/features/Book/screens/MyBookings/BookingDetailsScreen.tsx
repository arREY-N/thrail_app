import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Booking } from "@/src/core/models/Booking/Booking";
import { BookingStatus, IBooking } from "@/src/core/models/Booking/Booking.types";
import { IOffer, ISchedule, IActivity } from "@/src/core/models/Offer/interfaces/Offer.types";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useTrailsStore } from "@/src/core/stores/trailStores/trailsStore";

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomLoading from '@/src/components/CustomLoading';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import DocumentUploadCard from '@/src/components/DocumentUploadCard';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { formatTime } from '@/src/utils/dateFormatter';

import AccordionItem from '@/src/features/Book/screens/MyBookings/components/AccordionItem';
import BookingStatusComponent from '@/src/features/Book/screens/MyBookings/components/BookingStatus';
import HeroHeader from '@/src/features/Book/screens/MyBookings/components/HeroHeader';
import PaymentSummaryCard from '@/src/features/Book/screens/MyBookings/components/PaymentSummaryCard';
import QuickInfoCard from '@/src/features/Book/screens/MyBookings/components/QuickInfoCard';

import ReasonModal from '@/src/features/Book/screens/MyBookings/components/ReasonModal';
import RescheduleModal from '@/src/features/Book/screens/MyBookings/components/RescheduleModal';

/**
 * Maps document names to strict keys for the upload card.
 * @param {string} docName - The name of the document
 * @returns {string} The strict document key
 */
const getStrictDocKey = (docName: string): string => {
    if (!docName) return 'validId';
    const lower = docName.toLowerCase();
    if (lower.includes('medical') || lower.includes('cert')) return 'medicalCertificate';
    if (lower.includes('bir')) return 'bir';
    if (lower.includes('dti')) return 'dti';
    if (lower.includes('denr')) return 'denr';
    return 'validId';
};

export interface BookingDetailsScreenProps {
    /** The booking data */
    booking: IBooking;
    /** Function to fetch full offer details */
    getBookOffer: (id: string) => Promise<IOffer>;
    /** Callback for back button press */
    onBackPress: () => void;
    /** Callback when user proceeds to payment */
    onProceedToPayment: (booking: IBooking) => void;
    /** Callback for reschedule confirmation */
    onReschedule?: (booking: IBooking, offerData: unknown) => void;
    /** Callback to view receipt */
    onViewReceipt: (booking: IBooking) => void;
    /** Callback for cancellation confirmation */
    onCancelConfirm: (booking: IBooking, reason: string) => void;
    /** Callback for refund confirmation */
    onRefundConfirm: (booking: IBooking, reason: string) => void;
    /** Optional callback for update press */
    onUpdatePress?: () => void;
    /** Available future offers for rescheduling */
    availableFutureOffers?: IOffer[];
}

/**
 * Screen component displaying the full details of a user's booking.
 * Handles document uploads, payments, rescheduling, and cancellation.
 * 
 * @param {BookingDetailsScreenProps} props - Component props
 */
const BookingDetailsScreen = ({ 
    booking, 
    getBookOffer,
    onBackPress, 
    onProceedToPayment, 
    onReschedule, 
    onViewReceipt,
    onCancelConfirm,
    onRefundConfirm,
    onUpdatePress,
    availableFutureOffers = [] 
}: BookingDetailsScreenProps) => {
    const [showActionMenu, setShowActionMenu] = useState<boolean>(false);
    const [activeReasonModal, setActiveReasonModal] = useState<'cancel' | 'refund' | null>(null); 
    const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);
    
    const [fullOffer, setFullOffer] = useState<IOffer | null>(null);
    const [isLoadingOffer, setIsLoadingOffer] = useState<boolean>(true);
    
    const [localDocs, setLocalDocs] = useState<any>([]);
    const [localStatus, setLocalStatus] = useState<BookingStatus | string | undefined>(booking?.status);

    const updateBookingInStore = useBookingsStore(s => s.create);

    useEffect(() => {
        setLocalDocs(booking?.documents || []);
        setLocalStatus(booking?.status);
    }, [booking]);

    useEffect(() => {
        const fetchOfferDetails = async () => {
            const offerToUse = booking?.offer as unknown as IOffer;
            if (offerToUse && offerToUse.schedule && offerToUse.schedule.length > 0) {
                setFullOffer(offerToUse);
                setIsLoadingOffer(false);
                return;
            }

            if (booking?.offer?.id) {
                setIsLoadingOffer(true);
                try {
                    const fetchedData = await getBookOffer(booking.offer.id);
                    setFullOffer(fetchedData);
                } catch (error) {
                    console.error("Failed to load offer details:", error);
                } finally {
                    setIsLoadingOffer(false);
                }
            } else {
                setIsLoadingOffer(false);
            }
        };

        fetchOfferDetails();
    }, [booking?.offer?.id]);

    let displayStatus = localStatus;
    if (localStatus === 'cancelled' || localStatus === 'for-cancellation') {
        const payments = booking?.payment || [];
        const hasRefund = payments.some(p => p.status === 'refunded' || (p.status as string) === 'refund');
        if (hasRefund) {
            displayStatus = 'refunded';
        }
    }

    const totalAmount = booking?.offer?.price || 0;
    const amountPaid = booking?.payment?.reduce((sum, p) => {
        if (p.status === 'captured') return sum + (p.amount || 0);
        return sum;
    }, 0) || 0;
    const remainingBalance = totalAmount - amountPaid;
    
    const user = booking?.user;
    const emergencyContact = booking?.emergencyContact;
    const cancellationReason = booking?.cancellationReason;

    const isCancelled = ['for-cancellation', 'cancellation-rejected', 'refund', 'refunded', 'cancelled', 'reschedule-rejected'].includes(displayStatus as string);
    const isConfirmed = ['paid', 'completed', 'downpayment'].includes(displayStatus as string);
    
    const canCancel = ['for-reservation', 'pending-docs', 'for-reschedule', 'for-payment', 'approved-docs'].includes(displayStatus as string);
    const canRefund = isConfirmed;
    const canReschedule = ['for-reservation', 'pending-docs', 'for-reschedule'].includes(displayStatus as string);
    
    const showMenuIcon = !isCancelled && (canCancel || canRefund || canReschedule);
    const hasHistoricalPayments = (booking?.payment?.length || 0) > 0;

    const inclusions = fullOffer?.inclusions || [];
    const thingsToBring = fullOffer?.thingsToBring || [];
    const reminders = fullOffer?.reminders || [];
    const schedule = fullOffer?.schedule || [];

    const trails = useTrailsStore(s => s.data);
    const fullTrail = trails.find(t => t.id === booking?.trail?.id);

    const enhancedBooking: unknown = {
        ...booking,
        status: displayStatus,
        offer: {
            ...booking?.offer,
            duration: fullOffer?.duration || 'N/A',
            endDate: fullOffer?.endDate || booking?.offer?.date
        },
        trail: {
            ...booking?.trail,
            location: fullTrail?.general?.address || fullTrail?.general?.province?.join(', ') || 'N/A'
        }
    };

    const getFooterConfig = () => {
        if (canReschedule) {
            return {
                primaryButton: { 
                    title: "Reschedule", 
                    variant: "primary" as const, 
                    style: { borderRadius: 12 },
                    onPress: () => setShowRescheduleModal(true) 
                }
            };
        }

        if (displayStatus === 'for-payment' || displayStatus === 'approved-docs') {
            return {
                primaryButton: { 
                    title: "Complete Payment", 
                    variant: "primary" as const, 
                    style: { borderRadius: 12, backgroundColor: Colors.PRIMARY }, 
                    onPress: () => onProceedToPayment(booking) 
                }
            };
        }

        if (displayStatus === 'downpayment') {
            return {
                secondaryButton: { 
                    title: "View Receipt", 
                    variant: "outline" as const, 
                    style: { borderColor: Colors.PRIMARY, borderRadius: 12 },
                    textStyle: { color: Colors.PRIMARY },
                    onPress: () => onViewReceipt(booking) 
                },
                primaryButton: { 
                    title: "Pay Balance", 
                    variant: "primary" as const, 
                    style: { borderRadius: 12, backgroundColor: Colors.PRIMARY }, 
                    onPress: () => onProceedToPayment(booking) 
                }
            };
        }

        if (isConfirmed || (isCancelled && hasHistoricalPayments)) {
            return {
                primaryButton: { 
                    title: "View Receipt", 
                    variant: "primary" as const, 
                    style: { borderRadius: 12 },
                    onPress: () => onViewReceipt(booking) 
                }
            };
        }

        return null; 
    };

    const renderDocumentRow = (docObj: any, idx: number) => {
        const docName = docObj.name || Object.keys(docObj)[0] || 'Document';
        const rawValid = docObj.valid !== undefined ? docObj.valid : Object.values(docObj)[0];
        
        let validState = 'pending';
        if (rawValid === 'approved' || rawValid === true) validState = 'approved';
        if (rawValid === 'rejected' || rawValid === false) validState = 'rejected';

        const isApproved = validState === 'approved';
        const isRejected = validState === 'rejected';

        if (isRejected && !isCancelled) {
            return (
                <View key={idx} style={styles.uploadCardWrapper}>
                    <DocumentUploadCard 
                        docName={docName}
                        docKey={getStrictDocKey(docName)}
                        isUploaded={docObj.file}
                        isRejected={true}
                        onUploadSuccess={async (url: string) => {
                            const updatedDocs = [...localDocs];
                            updatedDocs[idx] = {
                                file: url,
                                valid: 'pending'
                            };
                            setLocalDocs(updatedDocs);
                            setLocalStatus('pending-docs'); 
                            
                            try {
                                const updatedBookingData = new Booking({
                                    ...booking,
                                    status: 'pending-docs', 
                                    documents: updatedDocs
                                } as unknown as Partial<IBooking>);
                                await updateBookingInStore(updatedBookingData, false);
                            } catch (e) {
                                console.error("Failed to save re-uploaded doc to DB", e);
                            }
                        }}
                    />
                </View>
            );
        }

        let iconName = isApproved ? "check-circle" : (isRejected ? "x-circle" : "clock");
        let iconColor = isApproved ? Colors.SUCCESS : (isRejected ? Colors.ERROR : Colors.WARNING);
        let statusText = isApproved ? "Approved" : (isRejected ? "Rejected" : "Pending Review");

        return (
            <View key={idx} style={styles.documentRowContainer}>
                <View style={styles.documentRow}>
                    <View style={styles.docNameRow}>
                        <CustomIcon library="Feather" name={iconName} size={18} color={iconColor} />
                        <CustomText variant="body" style={styles.documentText}>
                            {docName}
                        </CustomText>
                    </View>
                    <View style={styles.statusGroup}>
                        <CustomText variant="caption" style={[styles.documentStatusText, { color: iconColor }]}>
                            {statusText}
                        </CustomText>
                    </View>
                </View>
            </View>
        );
    };

    const footerConfig = getFooterConfig();

    if (isLoadingOffer) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader title="Booking Details" centerTitle={true} onBackPress={onBackPress} />
                <CustomLoading 
                    visible={true} 
                    message="Loading itinerary..." 
                />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Booking Details" 
                centerTitle={true} 
                onBackPress={onBackPress} 
                rightActions={
                    showMenuIcon ? (
                        <TouchableOpacity style={styles.headerOptionsBtn} onPress={() => setShowActionMenu(true)} activeOpacity={0.7}>
                            <CustomIcon library="Feather" name="more-vertical" size={24} color={Colors.TEXT_PRIMARY} />
                        </TouchableOpacity>
                    ) : undefined
                }
            />

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                bounces={false}
            >
                <View style={styles.constrainer}>
                    
                    <HeroHeader booking={enhancedBooking} />

                    <QuickInfoCard booking={enhancedBooking} />

                    <BookingStatusComponent status={displayStatus} reason={cancellationReason} />

                    {(displayStatus === 'for-reservation' || displayStatus === 'pending-docs') && (
                        <View style={[styles.paddingHorizontal, styles.spacingBottom]}>
                            <View style={styles.infoBanner}>
                                <CustomIcon library="Feather" name="info" size={20} color={Colors.PRIMARY} />
                                <CustomText variant="caption" style={styles.infoBannerText}>
                                    Verification usually takes 1–2 business days. You will receive a notification once you are cleared to proceed to payment.
                                </CustomText>
                            </View>
                        </View>
                    )}

                    {((Array.isArray(localDocs) && localDocs.length > 0) || (localDocs && !Array.isArray(localDocs) && Object.keys(localDocs).length > 0)) && (
                        <AccordionItem 
                            title="Required Documents" 
                            icon="file-text"
                            defaultOpen={displayStatus === 'for-reservation' || displayStatus === 'pending-docs' || displayStatus === 'reservation-rejected'}
                        >
                            {Array.isArray(localDocs) 
                                ? localDocs.map((doc: unknown, idx: number) => renderDocumentRow(doc, idx))
                                : Object.entries(localDocs).map(([key, val], idx) => renderDocumentRow({name: key, valid: val}, idx))
                            }
                        </AccordionItem>
                    )}

                    {(user || emergencyContact) && (
                        <AccordionItem title="Personal Information" icon="user" defaultOpen={false}>
                            {user && (
                                <View style={styles.attendeeBlock}>
                                    <CustomText variant="caption" style={styles.attendeeLabel}>Full Name</CustomText>
                                    <CustomText variant="body" style={styles.attendeeValue}>{user.firstname} {user.lastname}</CustomText>
                                    <CustomText variant="caption" style={styles.attendeeSubValue}>{user.email}</CustomText>
                                </View>
                            )}
                            {user && emergencyContact && <View style={styles.divider} />}
                            {emergencyContact && (
                                <View style={styles.attendeeBlock}>
                                    <CustomText variant="caption" style={styles.attendeeLabel}>Emergency Contact</CustomText>
                                    <CustomText variant="body" style={styles.attendeeValue}>{emergencyContact.name}</CustomText>
                                    <CustomText variant="caption" style={styles.attendeeSubValue}>{emergencyContact.contactNumber}</CustomText>
                                </View>
                            )}
                        </AccordionItem>
                    )}

                    {inclusions.length > 0 && (
                        <AccordionItem title="Inclusions" icon="archive" defaultOpen={false}>
                            {inclusions.map((item: string, idx: number) => (
                                <View key={idx} style={styles.bulletRow}>
                                    <View style={styles.tinyDot} />
                                    <CustomText variant="caption" style={styles.bulletText}>{item}</CustomText>
                                </View>
                            ))}
                        </AccordionItem>
                    )}

                    {thingsToBring.length > 0 && (
                        <AccordionItem title="Things to Bring" icon="briefcase" defaultOpen={isConfirmed}>
                            {thingsToBring.map((item: string, idx: number) => (
                                <View key={idx} style={styles.bulletRow}>
                                    <View style={styles.tinyDot} />
                                    <CustomText variant="caption" style={styles.bulletText}>{item}</CustomText>
                                </View>
                            ))}
                        </AccordionItem>
                    )}

                    {schedule.length > 0 && (
                        <AccordionItem title="Itinerary" icon="map" defaultOpen={isConfirmed}>
                            <View style={styles.timelineContainer}>
                                {schedule.map((dayData: ISchedule<Date>, dayIdx: number) => (
                                    <View key={dayIdx} style={styles.timelineDay}>
                                        <CustomText variant="label" style={styles.dayLabelText}>Day {dayData.day}</CustomText>
                                        {dayData.activities?.map((act: IActivity<Date>, actIdx: number) => (
                                            <View key={actIdx} style={styles.timelineRow}>
                                                <View style={styles.timelineDot} />
                                                <View style={styles.timelineContent}>
                                                    <CustomText variant="label" style={styles.timelineTime}>
                                                        {formatTime(act.time)} — {act.event.split(' - ')[0] || 'Activity'}
                                                    </CustomText>
                                                    {act.event.includes(' - ') && (
                                                        <CustomText variant="caption" style={styles.timelineSubEvent}>
                                                            {act.event.split(' - ')[1]}
                                                        </CustomText>
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        </AccordionItem>
                    )}

                    {reminders.length > 0 && (
                        <AccordionItem title="Important Reminders" icon="alert-circle" defaultOpen={!isCancelled}>
                            {Array.isArray(reminders) ? (
                                reminders.map((item: string, idx: number) => (
                                    <View key={idx} style={styles.bulletRow}>
                                        <View style={styles.tinyDot} />
                                        <CustomText variant="caption" style={styles.bulletText}>{item}</CustomText>
                                    </View>
                                ))
                            ) : (
                                <CustomText variant="caption" style={styles.bulletText}>{reminders}</CustomText>
                            )}
                        </AccordionItem>
                    )}

                    <View style={styles.spacing} />

                    <PaymentSummaryCard 
                        totalAmount={totalAmount} 
                        amountPaid={amountPaid} 
                        remainingBalance={remainingBalance} 
                        payments={booking?.payment || []}
                    />

                </View>
            </ScrollView>

            {footerConfig && (
                <View style={styles.floatingFooterContainer}>
                    <CustomStickyFooter 
                        primaryButton={footerConfig.primaryButton}
                        secondaryButton={footerConfig.secondaryButton}
                    />
                </View>
            )}

            <ReasonModal 
                visible={!!activeReasonModal}
                actionType={activeReasonModal}
                onClose={() => setActiveReasonModal(null)}
                onConfirm={(reason: string) => {
                    if (activeReasonModal === 'cancel') {
                        onCancelConfirm(booking, reason);
                    } else if (activeReasonModal === 'refund') {
                        onRefundConfirm(booking, reason);
                    }
                }}
            />

            <RescheduleModal 
                visible={showRescheduleModal} 
                onClose={() => setShowRescheduleModal(false)} 
                availableFutureOffers={availableFutureOffers} 
                onConfirm={(selectedOffer: any) => {
                    setShowRescheduleModal(false);
                    setTimeout(() => {
                        if (selectedOffer === 'explore') {
                            router.replace('/explore' as any);
                        } else if (onReschedule) {
                            onReschedule(booking, selectedOffer.originalData);
                        }
                    }, 300);
                }} 
            />

            <Modal transparent={true} visible={showActionMenu} animationType="fade" onRequestClose={() => setShowActionMenu(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowActionMenu(false)}>
                    <View style={styles.actionSheetWrapper}>
                        <View style={styles.actionSheet}>
                            <View style={styles.actionSheetHandle} />
                            <CustomText variant="h3" style={styles.actionSheetTitle}>Booking Options</CustomText>

                            {canReschedule && (
                                <TouchableOpacity 
                                    style={styles.actionItem} 
                                    onPress={() => { 
                                        setShowActionMenu(false); 
                                        setTimeout(() => setShowRescheduleModal(true), 300); 
                                    }}
                                >
                                    <View style={styles.actionIconBgPrimary}>
                                        <CustomIcon library="Feather" name="calendar" size={18} color={Colors.PRIMARY} />
                                    </View>
                                    <CustomText style={styles.actionItemText}>Reschedule Booking</CustomText>
                                </TouchableOpacity>
                            )}
                            
                            {canCancel && (
                                <TouchableOpacity 
                                    style={styles.actionItem} 
                                    onPress={() => { 
                                        setShowActionMenu(false); 
                                        setTimeout(() => setActiveReasonModal('cancel'), 300); 
                                    }}
                                >
                                    <View style={styles.actionIconBgError}>
                                        <CustomIcon library="Feather" name="x-circle" size={18} color={Colors.ERROR} />
                                    </View>
                                    <CustomText style={[styles.actionItemText, { color: Colors.ERROR }]}>Cancel Booking</CustomText>
                                </TouchableOpacity>
                            )}

                            {canRefund && (
                                <TouchableOpacity 
                                    style={styles.actionItem} 
                                    onPress={() => { 
                                        setShowActionMenu(false); 
                                        setTimeout(() => setActiveReasonModal('refund'), 300); 
                                    }}
                                >
                                    <View style={styles.actionIconBgError}>
                                        <CustomIcon library="Feather" name="refresh-ccw" size={18} color={Colors.ERROR} />
                                    </View>
                                    <CustomText style={[styles.actionItemText, { color: Colors.ERROR }]}>Request Refund</CustomText>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
    },
    scrollContent: { 
        paddingBottom: 100 
    },
    spacing: { 
        height: 16 
    },
    spacingBottom: { 
        marginBottom: 16 
    },
    paddingHorizontal: { 
        paddingHorizontal: 16 
    },
    headerOptionsBtn: { 
        paddingHorizontal: 8 
    },
    infoBanner: { 
        flexDirection: 'row', 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        gap: 12 
    },
    infoBannerText: { 
        flex: 1, 
        color: Colors.TEXT_SECONDARY, 
        lineHeight: 20 
    },
    bulletRow: { 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        marginBottom: 10, 
        gap: 12 
    },
    tinyDot: { 
        width: 6, 
        height: 6, 
        borderRadius: 3, 
        backgroundColor: Colors.PRIMARY, 
        marginTop: 8 
    },
    bulletText: { 
        flex: 1, 
        lineHeight: 22 
    },
    documentRowContainer: { 
        borderBottomWidth: 1, 
        borderBottomColor: Colors.GRAY_ULTRALIGHT, 
        paddingVertical: 12 
    },
    uploadCardWrapper: { 
        paddingVertical: 8, 
        borderBottomWidth: 1, 
        borderBottomColor: Colors.GRAY_ULTRALIGHT 
    },
    documentRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },
    docNameRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 10 
    },
    documentText: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: '500' 
    },
    statusGroup: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12 
    },
    documentStatusText: { 
        fontWeight: 'bold', 
        textTransform: 'uppercase', 
        fontSize: 10, 
        letterSpacing: 0.5 
    },
    attendeeBlock: { 
        marginVertical: 4 
    },
    attendeeLabel: { 
        color: Colors.TEXT_SECONDARY, 
        marginBottom: 4, 
        textTransform: 'uppercase', 
        fontSize: 11, 
        letterSpacing: 0.5 
    },
    attendeeValue: { 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY, 
        fontSize: 16 
    },
    attendeeSubValue: { 
        color: Colors.TEXT_SECONDARY, 
        marginTop: 2 
    },
    divider: { 
        height: 1, 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        marginVertical: 16 
    },
    timelineContainer: { 
        borderLeftWidth: 1, 
        borderLeftColor: Colors.GRAY_LIGHT, 
        marginLeft: 8, 
        paddingLeft: 16, 
        marginTop: 8 
    },
    timelineDay: { 
        marginBottom: 20 
    },
    dayLabelText: { 
        fontWeight: 'bold', 
        color: Colors.PRIMARY, 
        marginBottom: 12 
    },
    timelineRow: { 
        flexDirection: 'row', 
        marginBottom: 16, 
        position: 'relative' 
    },
    timelineDot: { 
        position: 'absolute', 
        left: -20.5, 
        top: 6, 
        width: 8, 
        height: 8, 
        borderRadius: 4, 
        backgroundColor: Colors.PRIMARY 
    },
    timelineContent: { 
        flex: 1 
    },
    timelineTime: { 
        fontWeight: 'bold', 
        fontSize: 13, 
        color: Colors.TEXT_PRIMARY 
    },
    timelineSubEvent: { 
        lineHeight: 20, 
        marginTop: 2 
    },
    floatingFooterContainer: { 
        paddingBottom: 20, 
        paddingHorizontal: 10, 
        backgroundColor: 'transparent' 
    },
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'flex-end', 
        alignItems: 'center' 
    },
    actionSheetWrapper: { 
        width: '100%', 
        maxWidth: 768 
    },
    actionSheet: { 
        backgroundColor: Colors.WHITE, 
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24, 
        padding: 24, 
        paddingBottom: 40 
    },
    actionSheetHandle: { 
        width: 40, 
        height: 4, 
        backgroundColor: Colors.GRAY_LIGHT, 
        borderRadius: 2, 
        alignSelf: 'center', 
        marginBottom: 16 
    },
    actionSheetTitle: { 
        marginBottom: 20 
    },
    actionItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: Colors.GRAY_ULTRALIGHT, 
        gap: 16 
    },
    actionIconBgPrimary: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        backgroundColor: Colors.STATUS_APPROVED_BG, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    actionIconBgError: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        backgroundColor: Colors.ERROR_BG, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    actionItemText: { 
        fontSize: 16, 
        fontWeight: '600' 
    }
});

export default BookingDetailsScreen;
