import { useRecommendation } from "@/src/core/context/RecommendationProvider";
import { useAppNavigation } from "@/src/core/hook/useAppNavigation";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function recommendations(){
    const { recommendedTrails, isLoaded } = useRecommendation();
    const { onMountainPress } = useAppNavigation();

    return(
        <View>
            <Text>Recommendations page</Text>
            {
                isLoaded ?
                    recommendedTrails.map((r) => {
                        return(
                            <Pressable 
                                onPress={() => onMountainPress(r.id)} 
                                key={r.id} 
                                style={styles.recommended}
                            >    
                                <Text>Name: {r.name}</Text>
                                <Text>Length: {r.length}</Text>
                                <Text>Location: {r.location}</Text>
                            </Pressable>
                        )
                    })
                    : 
                    (<Text>Recommendations not yet loaded</Text>)
            }
        </View>
    )
}

const styles = StyleSheet.create({
    recommended: {
        marginVertical: 10,
    }
})