import React from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useReview from '@/src/core/hook/review/useReview';

import { Review } from '@/src/core/models/Review/Review';
import CommunityScreen from '@/src/features/Community/screens/CommunityScreen';

export default function community(){

    const {
        reviews,
        isLoading,
        onWriteReviewPress,
        isOwned,
        likeReview,
        isLiked,
        refreshFeed
    } = useReview();

    const {
        onGroupPress,
        onNotificationPress,
        onBookingPress
    } = useAppNavigation();

    const dummyReviews = [
        {
            id: 'dummy-1',
            userName: 'Juan Dela Cruz',
            location: 'Rodriguez, Rizal',
            date: 'Oct 24, 2025',
            mountainName: 'Mt. Tagapo',
            rating: 4.8,
            distance: 7.2,
            elevation: 438,
            duration: 4,
            review: "The trail was quite muddy due to recent rains, but the view at the summit was worth it! Highly recommended for beginners who want a quick escape from the city. Make sure to bring good hiking shoes.",
            likes: [1, 2],
            user: { id: 'other-user' } 
        },
        {
            id: 'dummy-2',
            userName: 'Maria Clara',
            location: 'Nasugbu, Batangas',
            date: 'Nov 02, 2025',
            mountainName: 'Mt. Batulao',
            rating: 4.5,
            distance: 9.0,
            elevation: 811,
            duration: 5,
            review: "Classic Batulao! The 'New Trail' is much steeper now. Make sure to bring enough water as there isn't much shade along the ridges.",
            likes: [1, 2, 3, 4, 5],
            user: { id: 'other-user' }
        }
    ];

    const combinedReviews = [...reviews, ...dummyReviews];

    const onLeaderboardPress = () => {
        console.log("Navigating to Leaderboard");
    };

    const testIsLiked = (item: Review) => {
        if (item.id === 'dummy-1') return true;
        return isLiked(item);
    };

    return (
        <CommunityScreen
            reviews={combinedReviews}
            isLoading={isLoading}
            onWriteReviewPress={onWriteReviewPress}
            isOwned={isOwned}
            likeReview={likeReview}
            isLiked={testIsLiked}
            onRefresh={refreshFeed}
            onGroupPress={onGroupPress}
            onNotificationPress={onNotificationPress}
            onBookingPress={onBookingPress}
        />

        // <TestCommunityScreen 
        //     onWriteReviewPress={onWriteReviewPress}
        //     reviews={reviews}
        //     isOwned={isOwned}
        //     likeReview={likeReview}
        //     isLiked={isLiked}
        //     refreshFeed={refreshFeed}
        //     onGroupPress={onGroupPress}
        // />
    )
}



// export type CommunityScreenParams = {
//     reviews: Review[];

//     onWriteReviewPress: (id?: string) => void;
//     isOwned: (review: Review) => Boolean;
//     likeReview: (review: Review) => void;
//     isLiked: (review: Review) => Boolean;
//     refreshFeed: () => void;
//     onGroupPress: () => void;
// }

// export const TestCommunityScreen = (params: CommunityScreenParams) => {
//     const { 
//         onWriteReviewPress, 
//         reviews,
//         isOwned,
//         likeReview,
//         isLiked,
//         refreshFeed,
//         onGroupPress

//     } = params;

//     return(
//         <ScrollView>
//             <Text>Test Community Screen</Text>
//             <Pressable onPress={onGroupPress}>
//                 <Text>Go to Group</Text>
//             </Pressable>
//             <Pressable onPress={() => refreshFeed()}>
//                 <Text>Refresh</Text>
//             </Pressable>

//             {
//                 reviews.map(r => (
//                     <View style={styles.review} key={r.id}>
//                             <Text>{r.review}</Text>
//                             <Text>{r.likes.length}</Text>
//                             <Pressable onPress={() => likeReview(r)}>
//                                 { isLiked(r) 
//                                     ? <Text>Unlike review</Text> 
//                                     : <Text>Like review</Text> 
//                                 } 
//                             </Pressable>
//                             {
//                                 isOwned(r) && 
//                                 <Pressable key={r.id} onPress={() => onWriteReviewPress(r.id)}>
//                                     <Text>Edit My Review</Text>
//                                 </Pressable>
//                             }
//                     </View>
//                 ))
//             }
//         </ScrollView>
//     )
// }

// const styles = StyleSheet.create({
//     review: {
//         borderWidth: 1,
//         borderColor: '#ccc',
//         borderRadius: 8,
//         padding: 12,
//         margin: 10
//     }
// })