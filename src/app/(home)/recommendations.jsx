import { useAppNavigation } from "@/src/core/hook/useAppNavigation";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function recommendations(){
    const recommendations = useTrailsStore(s => s.recommendedTrails);
    const { onMountainPress } = useAppNavigation();

    return(
        <View>
            {
                recommendations 
                ? recommendations.map((r) => {                    
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
                : <View>
                    <Text>NO RECOMMENDATIONS AVAILABLE, YET</Text>
                </View>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    recommended: {
        marginVertical: 10,
    }
})