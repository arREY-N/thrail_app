/**
 * @file hike.tsx
 * @description Controller for the main Hike tab lobby. Manages live hike tracking sessions,
 * trail search/filtering, mandatory emergency contact verification for DIY hikes, and emergency setup modal.
 */

import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import { View } from "react-native";

import EmergencyModal, { UserSearchResult } from "@/src/components/EmergencyModal";
import { useToast } from "@/src/components/Toast/Toast";
import { EmergencyContactFlow } from "@/src/core/flows/EmergencyContactFlow";
import { HikeTempFlow } from "@/src/core/flows/HikeTempFlow";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { Booking } from "@/src/core/models/Booking/Booking";
import { IEmergencyContact, User, useAuthStore, useUserStore } from "@/src/core/models/User/User";
import NavigationScreen from "@/src/features/Navigation/screens/NavigationScreen";

/**
 * Main Hike tab controller.
 *
 * @returns The rendered Hike tab lobby and optional emergency contact modal
 */
export default function Hike() {
    const { showToast } = useToast();
    const { findUser, setEmergencyContact } = EmergencyContactFlow();

    const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
    const [startButtonBottomOffset, setStartButtonBottomOffset] = useState<number>(108);

    const {
        isFocused,
        profile,
        groups,
        upcomingBookings,
        filteredTrails,
        selectedTrail,
        hikeLoading,
        searchQuery,
        handleSearchChange,
        handleSearchSubmit,
        handleTrailSelect,
        handleStartTracking,
        handleDeveloperBypass,
        isAdmin,
    } = HikeTempFlow();

    const {
        onGroupPress,
        onBookingPress,
    } = useAppNavigation();

    const handleStartHikeWithCheck = useCallback((bookingContext?: Booking | null) => {
        if (bookingContext) {
            handleStartTracking(bookingContext);
            return;
        }

        const hasEmergencyContact = Boolean(
            profile?.emergencyContact?.contactNumber || profile?.emergencyContact?.name
        );

        if (!hasEmergencyContact) {
            setShowEmergencyModal(true);
            return;
        }

        handleStartTracking(null);
    }, [handleStartTracking, profile]);

    const handleCloseEmergencyModal = useCallback(() => {
        setShowEmergencyModal(false);
        const currentProfile = useAuthStore.getState().profile;
        const isStillMissingContact = !currentProfile?.emergencyContact?.contactNumber && !currentProfile?.emergencyContact?.name;

        if (isStillMissingContact) {
            showToast.warning("An emergency contact is required before starting an independent hike.", {
                bottomOffset: startButtonBottomOffset,
            });
        }
    }, [startButtonBottomOffset, showToast]);

    const handleSaveEmergencyContact = useCallback(async (
        contact: IEmergencyContact,
        linkedUser?: User | UserSearchResult | null
    ): Promise<boolean> => {
        let isSaved = false;

        if (linkedUser && 'id' in linkedUser && linkedUser.id) {
            const res = await setEmergencyContact(linkedUser as User);
            isSaved = res !== false;
        } else if (profile) {
            const setContact = useUserStore.getState().setEmergencyContact;
            await setContact(profile, contact);
            useAuthStore.setState({
                profile: {
                    ...profile,
                    emergencyContact: contact,
                } as User,
            });
            isSaved = true;
        }

        if (isSaved) {
            setShowEmergencyModal(false);
            handleStartTracking(null);
        }

        return isSaved;
    }, [handleStartTracking, profile, setEmergencyContact]);

    return (
        <View style={{ flex: 1 }}>
            <StatusBar style="dark" />

            {isFocused && (
                <NavigationScreen
                    upcomingBookings={upcomingBookings}
                    groups={groups}
                    currentUserId={profile?.id}

                    searchQuery={searchQuery}
                    filteredTrails={filteredTrails}
                    selectedTrail={selectedTrail}
                    isLoading={hikeLoading}

                    onSearchChange={handleSearchChange}
                    onSearchSubmit={handleSearchSubmit}
                    onTrailSelect={handleTrailSelect}

                    onGroupPress={onGroupPress}
                    onBookingPress={onBookingPress}
                    onStartTracking={handleStartHikeWithCheck}
                    onDeveloperBypass={isAdmin ? handleDeveloperBypass : undefined}
                    onStartButtonLayout={setStartButtonBottomOffset}
                />
            )}

            <EmergencyModal
                visible={showEmergencyModal}
                onClose={handleCloseEmergencyModal}
                mode="emergency_only"
                currentUserProfile={profile}
                onSearchUser={findUser}
                onSaveEmergencyContact={handleSaveEmergencyContact}
            />
        </View>
    );
}
