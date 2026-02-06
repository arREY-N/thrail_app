import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function trail(){
    const router = useRouter();
    
    const trails = useTrailsStore(s => s.trails);
    const loadTrails = useTrailsStore(s => s.loadAllTrails);
    const isLoading = useTrailsStore(s => s.isLoading);

    useEffect(() => {
        loadTrails();
    }, [])

    const onUpdateTrail = (id) => {
        router.push({
            pathname: '/trail/write',
            params: { trailId: id }
        });
    }
    
    const onCreateNew = () => {
        router.push('/trail/write');
    }

    
    return (
        <TESTCREATETRAIL 
            onUpdateTrail={onUpdateTrail}
            trails={trails}
            isLoading={isLoading}
            onCreateNew={onCreateNew}
        />
    )
}

const TESTCREATETRAIL = ({
    onUpdateTrail,
    trails,
    isLoading,
    onCreateNew,
}) => {
    return(
        <ScrollView>
            <Pressable onPress={onCreateNew}>
                <Text>ADD NEW</Text>
            </Pressable>

            { !isLoading 
                ? trails.map((t) => {
                    console.log(t);
                    const general = t.general;
                    const difficulty = t.difficulty;
                    const locs = (general.province) ?? [];                    
                    return(
                        <ScrollView key={t.id} style={styles.trailForm}>
                            <Text>Trail Name: {general.name}</Text>
                            <Text>Province: {locs.join(', ')}</Text>
                            <Text>Length: {difficulty.length} km</Text>
                            <Pressable onPress={() => onUpdateTrail(t.id)}>
                                <Text>Edit Trail</Text>
                            </Pressable>
                        </ScrollView>
                    )
                })
                : <Text>Loading Trails</Text>
            }

            <View style={{margin: 50}}/>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    trailForm: {
        margin: 10,
        borderWidth: 1,
        padding: 10
    },
})