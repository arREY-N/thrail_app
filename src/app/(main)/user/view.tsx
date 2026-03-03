import LoadingScreen from "@/src/app/loading";
import useUserWrite from "@/src/core/hook/user/useUserWrite";
import { User } from "@/src/core/models/User/User";
import { formatDate } from "@/src/core/utility/date";
import { Stack, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function viewUser(){
    const { userId: rawUserId } = useLocalSearchParams();

    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

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

type ScreenParams = {
    user: User,
    onDeleteAccountPress: (id: string) => void;
}

const TESTUSER = ({
    user,
    onDeleteAccountPress,
}: ScreenParams) => {
    console.log(user.preferences);
    return(
        <View>
            <Text>USER VIEW</Text>
            <Text>Name: {user.firstname} {user.lastname}</Text>
            <Text>Username: {user.username}</Text>
            <Text>Address: {user.address}</Text>
            <Text>Birthday: {formatDate(user.birthday)}</Text>
            <Text>Email: {user.email}</Text>
            <Text>Address: {user.address}</Text>
            <Text>Number: {user.phoneNumber}</Text>
            <Text>Role: {user.role}</Text>
            { user.onBoardingComplete && 
                <View>
                    <Text>Preferences</Text>
                    { user.preferences.hiked && 
                        <View>
                            <Text>Experience: {user.preferences.experience ?? 'None'}</Text>
                            <Text>Hike Locations: {user.preferences.location.join(', ')}</Text>
                        </View>
                    }
                    <Text>Hike Length: {user.preferences.hike_length?.join(', ')}</Text>
                    <Text>Province: {user.preferences.province?.join(', ')}</Text>
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