import { useLeaderboard } from "@/src/core/models/Leaderboard/Leaderboard";
import { Button, ScrollView, Text, View } from "react-native";

export default function ManageLeaderboard() {
    const {
        generateMonthlyLeaderboard,
        leaderboard
    } = useLeaderboard();

    return (
        <ScrollView>
            <Button onPress={() => generateMonthlyLeaderboard()} title="Generate Monthly Leaderboard" />
            {leaderboard && leaderboard.userRankings.map(u => {
                return (
                    <View key={u.userId}>
                        <Text>{u.username}</Text>
                    </View>
                )
            })
            }
        </ScrollView>
    )

}