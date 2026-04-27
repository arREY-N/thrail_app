import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Booking } from "@/src/core/models/Booking/Booking";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomLoading from '@/src/components/CustomLoading';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import DocumentUploadCard from '@/src/components/DocumentUploadCard';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { formatTime } from '@/src/utils/dateFormatter';

import AccordionItem from '@/src/features/Book/screens/MyBookings/components/AccordionItem.jsx';
import BookingStatus from '@/src/features/Book/screens/MyBookings/components/BookingStatus';
import CancellationReasonCard from '@/src/features/Book/screens/MyBookings/components/CancellationReasonCard';
import CancelWarningBox from '@/src/features/Book/screens/MyBookings/components/CancelWarningBox';
import HeroHeader from '@/src/features/Book/screens/MyBookings/components/HeroHeader';
import PaymentSummaryCard from '@/src/features/Book/screens/MyBookings/components/PaymentSummaryCard';
import QuickInfoCard from '@/src/features/Book/screens/MyBookings/components/QuickInfoCard';

const getStrictDocKey = (docName) => {
    if (!docName) return 'validId';
    const lower = docName.toLowerCase();
    if (lower.includes('medical') || lower.includes('cert')) return 'medicalCertificate';
    if (lower.includes('bir')) return 'bir';
    if (lower.includes('dti')) return 'dti';
    if (lower.includes('denr')) return 'denr';
    return 'validId';
};

