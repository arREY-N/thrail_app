/**
 * @file StatusScreen.tsx
 * @description Production summary and confirmation screen displaying the outcome of a submitted hike reservation with canonical CustomText hierarchy, a 3-step next-actions timeline, and a streamlined 2-card layout (Card 1: Essential Booking Pass, Card 2: Preparation & Requirements).
 */

import React from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import { cleanPhoneNumber } from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { calculateVerificationValidity } from '@/src/core/flows/PhoneVerificationFlow';
import { ISchedule, Offer } from '@/src/core/models/Offer/Offer';
import { useAuthStore } from '@/src/core/models/User/User';
import { HikerBookingDetails } from '@/src/features/Book/screens/Booking/DetailsScreen';
import { DateInput, formatDateToStandard, formatTime, safeParseDateString } from '@/src/utils/dateFormatter';

export type BookingStatusOutcome = 'success' | 'error' | 'conflict';

export interface BookedOfferSummary {
    date?: string | Date;
    endDate?: string | Date;
    hikeDate?: string | Date;
    startTime?: string | Date;
    schedule?: ISchedule<Date | string>[];
    price?: number;
    duration?: string;
    minPax?: number;
    maxPax?: number;
    inclusions?: string[];
    thingsToBring?: string[];
    reminders?: string[];
    documents?: string[];
    trail?: { 
        name?: string; 
        location?: string; 
    };
    business?: { 
        name?: string; 
    };
}

export interface StatusScreenProps {
    /** Outcome state of the reservation submission */
    status?: BookingStatusOutcome;
    /** Error message if submission failed or encountered a conflict */
    errorMessage?: string | null;
    /** The newly created or matched booking ID */
    bookingId?: string | null;
    /** Offer information associated with the booking */
    bookedOffer?: Offer | BookedOfferSummary | null;
    /** Hiker contact and emergency details */
    hikerDetails?: HikerBookingDetails | null;
    /** Document upload records submitted during booking flow */
    uploadedDocs?: Record<string, string> | null;
    /** Callback to return to the trail view */
    onReturn: () => void;
    /** Callback to navigate to full booking details or booking list */
    onViewBooking?: (bookingId?: string) => void;
    /** Callback to retry reservation submission from Step 2 */
    onRetry?: () => void;
    /** Callback to return to Step 1 to select a different date */
    onChangeDate?: () => void;
}

const formatHikeDateRange = (startDateInput: DateInput, endDateInput?: DateInput): string => {
    if (!startDateInput) return '--';
    const start = safeParseDateString(startDateInput);
    const end = endDateInput ? safeParseDateString(endDateInput) : null;
    const startFormatted = formatDateToStandard(start);
    if (!end || start.toDateString() === end.toDateString()) {
        return startFormatted;
    }
    const endFormatted = formatDateToStandard(end);
    return `${startFormatted} – ${endFormatted}`;
};

/**
 * StatusScreen — Displays the reservation outcome using a streamlined 2-card architecture:
 * Card 1 (Essential Booking Pass with contacts & reminders) and Card 2 (Preparation & Submitted Requirements).
 *
 * @param {StatusScreenProps} props - Component props
 * @returns {React.JSX.Element} The rendered status screen component
 */
