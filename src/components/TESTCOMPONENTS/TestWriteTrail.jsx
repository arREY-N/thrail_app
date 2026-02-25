import WriteComponent from "@/src/components/CustomWriteComponents";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const TESTWRITETRAIL = ({
    informationSet,
    trail,
    system,
    isLoading,
    onSubmitTrailPress,
    onRemoveTrailPress,
    onEditProperty,
    options,
}) => {
    const information = informationSet.general;
    const geography = informationSet.geography;
    const tourism = informationSet.tourism;
    const difficulty = informationSet.difficulty;

    console.log(options);
    return(
        <ScrollView>
            <View style={styles.group}>
                <WriteComponent
                    informationSet={information}
                    object={trail}
                    optionSet={options}
                    onEditProperty={onEditProperty}
                />
            </View>

            <View style={styles.group}>
                <WriteComponent
                    informationSet={geography}
                    object={trail}
                    onEditProperty={onEditProperty}
                />    
            </View>

            <View style={styles.group}>
                <WriteComponent
                    informationSet={difficulty}
                    object={trail}
                    onEditProperty={onEditProperty}
                />
            </View>
            
            <View style={styles.group}>
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
        padding: 10,
        margin: 10,
    }
})