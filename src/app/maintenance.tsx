import useMaintenance from "@/src/core/hook/useMaintenance";
import { Text, View } from "react-native";

export const MaintenanceScreen = () => {
    const { url, handlePress } = useMaintenance();

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ textAlign: 'center', fontSize: 42, fontWeight: 'bold' }}>Maintenance!</Text>
            <Text style={{ textAlign: 'center', fontSize: 18 }}>Sorry but the site is currently under maintenance. We'll be back soon!</Text>
            <Text></Text>
            <Text
                style={{ marginTop: 20, color: 'blue', textDecorationLine: 'underline' }} 
                onPress={() => handlePress('https://expo.dev/accounts/thrail/projects/thrail_app/builds/d73b6843-8ed1-4e79-b228-017b7d9aad8c')}
            >
                Download our mobile app to stay updated!
            </Text>

            <Text
                style={{ marginTop: 100, color: 'blue', textDecorationLine: 'underline' }} 
                onPress={() => handlePress(url)}
            >
                Thrail 2026
            </Text>
        </View> 
    )
}