const StatusScreen: React.FC<StatusScreenProps> = ({
    status = 'success',
    errorMessage,
    bookingId,
    bookedOffer,
    hikerDetails,
    uploadedDocs,
    onReturn,
    onViewBooking,
    onRetry,
    onChangeDate,
}) => {
    const profile = useAuthStore((s) => s.profile);

    const businessName = bookedOffer?.business?.name || "Official Tour Provider";
    const trailName = bookedOffer?.trail?.name || "Scenic Mountain Trail";
    const trailLocation = bookedOffer?.trail?.location || null;

    const rawDate = (bookedOffer?.date ?? bookedOffer?.hikeDate) as unknown as DateInput;
    const rawEndDate = bookedOffer?.endDate as unknown as DateInput;
    const hikeDate = formatHikeDateRange(rawDate, rawEndDate);

    let startTime = '--';
    if (bookedOffer && 'schedule' in bookedOffer && Array.isArray(bookedOffer.schedule) && bookedOffer.schedule.length > 0) {
        const firstActivity = bookedOffer.schedule[0]?.activities?.[0];
        if (firstActivity?.time) {
            startTime = formatTime(firstActivity.time as unknown as DateInput);
        }
    }
    if (startTime === '--' && rawDate) {
        const parsed = safeParseDateString(rawDate);
        if (parsed.getHours() !== 0 || parsed.getMinutes() !== 0) {
            startTime = formatTime(rawDate);
        }
    }
    if (startTime === '--' && bookedOffer && 'startTime' in bookedOffer && bookedOffer.startTime) {
        startTime = typeof bookedOffer.startTime === 'string' 
            ? bookedOffer.startTime 
            : formatTime(bookedOffer.startTime as unknown as DateInput);
    }

    const price = bookedOffer?.price || 0;
    const duration = bookedOffer?.duration || "--";
    const minPax = bookedOffer?.minPax || 1;
    const maxPax = bookedOffer?.maxPax || 10;

    const inclusions = Array.isArray(bookedOffer?.inclusions) && bookedOffer.inclusions.length > 0 
        ? bookedOffer.inclusions.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [];

    const thingsToBring = Array.isArray(bookedOffer?.thingsToBring) && bookedOffer.thingsToBring.length > 0 
        ? bookedOffer.thingsToBring.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [];

    const rawReminders = Array.isArray(bookedOffer?.reminders) && bookedOffer.reminders.length > 0 
        ? bookedOffer.reminders 
        : [];
    const cleanedReminders = rawReminders.filter((r): r is string => typeof r === 'string' && r.trim().length > 0);

    const profileName = `${profile?.firstname || ''} ${profile?.lastname || ''}`.trim();
    const leadHikerName = profileName || "Registered Hiker";
    const rawHikerPhone = hikerDetails?.phone || profile?.phoneNumber || '';
    const leadHikerPhone = rawHikerPhone || "Not Provided";

    const rawEmergencyContact = hikerDetails?.emergencyContact || profile?.emergencyContact;
    const emergencyContactName = rawEmergencyContact?.name;
    const emergencyContactPhone = rawEmergencyContact?.contactNumber;

    const isUserPhoneMatchingProfile = cleanPhoneNumber(rawHikerPhone) === cleanPhoneNumber(profile?.phoneNumber || '');
    const hikerPhoneValidity = calculateVerificationValidity(
        isUserPhoneMatchingProfile ? profile?.phoneVerifiedAt : null
    );

    const isEmergencyPhoneMatchingProfile = cleanPhoneNumber(emergencyContactPhone || '') === cleanPhoneNumber(profile?.emergencyContact?.contactNumber || '');
    const emergencyValidity = calculateVerificationValidity(
        rawEmergencyContact?.phoneVerifiedAt || (
            isEmergencyPhoneMatchingProfile
                ? profile?.emergencyContact?.phoneVerifiedAt
                : null
        )
    );

    const uploadedDocKeys = uploadedDocs 
        ? Object.keys(uploadedDocs).filter((k) => !!uploadedDocs[k]) 
        : [];

    const hasCardTwoContent = inclusions.length > 0 || thingsToBring.length > 0 || uploadedDocKeys.length > 0;

    const isConflict = status === 'conflict';
    const isError = status === 'error';
    const isSuccess = status === 'success';

    let iconBgColor = Colors.SUCCESS;
    let iconName: 'check' | 'alert-circle' | 'alert-triangle' = 'check';
    let statusTitle = "Reservation Request Sent!";
    let statusSubtitle = "Your reservation request has been submitted to the tour provider for verification.";
    let badgeText = "PENDING APPROVAL";
    let badgeBg = Colors.STATUS_PENDING_BG;
    let badgeTextColor = Colors.STATUS_PENDING_TEXT;

    if (isError) {
        iconBgColor = Colors.ERROR;
        iconName = 'alert-circle';
        statusTitle = "Reservation Unsuccessful";
        statusSubtitle = errorMessage || "There was an issue processing your reservation request. Please review your details and try again.";
        badgeText = "SUBMISSION FAILED";
        badgeBg = Colors.ERROR_BG;
        badgeTextColor = Colors.ERROR;
    } else if (isConflict) {
        iconBgColor = Colors.STATUS_WARNING_TEXT;
        iconName = 'alert-triangle';
        statusTitle = "Active Reservation Exists";
        statusSubtitle = "You already have an active booking on this date. Thrail policy prevents duplicate reservations on overlapping dates.";
        badgeText = "DATE CONFLICT";
        badgeBg = Colors.STATUS_WARNING_BG;
        badgeTextColor = Colors.STATUS_WARNING_TEXT;
    }

    const primaryButtonConfig = isSuccess 
        ? {
            title: "View Booking Details",
            onPress: () => {
                if (onViewBooking) {
                    onViewBooking(bookingId || undefined);
                }
            },
            variant: 'primary' as const,
        }
        : isConflict
        ? {
            title: "View My Bookings",
            onPress: () => {
                if (onViewBooking) {
                    onViewBooking();
                }
            },
            variant: 'primary' as const,
        }
        : {
            title: "Try Again",
            onPress: () => {
                if (onRetry) {
                    onRetry();
                }
            },
            variant: 'primary' as const,
        };

    const secondaryButtonConfig = isConflict && onChangeDate
        ? {
            title: "Choose Another Date",
            onPress: onChangeDate,
            variant: 'outline' as const,
        }
        : {
            title: "Return to Trail",
            onPress: onReturn,
            variant: 'outline' as const,
        };

    return (
        <View style={styles.container}>
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.constrainer}>
                    {/* Outcome Header */}
                    <View style={styles.headerSection}>
                        <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
                            <CustomIcon 
                                library="Feather" 
                                name={iconName} 
                                size={32} 
                                color={Colors.WHITE} 
                            />
                        </View>
                        
                        <CustomText variant="h2" style={styles.title}>
                            {statusTitle}
                        </CustomText>
                        
                        <CustomText variant="caption" style={styles.subtitle}>
                            {statusSubtitle}
                        </CustomText>
                    </View>

                    {/* What Happens Next? Process Timeline (Only in Success State) */}
                    {isSuccess && (
                        <View style={styles.timelineCard}>
                            <View style={styles.timelineHeaderRow}>
                                <CustomIcon library="Feather" name="clock" size={15} color={Colors.PRIMARY} />
                                <CustomText variant="label" style={styles.timelineCardTitle}>
                                    What Happens Next?
                                </CustomText>
                            </View>

                            <View style={styles.timelineBody}>
                                {/* Step 1: Request Sent */}
                                <View style={styles.timelineStepRow}>
                                    <View style={styles.timelineNodeCol}>
                                        <View style={[styles.timelineNodeCircle, styles.timelineNodeDone]}>
                                            <CustomIcon library="Feather" name="check" size={11} color={Colors.STATUS_APPROVED_TEXT} />
                                        </View>
                                        <View style={styles.timelineConnectorLine} />
                                    </View>
                                    <View style={styles.timelineTextCol}>
                                        <CustomText variant="label" style={styles.timelineStepName}>
                                            Request Submitted
                                        </CustomText>
                                        <CustomText variant="caption" style={styles.timelineStepDesc}>
                                            Your reservation details and requirements are logged.
                                        </CustomText>
                                    </View>
                                </View>

                                {/* Step 2: Provider Verification */}
                                <View style={styles.timelineStepRow}>
                                    <View style={styles.timelineNodeCol}>
                                        <View style={[styles.timelineNodeCircle, styles.timelineNodeActive]}>
                                            <CustomIcon library="Feather" name="clock" size={11} color={Colors.STATUS_PENDING_TEXT} />
                                        </View>
                                        <View style={styles.timelineConnectorLine} />
                                    </View>
                                    <View style={styles.timelineTextCol}>
                                        <CustomText variant="label" style={styles.timelineStepNameActive}>
                                            Provider Verification (1–2 Days)
                                        </CustomText>
                                        <CustomText variant="caption" style={styles.timelineStepDesc}>
                                            The tour coordinator reviews your details and submitted IDs.
                                        </CustomText>
                                    </View>
                                </View>

                                {/* Step 3: Payment & Confirmation */}
                                <View style={styles.timelineStepRow}>
                                    <View style={styles.timelineNodeCol}>
                                        <View style={[styles.timelineNodeCircle, styles.timelineNodePending]}>
                                            <CustomIcon library="Feather" name="credit-card" size={10} color={Colors.TEXT_SECONDARY} />
                                        </View>
                                    </View>
                                    <View style={styles.timelineTextCol}>
                                        <CustomText variant="label" style={styles.timelineStepNamePending}>
                                            Payment & Clearance
                                        </CustomText>
                                        <CustomText variant="caption" style={styles.timelineStepDesc}>
                                            You will receive a notification to proceed to checkout once approved.
                                        </CustomText>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {isError && (
                        <View style={styles.errorBanner}>
                            <CustomIcon library="Feather" name="refresh-cw" size={16} color={Colors.ERROR} />
                            <CustomText variant="caption" style={styles.errorBannerText}>
                                Your contact info and uploaded requirements remain saved. Tap &quot;Try Again&quot; to re-submit.
                            </CustomText>
                        </View>
                    )}

                    {isConflict && (
                        <View style={styles.warningBanner}>
                            <CustomIcon library="Feather" name="alert-triangle" size={16} color={Colors.STATUS_WARNING_TEXT} />
                            <CustomText variant="caption" style={styles.warningBannerText}>
                                Check your existing reservation or choose a different schedule to continue.
                            </CustomText>
                        </View>
                    )}

                    {/* CARD 1: RESERVATION SUMMARY (Essential / Important) */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeaderRow}>
                            <CustomText variant="h2" style={styles.sectionHeaderTitle}>
                                Reservation Summary
                            </CustomText>
                        </View>

                        <View style={styles.primaryCard}>
                            {/* Destination Header with Status Badge */}
                            <View style={styles.cardHeaderRow}>
                                <View style={styles.destinationCol}>
                                    <CustomText variant="h3" style={styles.trailNameText}>
                                        {trailName}
                                    </CustomText>
                                    
                                    {trailLocation ? (
                                        <View style={styles.locationRow}>
                                            <CustomIcon library="Feather" name="map-pin" size={13} color={Colors.PRIMARY} />
                                            <CustomText variant="caption" style={styles.locationText} numberOfLines={1}>
                                                {trailLocation}
                                            </CustomText>
                                        </View>
                                    ) : null}

                                    <View style={styles.organizerRow}>
                                        <CustomIcon library="Feather" name="compass" size={13} color={Colors.TEXT_SECONDARY} />
                                        <CustomText variant="caption" style={styles.organizerText} numberOfLines={1}>
                                            {`Organized by ${businessName}`}
                                        </CustomText>
                                    </View>
                                </View>

                                <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                                    <CustomText variant="caption" style={[styles.statusBadgeText, { color: badgeTextColor }]}>
                                        {badgeText}
                                    </CustomText>
                                </View>
                            </View>

                            <View style={styles.cardDivider} />

                            {/* Schedule & Logistics Grid */}
                            <View style={styles.scheduleGrid}>
                                <View style={styles.gridRow}>
                                    <View style={styles.gridCell}>
                                        <View style={styles.cellLabelRow}>
                                            <CustomIcon library="Feather" name="calendar" size={14} color={Colors.PRIMARY} />
                                            <CustomText variant="caption" style={styles.cellLabel}>
                                                Date
                                            </CustomText>
                                        </View>
                                        <CustomText variant="label" style={styles.cellValue} numberOfLines={2}>
                                            {hikeDate}
                                        </CustomText>
                                    </View>

                                    <View style={styles.gridCell}>
                                        <View style={styles.cellLabelRow}>
                                            <CustomIcon library="Feather" name="clock" size={14} color={Colors.PRIMARY} />
                                            <CustomText variant="caption" style={styles.cellLabel}>
                                                Start Time
                                            </CustomText>
                                        </View>
                                        <CustomText variant="label" style={styles.cellValue} numberOfLines={1}>
                                            {startTime}
                                        </CustomText>
                                    </View>
                                </View>

                                <View style={styles.gridRowDivider} />

                                <View style={styles.gridRow}>
                                    <View style={styles.gridCell}>
                                        <View style={styles.cellLabelRow}>
                                            <CustomIcon library="Feather" name="activity" size={14} color={Colors.PRIMARY} />
                                            <CustomText variant="caption" style={styles.cellLabel}>
                                                Duration
                                            </CustomText>
                                        </View>
                                        <CustomText variant="label" style={styles.cellValue} numberOfLines={1}>
                                            {duration}
                                        </CustomText>
                                    </View>

                                    <View style={styles.gridCell}>
                                        <View style={styles.cellLabelRow}>
                                            <CustomIcon library="Feather" name="users" size={14} color={Colors.PRIMARY} />
                                            <CustomText variant="caption" style={styles.cellLabel}>
                                                Group Size
                                            </CustomText>
                                        </View>
                                        <CustomText variant="label" style={styles.cellValue} numberOfLines={1}>
                                            {`${minPax} - ${maxPax} Pax`}
                                        </CustomText>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.cardDivider} />

                            {/* Contact Section: Booked by & Emergency Contact */}
                            <View style={styles.contactsContainer}>
                                {/* Booked by Row */}
                                <View style={styles.contactRow}>
                                    <View style={[styles.contactAvatar, { backgroundColor: isUserPhoneMatchingProfile && hikerPhoneValidity.isValid ? Colors.STATUS_APPROVED_BG : Colors.GRAY_ULTRALIGHT }]}>
                                        <CustomIcon 
                                            library="Feather" 
                                            name="user" 
                                            size={16} 
                                            color={isUserPhoneMatchingProfile && hikerPhoneValidity.isValid ? Colors.STATUS_APPROVED_TEXT : Colors.TEXT_SECONDARY} 
                                        />
                                    </View>
                                    <View style={styles.contactInfoCol}>
                                        <CustomText variant="caption" style={styles.contactTypeLabel}>
                                            Booked by
                                        </CustomText>
                                        <CustomText variant="label" style={styles.contactName}>
                                            {leadHikerName}
                                        </CustomText>
                                        <CustomText variant="caption" style={styles.contactPhone}>
                                            {leadHikerPhone}
                                        </CustomText>
                                    </View>
                                    <View style={styles.contactBadgeContainer}>
                                        {hikerPhoneValidity.status === 'verified' && (
                                            <View style={styles.verifiedPill}>
                                                <CustomIcon library="Feather" name="check" size={10} color={Colors.STATUS_APPROVED_TEXT} />
                                                <CustomText style={styles.verifiedPillText}>
                                                    Verified
                                                </CustomText>
                                            </View>
                                        )}
                                        {hikerPhoneValidity.status === 'expired' && (
                                            <View style={styles.expiredPill}>
                                                <CustomIcon library="Feather" name="alert-triangle" size={10} color={Colors.VERIFICATION_EXPIRED_TEXT} />
                                                <CustomText style={styles.expiredPillText}>
                                                    Expired
                                                </CustomText>
                                            </View>
                                        )}
                                        {hikerPhoneValidity.status === 'unverified' && (
                                            <View style={styles.unverifiedPill}>
                                                <CustomIcon library="Feather" name="clock" size={10} color={Colors.TEXT_SECONDARY} />
                                                <CustomText style={styles.unverifiedPillText}>
                                                    Unverified
                                                </CustomText>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Vertical Connector Line */}
                                <View style={styles.verticalConnector} />

                                {/* Emergency Contact Row */}
                                <View style={styles.contactRow}>
                                    <View style={[styles.contactAvatar, { backgroundColor: emergencyValidity.isValid ? Colors.STATUS_APPROVED_BG : (emergencyContactName ? Colors.CHIP_PRIMARY_BG : Colors.GRAY_ULTRALIGHT) }]}>
                                        <CustomIcon 
                                            library="Feather" 
                                            name="phone-call" 
                                            size={16} 
                                            color={emergencyValidity.isValid ? Colors.STATUS_APPROVED_TEXT : (emergencyContactName ? Colors.PRIMARY : Colors.TEXT_SECONDARY)} 
                                        />
                                    </View>
                                    <View style={styles.contactInfoCol}>
                                        <CustomText variant="caption" style={styles.contactTypeLabel}>
                                            Emergency Contact
                                        </CustomText>
                                        <CustomText variant="label" style={styles.contactName}>
                                            {emergencyContactName || '--'}
                                        </CustomText>
                                        <CustomText variant="caption" style={styles.contactPhone}>
                                            {emergencyContactPhone || '--'}
                                        </CustomText>
                                    </View>
                                    <View style={styles.contactBadgeContainer}>
                                        {emergencyValidity.status === 'verified' ? (
                                            <View style={styles.verifiedPill}>
                                                <CustomIcon library="Feather" name="check" size={10} color={Colors.STATUS_APPROVED_TEXT} />
                                                <CustomText style={styles.verifiedPillText}>
                                                    Verified
                                                </CustomText>
                                            </View>
                                        ) : emergencyValidity.status === 'expired' ? (
                                            <View style={styles.expiredPill}>
                                                <CustomIcon library="Feather" name="alert-triangle" size={10} color={Colors.VERIFICATION_EXPIRED_TEXT} />
                                                <CustomText style={styles.expiredPillText}>
                                                    Expired
                                                </CustomText>
                                            </View>
                                        ) : emergencyContactName ? (
                                            rawEmergencyContact?.userId ? (
                                                <View style={styles.linkedBadge}>
                                                    <CustomIcon library="Feather" name="link" size={10} color={Colors.STATUS_APPROVED_TEXT} />
                                                    <CustomText style={styles.linkedText}>
                                                        Linked
                                                    </CustomText>
                                                </View>
                                            ) : (
                                                <View style={styles.unverifiedPill}>
                                                    <CustomIcon library="Feather" name="clock" size={10} color={Colors.TEXT_SECONDARY} />
                                                    <CustomText style={styles.unverifiedPillText}>
                                                        Unverified
                                                    </CustomText>
                                                </View>
                                            )
                                        ) : (
                                            <View style={styles.missingPill}>
                                                <CustomText style={styles.missingPillText}>
                                                    Not set
                                                </CustomText>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* Integrated Important Reminders Callout Box */}
                            {cleanedReminders.length > 0 && (
                                <>
                                    <View style={styles.cardDivider} />
                                    <View style={styles.integratedRemindersBox}>
                                        <View style={styles.remindersHeaderRow}>
                                            <CustomIcon library="Feather" name="info" size={14} color={Colors.PRIMARY} />
                                            <CustomText variant="label" style={styles.remindersTitleText}>
                                                Important reminders
                                            </CustomText>
                                        </View>
                                        <View style={styles.remindersBulletList}>
                                            {cleanedReminders.map((reminderItem, idx) => (
                                                <View key={idx} style={styles.reminderBulletRow}>
                                                    <View style={styles.reminderDot} />
                                                    <CustomText variant="caption" style={styles.reminderBulletText}>
                                                        {reminderItem}
                                                    </CustomText>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </>
                            )}

                            <View style={styles.cardDivider} />

                            {/* Total Package Fee */}
                            <View style={styles.pricingRow}>
                                <CustomText variant="caption" style={styles.pricingLabel}>
                                    Total Package Fee
                                </CustomText>
                                <CustomText variant="h2" color={Colors.PRIMARY} style={styles.pricingValue}>
                                    {`₱${price.toLocaleString()}`}
                                </CustomText>
                            </View>
                        </View>
                    </View>

                    {/* CARD 2: ADDITIONAL DETAILS (Supporting / Secondary) */}
                    {hasCardTwoContent && (
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeaderRow}>
                                <CustomText variant="h2" style={styles.sectionHeaderTitle}>
                                    Additional Details
                                </CustomText>
                            </View>

                            <View style={styles.primaryCard}>
                                {/* Submitted Requirements */}
                                {uploadedDocKeys.length > 0 && (
                                    <View style={styles.supportingBlock}>
                                        <View style={styles.blockTitleRow}>
                                            <CustomIcon library="Feather" name="file-text" size={14} color={Colors.PRIMARY} />
                                            <CustomText variant="label" style={styles.blockTitle}>
                                                Submitted Requirements
                                            </CustomText>
                                        </View>

                                        <View style={styles.requirementsPillWrap}>
                                            {uploadedDocKeys.map((docKey) => (
                                                <View key={docKey} style={styles.docPill}>
                                                    <CustomIcon library="Feather" name="check" size={10} color={Colors.STATUS_APPROVED_TEXT} />
                                                    <CustomText style={styles.docPillText}>
                                                        {docKey}
                                                    </CustomText>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Package Inclusions */}
                                {inclusions.length > 0 && (
                                    <>
                                        {uploadedDocKeys.length > 0 && <View style={styles.cardDivider} />}
                                        <View style={styles.supportingBlock}>
                                            <View style={styles.blockTitleRow}>
                                                <CustomIcon library="Feather" name="check-circle" size={14} color={Colors.SUCCESS} />
                                                <CustomText variant="label" style={styles.blockTitle}>
                                                    Package Inclusions
                                                </CustomText>
                                            </View>

                                            <View style={styles.checklistContainer}>
                                                {inclusions.map((item, idx) => (
                                                    <View key={idx} style={styles.checkRow}>
                                                        <CustomIcon library="Feather" name="check" size={13} color={Colors.SUCCESS} />
                                                        <CustomText variant="caption" style={styles.checkText}>
                                                            {item}
                                                        </CustomText>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    </>
                                )}

                                {/* Things to Bring */}
                                {thingsToBring.length > 0 && (
                                    <>
                                        {(uploadedDocKeys.length > 0 || inclusions.length > 0) && <View style={styles.cardDivider} />}
                                        <View style={styles.supportingBlock}>
                                            <View style={styles.blockTitleRow}>
                                                <CustomIcon library="Feather" name="package" size={14} color={Colors.PRIMARY} />
                                                <CustomText variant="label" style={styles.blockTitle}>
                                                    Things to bring ({thingsToBring.length})
                                                </CustomText>
                                            </View>

                                            <View style={styles.gearTagCloud}>
                                                {thingsToBring.map((item, idx) => (
                                                    <View key={idx} style={styles.gearChip}>
                                                        <View style={styles.gearChipDot} />
                                                        <CustomText variant="caption" style={styles.gearChipText}>
                                                            {item}
                                                        </CustomText>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Sticky Action Footer */}
            <CustomStickyFooter 
                primaryButton={primaryButtonConfig}
                secondaryButton={secondaryButtonConfig}
                layout="column"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: Colors.BACKGROUND, 
    },
    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
    },
    scrollContent: { 
        paddingBottom: 160,
    },
    headerSection: { 
        alignItems: 'center', 
        marginBottom: 16,
        width: '100%',
    },
    iconCircle: { 
        width: 64, 
        height: 64, 
        borderRadius: 32, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 12,
        ...GlobalStyles.dropShadow(2, 0.05, Colors.SHADOW, { radius: 4 }), 
    },
    title: { 
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: { 
        textAlign: 'center', 
        paddingHorizontal: 16, 
        lineHeight: 20,
        color: Colors.TEXT_SECONDARY,
    },
    timelineCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        padding: 16,
        marginBottom: 20,
        width: '100%',
        ...GlobalStyles.dropShadow(2, 0.04, Colors.SHADOW, { radius: 4 }),
    },
    timelineHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    timelineCardTitle: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        fontWeight: '700',
    },
    timelineBody: {
        gap: 0,
    },
    timelineStepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    timelineNodeCol: {
        alignItems: 'center',
        width: 24,
        marginRight: 10,
    },
    timelineNodeCircle: {
        width: 22,
        height: 22,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineNodeDone: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    timelineNodeActive: {
        backgroundColor: Colors.STATUS_PENDING_BG,
        borderWidth: 1,
        borderColor: Colors.STATUS_PENDING_BORDER,
    },
    timelineNodePending: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    timelineConnectorLine: {
        width: 2,
        height: 26,
        backgroundColor: Colors.GRAY_LIGHT,
        marginVertical: 2,
    },
    timelineTextCol: {
        flex: 1,
        paddingBottom: 10,
    },
    timelineStepName: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.STATUS_APPROVED_TEXT,
        marginBottom: 2,
    },
    timelineStepNameActive: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.STATUS_PENDING_TEXT,
        marginBottom: 2,
    },
    timelineStepNamePending: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
        marginBottom: 2,
    },
    timelineStepDesc: {
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
        fontSize: 11,
    },
    errorBanner: {
        flexDirection: 'row',
        backgroundColor: Colors.ERROR_BG,
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        width: '100%',
        alignItems: 'flex-start',
        gap: 10,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
    },
    errorBannerText: {
        flex: 1,
        color: Colors.ERROR,
        lineHeight: 18,
    },
    warningBanner: {
        flexDirection: 'row',
        backgroundColor: Colors.STATUS_WARNING_BG,
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        width: '100%',
        alignItems: 'flex-start',
        gap: 10,
        borderWidth: 1,
        borderColor: Colors.STATUS_WARNING_BORDER,
    },
    warningBannerText: {
        flex: 1,
        color: Colors.STATUS_WARNING_TEXT,
        lineHeight: 18,
    },
    sectionContainer: {
        marginBottom: 22,
        width: '100%',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionHeaderTitle: {
        marginBottom: 0,
    },
    primaryCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2, 0.05, Colors.SHADOW, { radius: 4 }),
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    destinationCol: {
        flex: 1,
    },
    trailNameText: {
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 4,
    },
    locationText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
    },
    organizerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    organizerText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    statusBadgeText: {
        fontWeight: 'bold',
        letterSpacing: 0.3,
        fontSize: 11,
    },
    cardDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        marginVertical: 14,
    },
    scheduleGrid: {
        gap: 10,
    },
    gridRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    gridRowDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    gridCell: {
        flex: 1,
        gap: 4,
    },
    cellLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cellLabel: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
        fontSize: 12,
    },
    cellValue: {
        lineHeight: 20,
    },
    contactsContainer: {
        gap: 0,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contactAvatar: {
        width: 34,
        height: 34,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfoCol: {
        marginLeft: 12,
        flex: 1,
    },
    contactTypeLabel: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 2,
        fontSize: 11,
    },
    contactName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    contactPhone: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    contactBadgeContainer: {
        marginLeft: 10,
        alignSelf: 'center',
    },
    verifiedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    verifiedPillText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.STATUS_APPROVED_TEXT,
    },
    expiredPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.VERIFICATION_EXPIRED_BG,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.VERIFICATION_EXPIRED_BORDER,
    },
    expiredPillText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.VERIFICATION_EXPIRED_TEXT,
    },
    unverifiedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    unverifiedPillText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    linkedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    linkedText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.STATUS_APPROVED_TEXT,
    },
    missingPill: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    missingPillText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    verticalConnector: {
        width: 2,
        height: 16,
        backgroundColor: Colors.GRAY_LIGHT,
        marginLeft: 16,
        marginVertical: 2,
    },
    integratedRemindersBox: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
        padding: 12,
        gap: 6,
    },
    remindersHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    remindersTitleText: {
        fontSize: 12,
        color: Colors.PRIMARY,
        fontWeight: '700',
    },
    remindersBulletList: {
        gap: 4,
        marginTop: 2,
    },
    reminderBulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    reminderDot: {
        width: 4,
        height: 4,
        borderRadius: 999,
        backgroundColor: Colors.TEXT_SECONDARY,
        marginTop: 7,
    },
    reminderBulletText: {
        color: Colors.TEXT_PRIMARY,
        flex: 1,
        lineHeight: 18,
    },
    pricingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pricingLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
        fontWeight: '600',
    },
    pricingValue: {
        fontWeight: 'bold',
    },
    supportingBlock: {
        gap: 8,
    },
    blockTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    blockTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    requirementsPillWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    docPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    docPillText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.STATUS_APPROVED_TEXT,
    },
    checklistContainer: {
        gap: 6,
    },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkText: {
        color: Colors.TEXT_PRIMARY,
        flex: 1,
        lineHeight: 18,
    },
    gearTagCloud: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    gearChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        gap: 6,
    },
    gearChipDot: {
        width: 5,
        height: 5,
        borderRadius: 999,
        backgroundColor: Colors.PRIMARY,
    },
    gearChipText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 12,
    },
});

export default StatusScreen;