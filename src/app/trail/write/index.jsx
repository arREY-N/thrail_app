import WriteComponent from "@/src/components/CustomWriteComponents";
import { TRAIL_CONSTANTS } from '@/src/constants/trails';
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function write(){
    const { trailId } = useLocalSearchParams();
    const router = useRouter();

    const information = TRAIL_CONSTANTS.TRAIL_INFORMATION;
    const system = useTrailsStore(s => s.error);
    const trail = useTrailsStore(s => s.trail);
    const isLoading = useTrailsStore(s => s.isLoading);

    const removeTrail = useTrailsStore(s => s.removeTrail);
    const writeTrail = useTrailsStore(s => s.writeTrail);
    const createTrail = useTrailsStore(s => s.createTrail);
    const onEditProperty = useTrailsStore(s => s.editProperty);
    const resetTrail = useTrailsStore(s => s.resetTrail);

    useEffect(() => {
        resetTrail();
        if(trailId) writeTrail(trailId);
    }, [trailId])

    const onSubmitPress = async () => {
        const success = await createTrail();
        if(!success) return;
        router.replace('trail/list');
    }


    const onRemovePress = async () => {
        if(trailId) await removeTrail(trailId);
        router.back();
    }
    
    return (
        <WriteTrail
            informationSet={information}
            trail={trail}
            system={system}
            isLoading={isLoading}
            onSubmitTrailPress={onSubmitPress}
            onRemoveTrailPress={onRemovePress}
            onEditProperty={onEditProperty}
        />
    )
}

const WriteTrail = ({
    informationSet,
    trail,
    system,
    isLoading,
    onSubmitTrailPress,
    onRemoveTrailPress,
    onEditProperty
}) => {
    const information = informationSet.general;
    const geography = informationSet.geography;
    const tourism = informationSet.tourism;
    const difficulty = informationSet.difficulty;

    return(
        <ScrollView>
            <View style={styles.group}>
                <Text>GENERAL INFORMATION</Text>
                <WriteComponent
                    informationSet={information}
                    object={trail}
                    optionSet={{
                        mountains: ['Mt. A', 'Mt. B', 'Mt. C']
                    }}
                    onEditProperty={onEditProperty}
                />
            </View>

            <View style={styles.group}>
                <Text>GEOGRAPHICAL INFORMATION</Text>
                <WriteComponent
                    informationSet={geography}
                    object={trail}
                    onEditProperty={onEditProperty}
                />    
            </View>

            <View style={styles.group}>
                <Text>DIFFICULTY INFORMATION</Text>
                <WriteComponent
                    informationSet={difficulty}
                    object={trail}
                    onEditProperty={onEditProperty}
                />
            </View>
            
            <View style={styles.group}>
                <Text>TOURISM INFORMATION</Text>
                <WriteComponent
                    informationSet={tourism}
                    object={trail}
                    onEditProperty={onEditProperty}
                />    
            </View>

            
            { system && <Text>{system}</Text>}
            { isLoading && <Text>Loading</Text>}
            <Pressable onPress={onSubmitTrailPress}>
                <Text>SAVE</Text>
            </Pressable>
            <Pressable onPress={onRemoveTrailPress}>
                <Text>DELETE</Text>
            </Pressable>

            <View style={{margin: 50}}/>

        </ScrollView>
    )
}

const styles = StyleSheet.create({
    group: {
        borderWidth: 1,
        padding: 10,
        margin: 10,
    }
})