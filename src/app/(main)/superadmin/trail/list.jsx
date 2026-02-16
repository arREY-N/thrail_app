import LoadingScreen from "@/src/app/loading";
import useSuperadmin from "@/src/core/hook/useSuperadmin";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function listTrail(){
    const {
        trails,
        trailLoading,
        onViewTrail,
        onWriteTrail,
    } = useSuperadmin();

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

const TESTCREATETRAIL = ({
    onViewTrail,
    trails,
    isLoading,
    onWriteTrail,
}) => {
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
                                <Text>Trail Name: {t.name}</Text>
                                <Text>Province: {t.province.join(', ')}</Text>
                                <Text>Length: {t.length} km</Text>
                                <Text>Status: {t.status == null ? '[No data]' : (t.status ? 'Active' : 'Inactive')}</Text>
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