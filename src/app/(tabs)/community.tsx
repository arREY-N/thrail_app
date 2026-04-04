import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useReview from '@/src/core/hook/review/useReview';
import { Review } from '@/src/core/models/Review/Review';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function community(){

    const {
        reviews,
        onWriteReviewPress,
        isOwned,
        likeReview,
        isLiked,
        refreshFeed,
    } = useReview();

    const {
        onGroupPress
    } = useAppNavigation();


    return (
        <TestCommunityScreen 
            onWriteReviewPress={onWriteReviewPress}
            reviews={reviews}
            isOwned={isOwned}
            likeReview={likeReview}
            isLiked={isLiked}
            refreshFeed={refreshFeed}
            onGroupPress={onGroupPress}
        />
    )
}

export type CommunityScreenParams = {
    reviews: Review[];

    onWriteReviewPress: (id?: string) => void;
    isOwned: (review: Review) => Boolean;
    likeReview: (review: Review) => void;
    isLiked: (review: Review) => Boolean;
    refreshFeed: () => void;
    onGroupPress: () => void;
}

export const TestCommunityScreen = (params: CommunityScreenParams) => {
    const { 
        onWriteReviewPress, 
        reviews,
        isOwned,
        likeReview,
        isLiked,
        refreshFeed,
        onGroupPress

    } = params;

    return(
        <ScrollView>
            <Text>Test Community Screen</Text>
            <Pressable onPress={onGroupPress}>
                <Text>Go to Group</Text>
            </Pressable>
            <Pressable onPress={() => refreshFeed()}>
                <Text>Refresh</Text>
            </Pressable>

            {
                reviews.map(r => (
                    <View style={styles.review} key={r.id}>
                            <Text>{r.review}</Text>
                            <Text>{r.likes.length}</Text>
                            <Pressable onPress={() => likeReview(r)}>
                                { isLiked(r) 
                                    ? <Text>Unlike review</Text> 
                                    : <Text>Like review</Text> 
                                } 
                            </Pressable>
                            {
                                isOwned(r) && 
                                <Pressable key={r.id} onPress={() => onWriteReviewPress(r.id)}>
                                    <Text>Edit My Review</Text>
                                </Pressable>
                            }
                    </View>
                ))
            }
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    review: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        margin: 10
    }
})