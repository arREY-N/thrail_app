/**
 * @file BusinessTeamTab.tsx
 * @description Renders Tab 3 (Team & Guides) of the Business Profile screen.
 * Consolidates the business owner and deduplicated active tour coordinators
 * into a single unified ProfileScreen-style card separated by a clean sectionDivider.
 */

import React, { useMemo, useState } from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Admin } from '@/src/core/models/Admin/Admin';
import { IOwner } from '@/src/core/models/Application/Application';
import GuideProfileModal from '@/src/features/Business/components/GuideProfileModal';
import { getInitials } from '@/src/utils/dateFormatter';

interface SelectedMember {
    id: string;
    role: 'OWNER' | 'COORDINATOR';
    name?: string;
    username?: string;
    email?: string;
}

/**
 * Props for the BusinessTeamTab component.
 *
 * @param owner - The registered business owner profile.
 * @param admins - List of active guide / coordinator admins under this business.
 * @param businessName - Name of the tour business.
 */
interface Props {
    owner?: IOwner;
    admins?: Admin[];
    businessName?: string;
}

/**
 * BusinessTeamTab — Unified single-card view displaying business leadership and deduplicated team personnel.
 *
 * @param props - Component props
 * @returns React.JSX.Element rendering the team and guides tab
 */
const BusinessTeamTab = ({ owner, admins = [], businessName }: Props): React.JSX.Element => {
    const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(null);
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

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                {/* 1. BUSINESS OWNER / LEADERSHIP SECTION */}
                <View style={styles.cardHeader}>
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

                {/* SECTION DIVIDER (Matching ProfileScreen Account Tab) */}
                <View style={styles.sectionDivider} />

                {/* 2. TOUR COORDINATORS & GUIDES SECTION */}
                <View style={styles.cardHeader}>
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
            </View>

            {/* PUBLIC GUIDE & OWNER PROFILE MODAL */}
            <GuideProfileModal
                visible={Boolean(selectedMember)}
                onClose={() => setSelectedMember(null)}
                userId={selectedMember?.id}
                businessName={businessName}
                roleBadge={selectedMember?.role}
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
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        marginVertical: 16,
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
});

export default BusinessTeamTab;
