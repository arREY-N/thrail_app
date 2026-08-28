/**
 * @file index.tsx
 * @description Controller for the Home Tab. Connects domain hooks and navigation to the pure HomeScreen UI.
 */

import { View } from "react-native";

import HomePage from "@/src/features/Web/Home/HomePage";

/**
 * Controller for the Home Tab.
 * Connects domain hooks and navigation to the pure HomeScreen UI.
 *
 * @returns React.JSX.Element rendering the Home tab controller.
 */
export default function home() {
  return (
    <View style={{ flex: 1, width: "100%", height: "100%" }}>
      <HomePage />
    </View>
  );
}
