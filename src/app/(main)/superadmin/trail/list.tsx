import LoadingScreen from "@/src/app/loading";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useSuperadminNavigation from "@/src/core/hook/navigation/useSuperadminNavigation";
import useTrail from "@/src/core/hook/trail/useTrail";
import { Trail } from "@/src/core/models/Trail/Trail";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import CustomHeader from "@/src/components/CustomHeader";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";

export default function listTrail(){
    const { onTrailPress, onBackPress } = useAppNavigation();

    const { onWriteTrail } = useSuperadminNavigation();

    const { trails, isLoading } = useTrail();

    if(isLoading) return <LoadingScreen/>
    
    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Applications" 
                centerTitle={true} 
                onBackPress={onBackPress}
            />

            <TESTCREATETRAIL 
                onViewTrail={onTrailPress}
                trails={trails}
                isLoading={isLoading}
                onWriteTrail={onWriteTrail}
            />
        </ScreenWrapper>
    )
}

type ScreenParams = {
    onViewTrail: (id: string) => void,
    trails: Trail[],
    isLoading: boolean,
    onWriteTrail: (id?: string | null) => void,
}

const TESTCREATETRAIL = ({
    onViewTrail,
    trails,
    isLoading,
    onWriteTrail,
}: ScreenParams) => {
    return(
        <ScrollView>
            <Pressable onPress={() => onWriteTrail()}>
                <Text>ADD NEW</Text>
            </Pressable>

            { !isLoading 
                ? trails.map((t) => {
                    console.log(t);                    
                    return(
                        <ScrollView key={t.id} style={styles.trailForm}>
                            <Pressable onPress={() => onViewTrail(t.id)}>
                                <Text>Trail Name: {t.general.name}</Text>
                                <Text>Province: {t.general.province.join(', ')}</Text>
                                <Text>Length: {t.difficulty.length} km</Text>
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