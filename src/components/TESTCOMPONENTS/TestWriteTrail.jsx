import WriteComponent from "@/src/components/CustomWriteComponents";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const TESTWRITETRAIL = ({
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

export default TESTWRITETRAIL;

const styles = StyleSheet.create({
    group: {
        borderWidth: 1,
        padding: 10,
        margin: 10,
    }
})