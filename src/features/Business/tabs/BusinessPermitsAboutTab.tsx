/**
 * @file BusinessPermitsAboutTab.tsx
 * @description Renders Tab 2 (About) of the Business Profile screen.
 * Consolidates 1) About the Organizer, 2) Teams (Business Leadership & Tour Coordinators),
 * and 3) Government Accreditations & Permits (wired to local assets in src/assets/permits/ with configurable blur).
 */

import React, { useMemo, useState } from 'react';
import {
    ImageSourcePropType,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Admin } from '@/src/core/models/Admin/Admin';
import { Business } from '@/src/core/models/Business/Business';
import GuideProfileModal from '@/src/features/Business/components/GuideProfileModal';
import { formatDateToStandard, getInitials } from '@/src/utils/dateFormatter';

/**
 * Configurable blur intensity when previewing permit images in ImagePreviewModal.
 * Set to 0 for no blur, 5–8 for moderate privacy blur, or 12+ for heavy blur.
 */
export const PERMIT_PREVIEW_BLUR_RADIUS = 6;

/**
 * Local permit image assets from src/assets/permits/ (disconnected from Firebase URLs).
 */
export const LOCAL_BUSINESS_PERMIT_ASSETS: Record<'denr' | 'dti' | 'bir', ImageSourcePropType> = {
    denr: require('@/src/assets/permits/DENR Permit.jpg'),
    dti: require('@/src/assets/permits/DTI Permits.jpg'),
    bir: require('@/src/assets/permits/BIR Permit.jpg'),
};

/**
 * Local Valid ID assets from src/assets/images/ for the Business Owner (Postal ID)
 * and Tour Coordinators / Admins (Multi-Purpose ID & National ID).
 */
export const LOCAL_PERSONNEL_VALID_IDS: {
    owner: {
        title: string;
        source: ImageSourcePropType;
    };
    admins: {
        title: string;
        source: ImageSourcePropType;
    }[];
} = {
    owner: {
        title: 'Postal ID',
        source: require('@/src/assets/images/postal-id.png'),
    },
    admins: [
        {
            title: 'Multi-Purpose ID',
            source: require('@/src/assets/images/multi-purpose-id.jpg'),
        },
        {
            title: 'National ID',
            source: require('@/src/assets/images/national-id.png'),
        },
    ],
};

interface SelectedMember {
    id: string;
    role: 'OWNER' | 'COORDINATOR';
    name?: string;
    username?: string;
    email?: string;
    validIdTitle?: string;
    validIdSource?: ImageSourcePropType;
}

/**
 * Props for the BusinessPermitsAboutTab component.
 *
 * @param business - Tour business model data.
 * @param admins - List of active guide / coordinator admins under this business.
 */
interface Props {
    business: Business;
    admins?: Admin[];
}

/**
 * BusinessPermitsAboutTab — Unified single-card view displaying About the Organizer, Teams, and Permits.
 *
 * @param props - Component props
 * @returns React.JSX.Element rendering the consolidated About tab
 */