const BookingDetailsScreen = ({ 
    booking, 
    getBookOffer,
    onBackPress, 
    onProceedToPayment, 
    onReschedule, 
    onViewReceipt,
    onCancelConfirm,
    onRefundConfirm,
    onUpdatePress 
}) => {
    const [isCanceling, setIsCanceling] = useState(false);
    const [isRefunding, setIsRefunding] = useState(false);
    const [fullOffer, setFullOffer] = useState(null);
    const [isLoadingOffer, setIsLoadingOffer] = useState(true);
    
    const [localDocs, setLocalDocs] = useState([]);
    const [localStatus, setLocalStatus] = useState(booking?.status);

    const updateBookingInStore = useBookingsStore(s => s.create);

    useEffect(() => {
        setLocalDocs(booking?.documents || []);
        setLocalStatus(booking?.status);
    }, [booking]);

    useEffect(() => {
        const fetchOfferDetails = async () => {
            if (booking?.offer && booking.offer.schedule && booking.offer.schedule.length > 0) {
                setFullOffer(booking.offer);
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

    const totalAmount = booking?.offer?.price || 0;
    const amountPaid = booking?.payment?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const remainingBalance = totalAmount - amountPaid;
    
    const user = booking?.user;
    const emergencyContact = booking?.emergencyContact;
    const cancellationReason = booking?.cancellationReason;
    
    const isCancelled = ['for-cancellation', 'cancellation-rejected', 'refund', 'cancelled'].includes(localStatus);
    const isConfirmed = ['paid', 'completed'].includes(localStatus);

    const inclusions = fullOffer?.inclusions || [];
    const thingsToBring = fullOffer?.thingsToBring || [];
    const reminders = fullOffer?.reminders || [];
    const schedule = fullOffer?.schedule || [];

    const trails = useTrailsStore(s => s.data);
    const fullTrail = trails.find(t => t.id === booking?.trail?.id);

    const enhancedBooking = {
        ...booking,
        status: localStatus, 
        offer: {
            ...booking.offer,
            duration: fullOffer?.duration || 'N/A',
            endDate: fullOffer?.endDate || booking.offer.date
        },
        trail: {
            ...booking.trail,
            location: fullTrail?.general?.address || fullTrail?.general?.province?.join(', ') || 'N/A'
        }
    };

    const getFooterConfig = () => {
        if (isCanceling) {
            return {
                secondaryButton: {
                    title: "Confirm Cancel",
                    variant: "outline",
                    style: { borderColor: Colors.ERROR, borderRadius: 12 },
                    textStyle: { color: Colors.ERROR },
                    onPress: () => onCancelConfirm(booking, "User requested cancellation")
                },
                primaryButton: {
                    title: "Keep Booking",
                    variant: "primary",
                    style: { borderRadius: 12 },
                    onPress: () => setIsCanceling(false)
                }
            };
        }

        if (isRefunding) {
            return {
                secondaryButton: {
                    title: "Confirm Refund",
                    variant: "outline",
                    style: { borderColor: Colors.ERROR, borderRadius: 12 },
                    textStyle: { color: Colors.ERROR },
                    onPress: () => {
                        setIsRefunding(false);
                        onRefundConfirm(booking, "User requested refund");
                    }
                },
                primaryButton: {
                    title: "Keep Booking",
                    variant: "primary",
                    style: { borderRadius: 12 },
                    onPress: () => setIsRefunding(false)
                }
            };
        }

        const cancelBtnStyle = {
            title: "Cancel",
            variant: "outline",
            style: { borderColor: Colors.GRAY_MEDIUM, borderRadius: 12 },
            textStyle: { color: Colors.TEXT_SECONDARY },
            onPress: () => setIsCanceling(true)
        };

        if (localStatus === 'for-reservation' || localStatus === 'pending-docs' || localStatus === 'for-reschedule') {
            return {
                secondaryButton: cancelBtnStyle,
                primaryButton: { 
                    title: "Reschedule", 
                    variant: "primary", 
                    style: { borderRadius: 12 },
                    onPress: () => onReschedule(booking) 
                }
            };
        }

        if (localStatus === 'for-payment' || localStatus === 'approved-docs') {
            return {
                secondaryButton: cancelBtnStyle,
                primaryButton: { 
                    title: "Complete Payment", 
                    variant: "primary", 
                    style: { borderRadius: 12, backgroundColor: '#006B2B' }, 
                    onPress: () => onProceedToPayment(booking) 
                }
            };
        }

        if (isConfirmed) {
            return {
                secondaryButton: { 
                    title: "Request Refund", 
                    variant: "outline", 
                    style: { borderColor: Colors.ERROR, borderRadius: 12 },
                    textStyle: { color: Colors.ERROR },
                    onPress: () => setIsRefunding(true) 
                },
                primaryButton: { 
                    title: "View Receipt", 
                    variant: "primary", 
                    style: { borderRadius: 12 },
                    onPress: () => onViewReceipt(booking) 
                }
            };
        }
        return null; 
    };

    const renderDocumentRow = (docObj, idx) => {
        const docName = docObj.name || Object.keys(docObj)[0] || 'Document';
        const rawValid = docObj.valid !== undefined ? docObj.valid : Object.values(docObj)[0];
        
        let validState = 'pending';
        if (rawValid === 'approved' || rawValid === true) validState = 'approved';
        if (rawValid === 'rejected' || rawValid === false) validState = 'rejected';

        const isApproved = validState === 'approved';
        const isRejected = validState === 'rejected';

        if (isRejected) {
            const reasonToDisplay = docObj.reason || cancellationReason;

            return (
                <View key={idx} style={styles.uploadCardWrapper}>
                    <DocumentUploadCard 
                        docName={docName}
                        docKey={getStrictDocKey(docName)}
                        isUploaded={docObj.file}
                        isRejected={true}
                        rejectionReason={reasonToDisplay}
                        onUploadSuccess={async (url) => {
                            const updatedDocs = [...localDocs];
                            updatedDocs[idx] = {
                                ...updatedDocs[idx],
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
                                });
                                await updateBookingInStore(updatedBookingData, false);
                                console.log("Successfully re-uploaded and saved to DB!");
                            } catch (e) {
                                console.error("Failed to save re-uploaded doc to DB", e);
                            }
                        }}
                    />
                </View>
            );
        }

        let iconName = isApproved ? "check-circle" : "clock";
        let iconColor = isApproved ? Colors.SUCCESS : Colors.WARNING;
        let statusText = isApproved ? "Approved" : "Pending Review";

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
                title={isCanceling ? "Cancel Booking" : isRefunding ? "Request Refund" : "Booking Details"} 
                centerTitle={true} 
                onBackPress={isCanceling ? () => setIsCanceling(false) : isRefunding ? () => setIsRefunding(false) : onBackPress} 
            />

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                bounces={false}
            >
                <HeroHeader booking={enhancedBooking} />

                <QuickInfoCard booking={enhancedBooking} />

                {isCancelled && cancellationReason && (
                    <CancellationReasonCard reason={cancellationReason} />
                )}

                <BookingStatus status={localStatus} />

                {(localStatus === 'for-reservation' || localStatus === 'pending-docs') && (
                    <View style={[styles.paddingHorizontal, styles.spacingBottom]}>
                        <View style={styles.infoBanner}>
                            <CustomIcon library="Feather" name="info" size={20} color={Colors.PRIMARY} />
                            <CustomText variant="caption" style={styles.infoBannerText}>
                                Verification usually takes 1–2 business days. You will receive a notification once you are cleared to proceed to payment.
                            </CustomText>
                        </View>
                    </View>
                )}

                {((Array.isArray(localDocs) && localDocs.length > 0) || Object.keys(localDocs).length > 0) && (
                    <AccordionItem 
                        title="Required Documents" 
                        icon="file-text"
                        defaultOpen={localStatus === 'for-reservation' || localStatus === 'pending-docs' || localStatus === 'reservation-rejected'}
                    >
                        {Array.isArray(localDocs) 
                            ? localDocs.map((doc, idx) => renderDocumentRow(doc, idx))
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
                        {inclusions.map((item, idx) => (
                            <View key={idx} style={styles.bulletRow}>
                                <View style={styles.tinyDot} />
                                <CustomText variant="caption" style={styles.bulletText}>{item}</CustomText>
                            </View>
                        ))}
                    </AccordionItem>
                )}

                {thingsToBring.length > 0 && (
                    <AccordionItem title="Things to Bring" icon="briefcase" defaultOpen={isConfirmed}>
                        {thingsToBring.map((item, idx) => (
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
                            {schedule.map((dayData, dayIdx) => (
                                <View key={dayIdx} style={styles.timelineDay}>
                                    <CustomText variant="label" style={styles.dayLabelText}>Day {dayData.day}</CustomText>
                                    {dayData.activities?.map((act, actIdx) => (
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
                            reminders.map((item, idx) => (
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
                />

                {isCanceling && (
                    <View style={styles.paddingHorizontal}>
                        <CancelWarningBox />
                    </View>
                )}

                {isRefunding && (
                    <View style={styles.paddingHorizontal}>
                        <View style={{ backgroundColor: Colors.ERROR_BG, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.ERROR, marginTop: 16 }}>
                            <CustomText variant="h3" style={{ color: Colors.ERROR, marginBottom: 8 }}>
                                Refund Policy Warning
                            </CustomText>
                            <CustomText variant="caption" style={{ color: Colors.TEXT_SECONDARY }}>
                                Please note that refunds are only fully granted if requested at least 7 days before the hike. Processing may take up to 3-5 business days. Are you sure you want to refund this booking?
                            </CustomText>
                        </View>
                    </View>
                )}
                
            </ScrollView>

            {footerConfig && (
                <View style={styles.floatingFooterContainer}>
                    <CustomStickyFooter 
                        primaryButton={footerConfig.primaryButton}
                        secondaryButton={footerConfig.secondaryButton}
                    />
                </View>
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: { paddingBottom: 100 },
    spacing: { height: 16 },
    spacingBottom: { marginBottom: 16 },
    paddingHorizontal: { paddingHorizontal: 20 },
    infoBanner: { flexDirection: 'row', backgroundColor: Colors.GRAY_ULTRALIGHT, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.GRAY_LIGHT, gap: 12 },
    infoBannerText: { flex: 1, color: Colors.TEXT_SECONDARY, lineHeight: 20 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 12 },
    tinyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.PRIMARY, marginTop: 8 },
    bulletText: { flex: 1, lineHeight: 22 },
    documentRowContainer: { borderBottomWidth: 1, borderBottomColor: Colors.GRAY_ULTRALIGHT, paddingVertical: 12 },
    uploadCardWrapper: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.GRAY_ULTRALIGHT },
    documentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    docNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    documentText: { color: Colors.TEXT_PRIMARY, fontWeight: '500' },
    statusGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    documentStatusText: { fontWeight: 'bold', textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 },
    attendeeBlock: { marginVertical: 4 },
    attendeeLabel: { color: Colors.TEXT_SECONDARY, marginBottom: 4, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 },
    attendeeValue: { fontWeight: 'bold', color: Colors.TEXT_PRIMARY, fontSize: 16 },
    attendeeSubValue: { color: Colors.TEXT_SECONDARY, marginTop: 2 },
    divider: { height: 1, backgroundColor: Colors.GRAY_ULTRALIGHT, marginVertical: 16 },
    timelineContainer: { borderLeftWidth: 1, borderLeftColor: Colors.GRAY_LIGHT, marginLeft: 8, paddingLeft: 16, marginTop: 8 },
    timelineDay: { marginBottom: 20 },
    dayLabelText: { fontWeight: 'bold', color: Colors.PRIMARY, marginBottom: 12 },
    timelineRow: { flexDirection: 'row', marginBottom: 16, position: 'relative' },
    timelineDot: { position: 'absolute', left: -20.5, top: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.PRIMARY },
    timelineContent: { flex: 1 },
    timelineTime: { fontWeight: 'bold', fontSize: 13, color: Colors.TEXT_PRIMARY },
    timelineSubEvent: { lineHeight: 20, marginTop: 2 },
    floatingFooterContainer: { paddingBottom: 20, paddingHorizontal: 10, backgroundColor: 'transparent' }
});

export default BookingDetailsScreen;