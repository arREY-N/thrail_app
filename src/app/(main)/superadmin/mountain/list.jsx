import { useMountainsStore } from "@/src/core/stores/mountainsStore";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function mountainList(){
    const router = useRouter();
    const mountains = useMountainsStore(s => s.mountains);
    const loadAllMountains = useMountainsStore(s => s.loadAllMountains);
    const isLoading = useMountainsStore(s => s.isLoading);

    useEffect(() => {
        loadAllMountains();
    },[]);

    const onWritePress = (id) => {
        if(id){
            router.push({
                pathname: '/mountain/write',
                params: { mountainId: id }
            })
        } else {
            router.push({
                pathname: '/mountain/write'
            })
        }
    }

    return(
        <TestMountainList
            isLoading={isLoading}
            mountains={mountains}
            onWritePress={onWritePress}
        />
    )
}

const TestMountainList = ({
    isLoading,
    mountains,
    onWritePress,
}) => {
    return(
        <ScrollView>
            <Pressable onPress={() => onWritePress()}>
                <Text>Add new</Text>
            </Pressable>

            { !isLoading
                ? mountains.length > 0
                    ?  mountains.map((m) => {
                        return(
                            <View key={m.id} style={styles.object}>
                                <Pressable onPress={() => onWritePress(m.id)}>
                                    <Text>Mountain: {m.name}</Text>
                                    <Text>Province: {m.province.join(', ')}</Text>
                                </Pressable>
                            </View>
                        )
                    })
                    : <Text>No mountains</Text>
                : <Text>Loading mountains</Text>
            }
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    object: {
        margin: 10,
        padding: 10,
        borderWidth: 1
    }
})