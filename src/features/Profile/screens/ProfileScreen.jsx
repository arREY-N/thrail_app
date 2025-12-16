import { View, Text, Pressable } from 'react-native'
import React from 'react'

const ProfileScreen = ({onSignOut}) => {
    return (
        <View>
            <Text>profile</Text>
            <Pressable onPress={onSignOut}>
                <Text>Sign out</Text>
            </Pressable>
        </View>
    )
}

export default ProfileScreen