import WriteComponent from "@/src/components/CustomWriteComponents";
import { IUseTrailWrite } from "@/src/core/hook/trail/useTrailWrite";
import { ITrailFormField } from "@/src/fields/trailFields";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const TESTWRITETRAIL = (params: IUseTrailWrite) => {
    const {
        information,
        object: trail,
        error,
        isLoading,
        options,
        onSubmitPress,
        onRemovePress,
        onUpdatePress: onUpdateTrail,
    } = params;

    
    const general = information.filter((a: ITrailFormField) => a.section === 'general');
    const geography = information.filter((a: ITrailFormField) => a.section === 'geography');
    const tourism = information.filter((a: ITrailFormField) => a.section === 'tourism');
    const difficulty = information.filter((a: ITrailFormField) => a.section === 'difficulty');

    return(
        <ScrollView>
            <View style={styles.group}>
                <WriteComponent
                    informationSet={general}
                    object={trail}
                    optionSet={options}
                    onEditProperty={onUpdateTrail}
                />
            </View>

            <View style={styles.group}>
                <WriteComponent
                    informationSet={geography}
                    object={trail}
                    optionSet={options}
                    onEditProperty={onUpdateTrail}
                />    
            </View>

            <View style={styles.group}>
                <WriteComponent
                    informationSet={difficulty}
                    object={trail}
                    optionSet={options}
                    onEditProperty={onUpdateTrail}
                />
            </View>
            
            <View style={styles.group}>
                <WriteComponent
                    informationSet={tourism}
                    object={trail}
                    optionSet={options}
                    onEditProperty={onUpdateTrail}
                />    
            </View>

            
            { error && <Text>{error}</Text>}
            { isLoading && <Text>Loading</Text>}
            <Pressable onPress={onSubmitPress}>
                <Text>SAVE</Text>
            </Pressable>
            <Pressable onPress={() => onRemovePress(trail.id)}>
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