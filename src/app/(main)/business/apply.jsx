
import {
    ScrollView,
    StyleSheet,
    View
} from 'react-native';

import LoadingScreen from '@/src/app/loading';
import { Colors } from '@/src/constants/colors';

import CustomTextInput from '@/src/components/CustomTextInput';
import useApplyWrite from '@/src/core/hook/apply/useApplyWrite';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { Pressable, Text } from 'react-native';

export default function applyBusiness(){
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
        // <ApplyScreen
        <TESTAPPLY
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
    system
}) => {
    return(
        <ScrollView style={styles.scrollContent}>
            <CustomTextInput 
                label={'Email'} 
                placeholder={'business@example.com'} 
                value={application.owner.email} 
                onChangeText={(text) => onEditProperty({
                    section: 'owner',
                    id: 'email',
                    value: text
                })} 
                secureTextEntry={undefined} 
                keyboardType={undefined} 
                isPasswordVisible={undefined} 
                onTogglePassword={undefined} 
                style={undefined} 
                icon={undefined} 
                prefix={undefined} 
                children={undefined}            
            />

            <CustomTextInput 
                label={'Name'} 
                placeholder={'Owner name'} 
                value={application.owner.name} 
                onChangeText={(text) => onEditProperty({
                    section: 'owner',
                    id: 'name',
                    value: text
                })} 
                secureTextEntry={undefined} 
                keyboardType={undefined} 
                isPasswordVisible={undefined} 
                onTogglePassword={undefined} 
                style={undefined} 
                icon={undefined} 
                prefix={undefined} 
                children={undefined}            
            />

            <CustomTextInput 
                label={'Address'} 
                placeholder={'Office Address'} 
                value={application.address} 
                onChangeText={(text) => onEditProperty({
                    section: 'root',
                    id: 'address',
                    value: text
                })} 
                secureTextEntry={undefined} 
                keyboardType={undefined} 
                isPasswordVisible={undefined} 
                onTogglePassword={undefined} 
                style={undefined} 
                icon={undefined} 
                prefix={undefined} 
                children={undefined}            
            />

            {system && <Text>{system}</Text>}
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