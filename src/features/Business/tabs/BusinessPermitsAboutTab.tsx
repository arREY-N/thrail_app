/**
 * @file BusinessPermitsAboutTab.tsx
 * @description Renders Tab 2 (Permits & About) of the Business Profile screen.
 * Consolidates government accreditation permits (DTI, BIR, DENR) and organizational details
 * into a single unified ProfileScreen-style card separated by a clean sectionDivider.
 */

import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Business } from '@/src/core/models/Business/Business';
import { formatDateToStandard } from '@/src/utils/dateFormatter';

/**
 * Props for the BusinessPermitsAboutTab component.
 *
 * @param business - Tour business model data.
 */
interface Props {
    business: Business;
}

/**
 * BusinessPermitsAboutTab — Unified single-card view displaying verified legal permits and business overview.
 *
 * @param props - Component props
 * @returns React.JSX.Element rendering the permits and about tab
 */
const BusinessPermitsAboutTab = ({ business }: Props): React.JSX.Element => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const permitsList = [
        {
            key: 'denr',
            title: 'DENR Eco-Tourism Permit',
            agency: 'Department of Environment and Natural Resources',
            url: business.permits?.denr,
            icon: 'shield',
        },
        {
            key: 'dti',
            title: 'DTI Business Name Registration',
            agency: 'Department of Trade and Industry',
            url: business.permits?.dti,
            icon: 'file-text',
        },
        {
            key: 'bir',
            title: 'BIR Certificate of Registration',
            agency: 'Bureau of Internal Revenue Tax Compliance',
            url: business.permits?.bir,
            icon: 'award',
        },
    ];

    const servicedLocations = business.servicedLocation || [];

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                {/* 1. LEGAL ACCREDITATION & PERMITS SECTION */}
                <View style={styles.cardHeader}>
                    <CustomIcon
                        library="Feather"
                        name="check-circle"
                        size={18}
                        color={Colors.PRIMARY}
                    />
                    <CustomText variant="h3" style={styles.cardTitle}>
                        Government Accreditations &amp; Permits
                    </CustomText>
                </View>

                <CustomText variant="caption" style={styles.cardHint}>
                    Official permits submitted by the organizer. Tap &ldquo;View Permit&rdquo; to inspect certificates.
                </CustomText>

                <View style={styles.permitsList}>
                    {permitsList.map((permit, idx) => {
                        const hasDocument = Boolean(permit.url && typeof permit.url === 'string');
                        const isLast = idx === permitsList.length - 1;

                        return (
                            <View
                                key={permit.key}
                                style={[styles.permitRow, isLast && styles.permitRowNoBorder]}
                            >
                                <View style={styles.permitIconCircle}>
                                    <CustomIcon
                                        library="Feather"
                                        name={permit.icon}
                                        size={16}
                                        color={Colors.PRIMARY}
                                    />
                                </View>

                                <View style={styles.permitInfo}>
                                    <View style={styles.permitTitleRow}>
                                        <CustomText variant="label" style={styles.permitTitle}>
                                            {permit.title}
                                        </CustomText>

                                        {hasDocument ? (
                                            <View style={styles.verifiedChip}>
                                                <CustomIcon
                                                    library="Feather"
                                                    name="check"
                                                    size={10}
                                                    color={Colors.SUCCESS}
                                                />
                                                <CustomText
                                                    variant="caption"
                                                    style={styles.verifiedChipText}
                                                >
                                                    Verified
                                                </CustomText>
                                            </View>
                                        ) : (
                                            <View style={styles.pendingChip}>
                                                <CustomText
                                                    variant="caption"
                                                    style={styles.pendingChipText}
                                                >
                                                    Not Uploaded
                                                </CustomText>
                                            </View>
                                        )}
                                    </View>

                                    <CustomText variant="caption" style={styles.permitAgency}>
                                        {permit.agency}
                                    </CustomText>
                                </View>

                                {hasDocument && (
                                    <TouchableOpacity
                                        style={styles.viewDocButton}
                                        activeOpacity={0.7}
                                        onPress={() => setPreviewImage(permit.url as string)}
                                    >
                                        <CustomText variant="caption" style={styles.viewDocText}>
                                            View Permit
                                        </CustomText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* SECTION DIVIDER (Matching ProfileScreen Account Tab) */}
                <View style={styles.sectionDivider} />

                {/* 2. ABOUT & OPERATIONAL COVERAGE SECTION */}
                <View style={styles.cardHeaderAbout}>
                    <CustomIcon
                        library="Feather"
                        name="info"
                        size={18}
                        color={Colors.PRIMARY}
                    />
                    <CustomText variant="h3" style={styles.cardTitle}>
                        About the Organizer
                    </CustomText>
                </View>

                <View style={styles.infoRow}>
                    <CustomText style={styles.infoLabel}>
                        Registered Name
                    </CustomText>
                    <CustomText style={styles.infoValue}>
                        {business.name}
                    </CustomText>
                </View>

                <View style={styles.infoRow}>
                    <CustomText style={styles.infoLabel}>
                        Date Established
                    </CustomText>
                    <CustomText style={styles.infoValue}>
                        {formatDateToStandard(business.establishedOn)}
                    </CustomText>
                </View>

                {Boolean(business.address) && (
                    <View style={styles.infoRow}>
                        <CustomText style={styles.infoLabel}>
                            Operating Office
                        </CustomText>
                        <CustomText style={styles.infoValue}>
                            {business.address}
                        </CustomText>
                    </View>
                )}

                {Boolean(business.owner?.email) && (
                    <View style={styles.infoRow}>
                        <CustomText style={styles.infoLabel}>
                            Official Contact
                        </CustomText>
                        <CustomText style={styles.infoValue}>
                            {business.owner?.email}
                        </CustomText>
                    </View>
                )}

                {servicedLocations.length > 0 && (
                    <View style={styles.servicedBlock}>
                        <CustomText style={styles.infoLabel}>
                            Serviced Mountain Locations
                        </CustomText>
                        <View style={styles.tagCloud}>
                            {servicedLocations.map((loc, idx) => (
                                <View key={`${loc}-${idx}`} style={styles.tagPill}>
                                    <CustomIcon
                                        library="Feather"
                                        name="map-pin"
                                        size={10}
                                        color={Colors.PRIMARY}
                                    />
                                    <CustomText variant="caption" style={styles.tagPillText}>
                                        {loc}
                                    </CustomText>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            {/* Document Full-Screen Image Preview Modal */}
            <ImagePreviewModal
                visible={Boolean(previewImage)}
                images={previewImage ? [previewImage] : []}
                initialIndex={0}
                onClose={() => setPreviewImage(null)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2),
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 6,
    },
    cardHeaderAbout: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0,
    },
    cardHint: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginBottom: 14,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        marginVertical: 20,
    },
    permitsList: {
        flexDirection: 'column',
    },
    permitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        gap: 12,
    },
    permitRowNoBorder: {
        borderBottomWidth: 0,
        paddingBottom: 4,
    },
    permitIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        justifyContent: 'center',
        alignItems: 'center',
    },
    permitInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    permitTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    permitTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    verifiedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    verifiedChipText: {
        fontSize: 9,
        fontWeight: '700',
        color: Colors.SUCCESS,
    },
    pendingChip: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    pendingChipText: {
        fontSize: 9,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    permitAgency: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    viewDocButton: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderWidth: 1,
        borderColor: Colors.SUCCESS,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    viewDocText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.SUCCESS,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    infoLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.TEXT_SECONDARY,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        flex: 1,
        textAlign: 'right',
        marginLeft: 16,
    },
    servicedBlock: {
        paddingTop: 12,
        gap: 8,
    },
    tagCloud: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    tagPillText: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '500',
    },
});

export default BusinessPermitsAboutTab;
