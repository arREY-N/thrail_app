import LoadingScreen from "@/src/app/loading";
import useSuperadmin from "@/src/core/hook/superadmin/useSuperadmin";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Trail } from "@/src/core/models/Trail/Trail";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function listTrail(){
    const { role } = useAuthHook();

    const {
        trails,
        trailLoading,
        onViewTrail,
        onWriteTrail,
    } = useSuperadmin({ role });

    if(trailLoading) return <LoadingScreen/>
    
    return (
        <TESTCREATETRAIL 
            onViewTrail={onViewTrail}
            trails={trails}
            isLoading={trailLoading}
            onWriteTrail={onWriteTrail}
        />
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