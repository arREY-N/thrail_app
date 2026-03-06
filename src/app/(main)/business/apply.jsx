
import LoadingScreen from '@/src/app/loading';
import WriteComponent from '@/src/components/CustomWriteComponents';
import { Colors } from '@/src/constants/colors';
import useApplyWrite from '@/src/core/hook/apply/useApplyWrite';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import { Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function applyBusiness(){
    const { role } = useAuthHook();

    const {
        object,
        options,
        information,
        onSubmitPress,
        onUpdatePress,
    } = useApplyWrite();

    if(!object) return <LoadingScreen/>

    return (
        // <BusApp
        //     information={information}
        //     application={application}
        //     system={system}
        //     onEditProperty={onEditProperty}
        //     provinces={provinces}
        //     onApplyPress={onApplyPress}
        //     onBackPress={onBackPress}
        // />

        <>
            <Stack.Screen options={{headerShown: true}}/>
            <TESTAPPLY
                information={information}
                application={object}
                options={options}
                onEditProperty={onUpdatePress}
                onApplyPress={onSubmitPress}
            />
        </>
    )
}

const TESTAPPLY = ({
    information,
    application,
    onEditProperty,
    onApplyPress,
    options,
}) => {
    const root = information.filter(i => i.section === 'root');
    const owner = information.filter(i => i.section === 'owner');
    const permits = information.filter(i => i.section === 'permits');

    return(
        <ScrollView style={styles.scrollContent}>
            <WriteComponent
                informationSet={root}
                object={application}
                onEditProperty={onEditProperty}
                optionSet={options}
                />
            <WriteComponent
                informationSet={owner}
                object={application}
                onEditProperty={onEditProperty}
                optionSet={options}
                />
            <WriteComponent
                informationSet={permits}
                object={application}
                onEditProperty={onEditProperty}
                optionSet={options}
            />

            <Pressable onPress={() => onApplyPress()}>
                <Text>Apply</Text>
            </Pressable>

            <View style={{margin: 100}}/>
        </ScrollView>
    )
}
const styles = StyleSheet.create({
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    headerSection: {
        marginBottom: 20,
        alignItems: 'center',
    },
    pageTitle: {
        fontWeight: 'bold',
        fontSize: 20, // Clean subtitle size
        marginBottom: 6,
        color: Colors.TEXT_PRIMARY,
    },
    pageSubtitle: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        maxWidth: '85%',
    },
    successBox: {
        backgroundColor: '#E0F2FE',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    successText: {
        color: '#0369A1',
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
    },
    formCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
    },
    inputSpacing: {
        marginBottom: 16,
    },
});