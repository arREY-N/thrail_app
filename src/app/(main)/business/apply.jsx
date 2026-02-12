
import WriteComponent from '@/src/components/CustomWriteComponents';
import { Colors } from '@/src/constants/colors';
import useApply from '@/src/core/hook/useApply';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import LoadingScreen from '../../loading';

export default function applyBusiness(){
    const {
        application,
        information,
        onEditProperty,
        onApplyPress
    } = useApply();

    if(!application) return <LoadingScreen/>

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


        <TESTAPPLY
            information={information}
            application={application}
            onEditProperty={onEditProperty}
            onApplyPress={onApplyPress}
        />
    )
}

const TESTAPPLY = ({
    information,
    application,
    onEditProperty,
    onApplyPress,
}) => {
    const applicant = information.applicant;
    const business = information.business;
    const document = information.permits;

    return(
        <ScrollView style={styles.scrollContent}>
            <WriteComponent
                informationSet={applicant}
                object={application}
                onEditProperty={onEditProperty}
            />
            <WriteComponent
                informationSet={business}
                object={application}
                onEditProperty={onEditProperty}
            />
            <WriteComponent
                informationSet={document}
                object={application}
                onEditProperty={onEditProperty}
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