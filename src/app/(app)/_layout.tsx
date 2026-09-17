import LoadingScreen from "@/src/app/loading";
import { useAuthHook, useRouteGuard } from "@/src/core/models/User/User";
import { Stack } from "expo-router";

export default function AppLayout() {
  const { isLoading } = useAuthHook();

  useRouteGuard();

  if (isLoading) return <LoadingScreen />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
