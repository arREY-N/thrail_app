
import {
    ScrollView,
    StyleSheet,
    View
} from 'react-native';

import LoadingScreen from '@/src/app/loading';
import WriteComponent from '@/src/components/CustomWriteComponents';
import { Colors } from '@/src/constants/colors';

import useApplyWrite from '@/src/core/hook/apply/useApplyWrite';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import ApplyScreen from '@/src/features/Profile/screens/ApplyScreen';
import { Pressable, Text } from 'react-native';

export default function applyBusiness(){
    const { role } = useAuthHook();

    const { onBackPress } = useAppNavigation();
    const {
        object: application,
        options,
        information,
        error,
        onSubmitPress,
        onUpdatePress,
    } = useApplyWrite();

    if(!application) return <LoadingScreen/>

    return (
        <ApplyScreen
            information={information}
            application={application}
            options={options}
            system={error}
            onUpdatePress={onUpdatePress}
            onSubmitPress={onSubmitPress}
            onBackPress={onBackPress}
        />
    )
}

const TESTAPPLY = ({
    information,
    application,
    onEditProperty,
    onApplyPress,
    options,
    error
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
            
            {error && <Text>{error}</Text>}
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