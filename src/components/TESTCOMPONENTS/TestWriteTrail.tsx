import WriteComponent from "@/src/components/CustomWriteComponents";
import { IFormField } from "@/src/core/interface/formFieldInterface";
import { Trail } from "@/src/core/models/Trail/Trail";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export interface ITestWriteTrailParams{
    informationSet: IFormField[],
    trail: Trail,
    system: string | null,
    isLoading: boolean,
    onSubmitTrailPress: () => void,
    onRemoveTrailPress: (id: string) => void,
    onEditProperty: (section: string, id: string, value: any) => void,
    options?: { [key: string]: any[] | string[]; },
}

const TESTWRITETRAIL = (params: ITestWriteTrailParams) => {
    const {
        informationSet,
        trail,
        system,
        isLoading,
        onSubmitTrailPress,
        onRemoveTrailPress,
        onEditProperty,
        options,
    } = params;

    console.log('in writeTrail: ', trail);
    const information = informationSet.filter((a: IFormField) => a.section === 'general');
    const geography = informationSet.filter((a: IFormField) => a.section === 'geography');
    const tourism = informationSet.filter((a: IFormField) => a.section === 'tourism');
    const difficulty = informationSet.filter((a: IFormField) => a.section === 'difficulty');
    const meta = informationSet.filter((a: IFormField) => a.section === 'root');

    return(
        <ScrollView>
            <View style={styles.group}>
                <WriteComponent
                    informationSet={meta}
                    object={trail}
                    optionSet={options}
                    onEditProperty={onEditProperty}
                />
            </View>

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
                    optionSet={options}
                    onEditProperty={() => onEditProperty}
                />    
            </View>

            <View style={styles.group}>
                <WriteComponent
                    informationSet={difficulty}
                    object={trail}
                    optionSet={options}
                    onEditProperty={() => onEditProperty}
                />
            </View>
            
            <View style={styles.group}>
                <WriteComponent
                    informationSet={tourism}
                    object={trail}
                    optionSet={options}
                    onEditProperty={() => onEditProperty}
                />    
            </View>

            
            { system && <Text>{system}</Text>}
            { isLoading && <Text>Loading</Text>}
            <Pressable onPress={onSubmitTrailPress}>
                <Text>SAVE</Text>
            </Pressable>
            <Pressable onPress={() => onRemoveTrailPress(trail.id)}>
                <Text>DELETE</Text>
            </Pressable>

            <View style={{margin: 50}}/>

        </ScrollView>
    )
}

const xTESTWRITETRAIL = ({}) => {

}

export default TESTWRITETRAIL;

const styles = StyleSheet.create({
    group: {
        padding: 10,
        margin: 10,
    }
})