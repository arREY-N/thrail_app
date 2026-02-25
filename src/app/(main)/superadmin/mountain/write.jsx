import LoadingScreen from "@/src/app/loading";
import WriteComponent from "@/src/components/CustomWriteComponents";
import useMountainWrite from "@/src/core/hook/useMountainWrite";

import { useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function WriteMountain(){
    const { mountainId } = useLocalSearchParams();

    const {
        mountain,
        information,
        onEditProperty,
        onSubmit,
        onDelete,
        error,
        isLoading,
    } = useMountainWrite({mountainId})

    if(!mountain || isLoading) return <LoadingScreen/>;

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