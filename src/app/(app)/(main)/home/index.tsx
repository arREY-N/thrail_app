import React from "react";
import { SafeAreaView, Text, View } from "react-native";

// export default function HomeIndex() {
//   // We get these from your existing navigation hook
//   const { onMountainPress, onDownloadPress } = useAppNavigation();

//   // These are empty for now so the app doesn't crash on missing data
//   const recommendedTrails = [];
//   const discoverTrails = [];

//   return (
//     <HomeScreen
//       onMountainPress={onMountainPress}
//       onDownloadPress={onDownloadPress}
//       recommendedTrails={recommendedTrails}
//       discoverTrails={discoverTrails}
//     />
//   );
// }

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
