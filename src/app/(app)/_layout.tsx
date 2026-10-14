import LoadingScreen from "@/src/app/loading";
import { useAppSubscriptions } from "@/src/core/hook/useAppSubscriptions";
import { useAuthHook, useRouteGuard } from "@/src/core/models/User/User";
import { Stack } from "expo-router";
import React from "react";

export default function AppLayout() {
  const { isLoading } = useAuthHook();
  useAppSubscriptions();
  useRouteGuard();

  if (isLoading) return <LoadingScreen />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
