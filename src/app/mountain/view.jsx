import { useMountainsStore } from "@/src/core/stores/mountainsStore";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

export default function viewMountain(){
    const { mountainId } = useLocalSearchParams();

    const loadMountain = useMountainsStore(s => s.loadMountain);

    useEffect(() => {
        loadMountain(mountainId ?? null)    
    }, [mountainId])

    const mountain = useMountainsStore(s => s.mountain);

    return(
        <TestMountain
            mountain={mountain}
        />
    )
}

const TestMountain = ({
    mountain
}) => {
    return(
        <View>
            <Text>mountain here</Text>
        </View>
    )
}