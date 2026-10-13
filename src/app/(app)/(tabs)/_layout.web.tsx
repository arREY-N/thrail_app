/**
 * @file _layout.web.tsx
 * @description Web tab layout. The WebDrawerContext and navigation drawer overlay
 * are provided by the parent (app)/_layout.web.tsx layout.
 */
import { useAppSubscriptions } from "@/src/core/hook/useAppSubscriptions";
import { Slot } from "expo-router";
import React from "react";

export default function WebTabLayout() {
  useAppSubscriptions();

  return <Slot />;
}
