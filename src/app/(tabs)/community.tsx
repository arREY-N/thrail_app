import { router } from 'expo-router'
import React from 'react'
import { Pressable, Text, View } from 'react-native'

export default function community(){

    const onWriteReviewPress = (id?: string) => {
        if(id){
            router.push({
                pathname: '/(main)/review/write',
                params: { reviewId: id }
             })
        } else {
            router.push({
                pathname: '/(main)/review/write',
            })
        }
    }

    return (
        <TestCommunityScreen 
            onWriteReviewPress={onWriteReviewPress}/>
    )
}

export type CommunityScreenParams = {
    onWriteReviewPress: (id?: string) => void;
}

export const TestCommunityScreen = (params: CommunityScreenParams) => {
    const { onWriteReviewPress } = params;

    return(
        <View>
            <Text>Test Community Screen</Text>

            <Pressable onPress={() => onWriteReviewPress()}>
                <Text>Create New Review</Text>
            </Pressable>
        </View>
    )
}