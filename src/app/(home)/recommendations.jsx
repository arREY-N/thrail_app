import { useAppNavigation } from "@/src/core/hook/useAppNavigation";
import { useRecommendationsStore } from "@/src/core/stores/recommendationsStore";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function recommendations(){
    const recommendations = useRecommendationsStore((state) => state.recommendations);
    const { onMountainPress } = useAppNavigation();

    return(
        <View>
            <Text>Recommendations page</Text>
            {
                recommendations.map((r) => {                    
                    return(
                        <Pressable 
                            onPress={() => onMountainPress(r.id)} 
                            key={r.id} 
                            style={styles.recommended}
                        >    
                            <Text>Name: {r.createdAt.toDate().toLocaleDateString()}</Text>
                            <Text>Length: {r.length}</Text>
                            <Text>Location: {r.location}</Text>
                        </Pressable>
                    )
                })
            }
        </View>
    )
}

const styles = StyleSheet.create({
    recommended: {
        marginVertical: 10,
    }
})