import React from "react";
import { SafeAreaView, Text, View } from "react-native";

export default function HomeIndex() {
  console.log("!!! THE HOME PAGE HAS LOADED !!!");
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "green" }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
          THRAIL IS LIVE
        </Text>
      </View>
    </SafeAreaView>
  );
}