const BusinessPermitsAboutTab = ({
    business,
    admins = [],
}: Props): React.JSX.Element => {
    const [previewImage, setPreviewImage] = useState<ImageSourcePropType | null>(null);
    const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(null);

    const owner = business.owner;

    // Find matching admin record for owner to enrich with real @username
    const ownerAdminRecord = useMemo(() => {
        if (!owner) return undefined;
        const ownerId = owner.id?.trim();
        const ownerEmail = owner.email?.trim().toLowerCase();
        return admins.find((a) => {
            if (ownerId && a.id?.trim() === ownerId) return true;
            if (ownerEmail && a.email?.trim().toLowerCase() === ownerEmail) return true;
            return false;
        });
    }, [owner, admins]);

    // Filter active admins and deduplicate the business owner
    const teamMembers = useMemo(() => {
        const ownerId = owner?.id?.trim();
        const ownerEmail = owner?.email?.trim().toLowerCase();
        return admins.filter((a) => {
            if (a.status === 'removed') return false;
            if (ownerId && a.id?.trim() === ownerId) return false;
            if (ownerEmail && a.email?.trim().toLowerCase() === ownerEmail) return false;
            return true;
        });
    }, [owner, admins]);

    const permitsList: {
        key: 'denr' | 'dti' | 'bir';
        title: string;
        agency: string;
        source: ImageSourcePropType;
        icon: string;
    }[] = [
        {
            key: 'denr',
            title: 'DENR Eco-Tourism Permit',
            agency: 'Department of Environment and Natural Resources',
            source: LOCAL_BUSINESS_PERMIT_ASSETS.denr,
            icon: 'shield',
        },
        {
            key: 'dti',
            title: 'DTI Business Name Registration',
            agency: 'Department of Trade and Industry',
            source: LOCAL_BUSINESS_PERMIT_ASSETS.dti,
            icon: 'file-text',
        },
        {
            key: 'bir',
            title: 'BIR Certificate of Registration',
            agency: 'Bureau of Internal Revenue Tax Compliance',
            source: LOCAL_BUSINESS_PERMIT_ASSETS.bir,
            icon: 'award',
        },
    ];

    const servicedLocations = business.servicedLocation || [];

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                {/* 1. ABOUT THE ORGANIZER SECTION */}
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

                {/* SECTION DIVIDER */}
                <View style={styles.sectionDivider} />

                {/* 2. TEAMS SECTION (Business Leadership + Tour Coordinators & Guides) */}
                <View style={styles.cardHeaderTeam}>
                    <CustomIcon
                        library="Feather"
                        name="user-check"
                        size={18}
                        color={Colors.PRIMARY}
                    />
                    <CustomText variant="h3" style={styles.cardTitle}>
                        Business Leadership
                    </CustomText>
                </View>

                {owner ? (
                    <TouchableOpacity
                        style={[styles.personRow, styles.personRowNoBorder]}
                        activeOpacity={0.7}
                        onPress={() => {
                            if (owner.id) {
                                setSelectedMember({
                                    id: owner.id,
                                    role: 'OWNER',
                                    name: owner.name,
                                    username: ownerAdminRecord?.username,
                                    email: owner.email,
                                    validIdTitle: LOCAL_PERSONNEL_VALID_IDS.owner.title,
                                    validIdSource: LOCAL_PERSONNEL_VALID_IDS.owner.source,
                                });
                            }
                        }}
                    >
                        <View style={styles.ownerAvatarCircle}>
                            <CustomText style={styles.avatarInitials}>
                                {getInitials(owner.name)}
                            </CustomText>
                        </View>

                        <View style={styles.personInfo}>
                            <View style={styles.nameBadgeRow}>
                                <CustomText variant="label" style={styles.personName}>
                                    {owner.name}
                                </CustomText>
                                <View style={styles.ownerBadge}>
                                    <CustomText variant="caption" style={styles.ownerBadgeText}>
                                        OWNER
                                    </CustomText>
                                </View>
                            </View>

                            {Boolean(ownerAdminRecord?.username) && (
                                <CustomText variant="caption" style={styles.usernameText}>
                                    {`@${ownerAdminRecord?.username}`}
                                </CustomText>
                            )}

                            {Boolean(owner.email) && (
                                <CustomText variant="caption" style={styles.personContact}>
                                    {owner.email}
                                </CustomText>
                            )}
                        </View>

                        <View style={styles.personChevron}>
                            <CustomIcon
                                library="Feather"
                                name="chevron-right"
                                size={18}
                                color={Colors.GRAY_MEDIUM}
                            />
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.emptyPersonnelRow}>
                        <CustomText variant="caption" style={styles.emptyText}>
                            Owner information not available.
                        </CustomText>
                    </View>
                )}

                <View style={styles.subSectionDivider} />

                <View style={styles.cardHeaderTeam}>
                    <CustomIcon
                        library="Feather"
                        name="users"
                        size={18}
                        color={Colors.PRIMARY}
                    />
                    <CustomText variant="h3" style={styles.cardTitle}>
                        Tour Coordinators &amp; Guides
                    </CustomText>
                </View>

                {teamMembers.length > 0 ? (
                    <View style={styles.personnelList}>
                        {teamMembers.map((member, idx) => {
                            const fullName = `${member.firstname || ''} ${member.lastname || ''}`.trim()
                                || member.username
                                || 'Team Coordinator';
                            const isLast = idx === teamMembers.length - 1;
                            const adminIdConfig = LOCAL_PERSONNEL_VALID_IDS.admins[
                                Math.min(idx, LOCAL_PERSONNEL_VALID_IDS.admins.length - 1)
                            ];

                            return (
                                <TouchableOpacity
                                    key={member.id || `member-${idx}`}
                                    style={[styles.personRow, isLast && styles.personRowNoBorder]}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        if (member.id) {
                                            setSelectedMember({
                                                id: member.id,
                                                role: 'COORDINATOR',
                                                name: fullName,
                                                username: member.username,
                                                email: member.email,
                                                validIdTitle: adminIdConfig.title,
                                                validIdSource: adminIdConfig.source,
                                            });
                                        }
                                    }}
                                >
                                    <View style={styles.guideAvatarCircle}>
                                        <CustomText style={styles.guideAvatarInitials}>
                                            {getInitials(member.firstname, member.lastname) || getInitials(fullName)}
                                        </CustomText>
                                    </View>

                                    <View style={styles.personInfo}>
                                        <View style={styles.nameBadgeRow}>
                                            <CustomText variant="label" style={styles.personName}>
                                                {fullName}
                                            </CustomText>
                                            <View style={styles.coordinatorBadge}>
                                                <CustomText
                                                    variant="caption"
                                                    style={styles.coordinatorBadgeText}
                                                >
                                                    COORDINATOR
                                                </CustomText>
                                            </View>
                                        </View>

                                        {Boolean(member.username) && (
                                            <CustomText variant="caption" style={styles.usernameText}>
                                                {`@${member.username}`}
                                            </CustomText>
                                        )}

                                        {Boolean(member.email) && (
                                            <CustomText variant="caption" style={styles.personContact}>
                                                {member.email}
                                            </CustomText>
                                        )}
                                    </View>

                                    <View style={styles.personChevron}>
                                        <CustomIcon
                                            library="Feather"
                                            name="chevron-right"
                                            size={18}
                                            color={Colors.GRAY_MEDIUM}
                                        />
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.emptyPersonnelRow}>
                        <CustomIcon
                            library="Feather"
                            name="user-check"
                            size={28}
                            color={Colors.GRAY_MEDIUM}
                        />
                        <CustomText variant="caption" style={styles.emptyText}>
                            The business owner directly coordinates and leads tour departures.
                        </CustomText>
                    </View>
                )}

                {/* SECTION DIVIDER */}
                <View style={styles.sectionDivider} />

                {/* 3. GOVERNMENT ACCREDITATIONS & PERMITS SECTION */}
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
                                    </View>

                                    <CustomText variant="caption" style={styles.permitAgency}>
                                        {permit.agency}
                                    </CustomText>
                                </View>

                                <TouchableOpacity
                                    style={styles.viewDocButton}
                                    activeOpacity={0.7}
                                    onPress={() => setPreviewImage(permit.source)}
                                >
                                    <CustomText variant="caption" style={styles.viewDocText}>
                                        View Permit
                                    </CustomText>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Document Full-Screen Image Preview Modal with Configurable Blur */}
            <ImagePreviewModal
                visible={Boolean(previewImage)}
                images={previewImage ? [previewImage] : []}
                initialIndex={0}
                blurRadius={PERMIT_PREVIEW_BLUR_RADIUS}
                onClose={() => setPreviewImage(null)}
            />

            {/* PUBLIC GUIDE & OWNER PROFILE MODAL */}
            <GuideProfileModal
                visible={Boolean(selectedMember)}
                onClose={() => setSelectedMember(null)}
                userId={selectedMember?.id}
                businessName={business.name}
                roleBadge={selectedMember?.role}
                validIdTitle={selectedMember?.validIdTitle}
                validIdSource={selectedMember?.validIdSource}
                initialData={selectedMember ? {
                    name: selectedMember.name,
                    username: selectedMember.username,
                    email: selectedMember.email,
                } : undefined}
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
    cardHeaderTeam: {
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
    subSectionDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 16,
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
    personnelList: {
        flexDirection: 'column',
    },
    personRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        gap: 14,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    personRowNoBorder: {
        borderBottomWidth: 0,
        paddingBottom: 4,
    },
    ownerAvatarCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    guideAvatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
    },
    guideAvatarInitials: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    avatarInitials: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.WHITE,
    },
    personInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    personChevron: {
        paddingLeft: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    personName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    ownerBadge: {
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    ownerBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: Colors.WHITE,
        letterSpacing: 0.5,
    },
    coordinatorBadge: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    coordinatorBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: Colors.PRIMARY,
        letterSpacing: 0.3,
    },
    usernameText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.PRIMARY,
        marginTop: 1,
    },
    personContact: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    emptyPersonnelRow: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    emptyText: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        fontStyle: 'italic',
        paddingHorizontal: 16,
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
});

export default BusinessPermitsAboutTab;
