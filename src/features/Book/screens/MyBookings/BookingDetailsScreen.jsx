import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useTrailsStore } from "@/src/core/stores/trailsStore";

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomLoading from '@/src/components/CustomLoading';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
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

const BookingDetailsScreen = ({ 
    booking, 
    getBookOffer,
    onBackPress, 
    onProceedToPayment, 
    onReschedule, 
    onViewReceipt,
    onCancelConfirm
}) => {
    const [isCanceling, setIsCanceling] = useState(false);
    const [fullOffer, setFullOffer] = useState(null);
    const [isLoadingOffer, setIsLoadingOffer] = useState(true);

    useEffect(() => {
        const fetchOfferDetails = async () => {
            if (booking?.offer?.id) {
                setIsLoadingOffer(true);
                const fetchedData = await getBookOffer(booking.offer.id);
                setFullOffer(fetchedData);
                setIsLoadingOffer(false);
            }
        };
        fetchOfferDetails();
    }, [booking?.offer?.id]);

    const totalAmount = booking?.offer?.price || 0;
    const amountPaid = booking?.payment?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const remainingBalance = totalAmount - amountPaid;
    
    const documents = booking?.documents || [];
    const user = booking?.user;
    const emergencyContact = booking?.emergencyContact;
    const cancellationReason = booking?.cancellationReason;
    
    const currentStatus = booking?.status;
    const isCancelled = ['for-cancellation', 'cancellation-rejected', 'refund', 'cancelled'].includes(currentStatus);
    const isConfirmed = ['paid', 'completed'].includes(currentStatus);

    const inclusions = fullOffer?.inclusions || [];
    const thingsToBring = fullOffer?.thingsToBring || [];
    const reminders = fullOffer?.reminders || [];
    const schedule = fullOffer?.schedule || [];

    const trails = useTrailsStore(s => s.data);
    const fullTrail = trails.find(t => t.id === booking?.trail?.id);

    const enhancedBooking = {
        ...booking,
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

        const cancelBtnStyle = {
            title: "Cancel",
            variant: "outline",
            style: { borderColor: Colors.GRAY_MEDIUM, borderRadius: 12 },
            textStyle: { color: Colors.TEXT_SECONDARY },
            onPress: () => setIsCanceling(true)
        };

        if (currentStatus === 'for-reservation' || currentStatus === 'pending-docs' || currentStatus === 'for-reschedule') {
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

        if (currentStatus === 'for-payment' || currentStatus === 'approved-docs') {
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
                    title: "Reschedule", 
                    variant: "outline", 
                    style: { borderRadius: 12 },
                    onPress: () => onReschedule(booking) 
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

    const renderDocumentRow = (docName, isDocApproved, idx) => {
        const isWaitingForAdmin = currentStatus === 'for-reservation' || currentStatus === 'pending-docs';
        
        const isApproved = !isWaitingForAdmin && isDocApproved === true;
        const isRejected = isDocApproved === false;

        let iconName = "clock";
        let iconColor = Colors.WARNING;
        let statusText = "Pending Review";

        if (isApproved) {
            iconName = "check-circle";
            iconColor = Colors.SUCCESS;
            statusText = "Approved";
        } else if (isRejected) {
            iconName = "x-circle";
            iconColor = Colors.ERROR;
            statusText = "Rejected";
        }

        return (
            <View key={idx} style={styles.documentRow}>
                <View style={styles.docNameRow}>
                    <CustomIcon library="Feather" name={iconName} size={18} color={iconColor} />
                    <CustomText variant="body" style={[styles.documentText, isRejected && {color: Colors.ERROR}]}>
                        {docName}
                    </CustomText>
                </View>
                
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <CustomText variant="caption" style={[styles.documentStatusText, { color: iconColor }]}>
                        {statusText}
                    </CustomText>
                    
                    {isRejected && (
                        <TouchableOpacity 
                            style={{ backgroundColor: Colors.ERROR, padding: 6, borderRadius: 6 }}
                            onPress={() => console.log(`Trigger re-upload for ${docName}`)}
                        >
                            <CustomIcon library="Feather" name="upload-cloud" size={14} color={Colors.WHITE} />
                        </TouchableOpacity>
                    )}
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
                title={isCanceling ? "Cancel Booking" : "Booking Details"} 
                centerTitle={true} 
                onBackPress={isCanceling ? () => setIsCanceling(false) : onBackPress} 
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

                <BookingStatus status={currentStatus} />

                {(currentStatus === 'for-reservation' || currentStatus === 'pending-docs') && (
                    <View style={[styles.paddingHorizontal, { marginBottom: 16 }]}>
                        <View style={{ flexDirection: 'row', backgroundColor: Colors.GRAY_ULTRALIGHT, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.GRAY_LIGHT, gap: 12 }}>
                            <CustomIcon library="Feather" name="info" size={20} color={Colors.PRIMARY} />
                            <CustomText variant="caption" style={{ flex: 1, color: Colors.TEXT_SECONDARY, lineHeight: 20 }}>
                                Verification usually takes 1–2 business days. You will receive a notification once you are cleared to proceed to payment.
                            </CustomText>
                        </View>
                    </View>
                )}

                {((Array.isArray(documents) && documents.length > 0) || Object.keys(documents).length > 0) && (
                    <AccordionItem 
                        title="Required Documents" 
                        icon="file-text"
                        defaultOpen={currentStatus === 'for-reservation' || currentStatus === 'pending-docs' || currentStatus === 'reservation-rejected'}
                    >
                        {Array.isArray(documents) 
                            ? documents.map((doc, idx) => renderDocumentRow(doc.name, doc.valid, idx))
                            : Object.entries(documents).map(([docName, isValid], idx) => renderDocumentRow(docName, isValid, idx))
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
    paddingHorizontal: { paddingHorizontal: 20, marginBottom: 20 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 12 },
    tinyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.PRIMARY, marginTop: 8 },
    bulletText: { flex: 1, lineHeight: 22 },
    documentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.GRAY_ULTRALIGHT },
    docNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    documentText: { color: Colors.TEXT_PRIMARY, fontWeight: '500' },
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