import { HikeTempFlow } from "@/src/core/flows/HikeTempFlow";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import NavigationScreen from "@/src/features/Navigation/screens/NavigationScreen";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

export default function Hike() {
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
        isAdmin
    } = HikeTempFlow();

    const {
        onGroupPress,
        onBookingPress
    } = useAppNavigation();

    return (
        <View style={{ flex: 1 }}>
            <StatusBar style="dark" />

            {/* <StatusBar style="dark" translucent backgroundColor="transparent" /> */}

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
                    onStartTracking={handleStartTracking}
                    onDeveloperBypass={isAdmin ? handleDeveloperBypass : undefined}
                />
            )}
        </View>
    );
}