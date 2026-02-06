import WriteComponent from "@/src/components/CustomWriteComponents";
import { MOUNTAIN_CONSTANTS } from '@/src/constants/mountain';
import { useMountainsStore } from "@/src/core/stores/mountainsStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function WriteMountain(){
    const router = useRouter();
    const { mountainId } = useLocalSearchParams();

    const loadMountain = useMountainsStore(s => s.loadMountain);
    const mountain = useMountainsStore(s => s.mountain);
    const isLoading = useMountainsStore(s => s.isLoading);
    const onEditProperty = useMountainsStore(s => s.editProperty);
    const writeMountain = useMountainsStore(s => s.writeMountain);
    const deleteMountain = useMountainsStore(s => s.deleteMountain);
    const error = useMountainsStore(s => s.error);

    const information = MOUNTAIN_CONSTANTS.MOUNTAIN_INFORMATION;

    useEffect(() => {
        console.log('Check: ', mountainId)
        loadMountain(mountainId ?? null)
    }, [mountainId]);

    const onSubmit = async () => {
        const success = await writeMountain();
        if(!success) return;
        router.back();
    }

    const onDelete = async () => {
        if(mountainId) await deleteMountain(mountainId);
        router.back();
    }

    // if(isLoading) return <LoadingScreen/>

    if(!mountain) return null;

    return(
        <TestWriteMountain
            mountain={mountain}
            information={information}
            onEditProperty={onEditProperty}
            onSubmit={onSubmit}
            onDelete={onDelete}   
            error={error} 
        />
    )
}

const TestWriteMountain = ({
    mountain,
    information,
    onEditProperty,
    onSubmit,
    onDelete,
    error
}) => {
    return(
        <ScrollView>
            <View>
                { error && <Text>{error}</Text>}
                <Text>GENERAL INFORMATION</Text>
                <WriteComponent
                    informationSet={information}
                    object={mountain}
                    onEditProperty={onEditProperty}
                />
            </View>

            <Pressable onPress={() => onSubmit()}>
                <Text>Submit</Text>
            </Pressable>
            <Pressable onPress={() => onDelete()}>
                <Text>Delete</Text>
            </Pressable>
        </ScrollView>
    )
}