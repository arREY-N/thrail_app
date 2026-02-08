import { useRouter } from 'expo-router';
import { useState } from 'react';

import WriteComponent from '@/src/components/CustomWriteComponents';
import { APPLICATION_CONSTANTS } from '@/src/constants/application';
import { Colors } from '@/src/constants/colors';
import { OPTIONS } from '@/src/constants/constants';
import { useApplicationsStore } from '@/src/core/stores/applicationsStore';
import { useAuthStore } from '@/src/core/stores/authStore';
import BusApp from '@/src/features/Profile/screens/BusAppScreen';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function applyBusiness(){
    const router = useRouter();

    const [system, setSystem] = useState(null);
    const profile = useAuthStore(s => s.profile);

    const provinces = OPTIONS.provinces;

    const application = useApplicationsStore(s => s.application);
    const createApplication = useApplicationsStore(s => s.createApplication);
    const error = useApplicationsStore(s => s.error);

    const onEditProperty = useApplicationsStore(s => s.editProperty);

    const information = APPLICATION_CONSTANTS.APPLICATION_INFO
    const onApplyPress = async (businessData) => {
        try{           
            const appId = await createApplication({
                ...businessData,
                userId: profile.id, 
            });
            router.replace('/(tabs)');             
        } catch (err) {
            setSystem(error ? error.message : err.message );
        }
    }

    const onBackPress = () => {
        router.back();
    }

    return (
        <BusApp
            information={information}
            application={application}
            system={system}
            onEditProperty={onEditProperty}
            provinces={provinces}
            onApplyPress={onApplyPress}
            onBackPress={onBackPress}
        />
    )
}

const TESTAPPLY = ({
    information,
    application,
    onEditProperty,
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