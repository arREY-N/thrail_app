import LoadingScreen from "@/src/app/loading";
import WriteComponent from "@/src/components/CustomWriteComponents";
import useMountainWrite, { IUseMountainWrite } from "@/src/core/hook/mountain/useMountainWrite";
import getSearchParam from "@/src/core/utility/getSearchParam";

import { useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import CustomHeader from "@/src/components/CustomHeader";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";

export default function WriteMountain(){
    const { mountainId: rawId } = useLocalSearchParams();

    const mountainId = getSearchParam(rawId);

    const controller = useMountainWrite({mountainId})

    if(controller.isLoading) return <LoadingScreen/>;

    const { onBackPress } = useAppNavigation();

    return(
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Applications" 
                centerTitle={true} 
                onBackPress={onBackPress}
            />

            <TestWriteMountain {...controller}/>
        </ScreenWrapper>
    )
}

const TestWriteMountain = (params: IUseMountainWrite) => {
    const { 
        error, 
        information, 
        object: mountain, 
        options,
        onUpdatePress,
        onSubmitPress,
        onRemovePress,
    } = params;
    return(
        <ScrollView>
            <View>
                { error && <Text>{error}</Text>}
                <Text>GENERAL INFORMATION</Text>
                <WriteComponent
                    informationSet={information}
                    object={mountain}
                    onEditProperty={onUpdatePress}
                    optionSet={options}
                />
            </View>

            <Pressable onPress={onSubmitPress}>
                <Text>Submit</Text>
            </Pressable>
            <Pressable onPress={() => onRemovePress(mountain.id)}>
                <Text>Delete</Text>
            </Pressable>
        </ScrollView>
    )
}