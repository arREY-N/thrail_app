
import useMountain from "@/src/core/hook/mountain/useMountain";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import CustomHeader from "@/src/components/CustomHeader";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";

export default function mountainList(){
    const {
        isLoading,
        mountains,
        onWritePress
    } = useMountain();

    const { onBackPress } = useAppNavigation();

    return(
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Applications" 
                centerTitle={true} 
                onBackPress={onBackPress}
            />

            <TestMountainList
                isLoading={isLoading}
                mountains={mountains}
                onWritePress={onWritePress}
            />
        </ScreenWrapper>
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