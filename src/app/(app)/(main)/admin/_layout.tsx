import UnauthorizedScreen from "@/src/app/unauthorized";
import CustomLoading from "@/src/components/CustomLoading";
import { useBusinessAdmin } from "@/src/core/models/Business/Business";
import { Stack } from "expo-router";

export const unstable_settings = {
    initialRouteName: 'index',
};

export default function AdminLayout() {
    const { businessAccount, isLoading, isFetching, role } = useBusinessAdmin();

    if ((isLoading || isFetching) && !businessAccount)
        return <CustomLoading message="Loading business account" />

    if (role !== 'admin' || !businessAccount)
        return <UnauthorizedScreen />

    return <Stack screenOptions={{ title: 'Admin Dashboard' }} />
}