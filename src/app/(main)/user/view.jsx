import LoadingScreen from "@/src/app/loading";
import useUserWrite from "@/src/core/hook/useUserWrite";
import { Stack, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function viewUser(){
    const { userId } = useLocalSearchParams();

    const {
        user, 
        isLoading,
        onDeleteAccountPress
    } = useUserWrite({ userId });

    if(!user || isLoading) return <LoadingScreen/>
    
    console.log(user);

    return(
        <>
            <Stack.Screen options={{headerShown: true}}/>
            <TESTUSER
                user={user}
                onDeleteAccountPress={onDeleteAccountPress}
            />
        </>
    )
}

const TESTUSER = ({
    user,
    onDeleteAccountPress,
}) => {
    return(
        <View>
            <Text>USER VIEW</Text>
            <Text>Name: {user.firstname} {user.lastname}</Text>
            <Text>Username: {user.username}</Text>
            <Text>Address: {user.address}</Text>
            <Text>Birthday: {user.birthday}</Text>
            <Text>Email: {user.email}</Text>
            <Text>Address: {user.address}</Text>
            <Text>Number: {user.phoneNumber}</Text>
            <Text>Role: {user.role}</Text>
            { user.onBoardingComplete && 
                <View>
                    <Text>Preferences</Text>
                    { user.hiked && 
                        <View>
                            <Text>Experience: {user.experience}</Text>
                            <Text>Hike Locations: {user.location?.join(', ')}</Text>
                        </View>
                    }
                    <Text>Hike Length: {user.hike_length?.join(', ')}</Text>
                    <Text>Province: {user.province?.join(', ')}</Text>
                    <Text>Experience: {user.address}</Text>
                    <Text>Experience: {user.address}</Text>
                </View>
            }
            <Pressable onPress={() => onDeleteAccountPress(user.id)}>
                <Text>Edit Account</Text>
            </Pressable>
            <Pressable onPress={() => onDeleteAccountPress(user.id)}>
                <Text>Delete Account</Text>
            </Pressable>
        </View>
    )
}