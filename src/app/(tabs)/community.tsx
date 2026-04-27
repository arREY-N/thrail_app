import React from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useReview from '@/src/core/hook/review/useReview';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import { Review } from '@/src/core/models/Review/Review';
import { formatDate } from '@/src/core/utility/date';
import CommunityScreen from '@/src/features/Community/screens/CommunityScreen';


export default function community(){

    const { profile } = useAuthHook();

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
            id: 'dummy-other-1',
            user: { id: 'other-user', firstname: 'Juan', lastname: 'Dela Cruz' },
            hikeDate: new Date('2026-03-10T08:00:00Z'),
            overallRating: 4.8,
            review: "The trail was quite muddy due to recent rains, but the view at the summit was worth it!",
            likes: [{ id: 'user3' }],
            trail: { name: 'Mt. Tagapo', location: 'Binangonan, Rizal', length: 7.2, masl: 438, hours: 4 },
            isDummy: true
        },
        ...(profile ? [
            {
                id: 'dummy-my-1',
                user: profile,
                hikeDate: new Date('2026-03-05T08:00:00Z'),
                overallRating: 5.0,
                review: "Amazing clearing at the summit! The trail was well established and the view was breathtaking. Definitely coming back.",
                likes: [{ id: 'user1' }, { id: 'user2' }, { id: 'user3' }],
                trail: { name: 'Mt. Parawagan', location: 'Rodriguez, Rizal', length: 9.5, masl: 472, hours: 4 },
                isDummy: true
            },
            {
                id: 'dummy-my-2',
                user: profile,
                hikeDate: new Date('2026-02-20T06:30:00Z'),
                overallRating: 4.5,
                review: "Classic Batulao! The 'New Trail' is much steeper now. Make sure to bring enough water as there isn't much shade along the ridges.",
                likes: [{ id: 'user1' }, { id: 'user2' }],
                trail: { name: 'Mt. Batulao', location: 'Nasugbu, Batangas', length: 9, masl: 811, hours: 5 },
                isDummy: true
            }
        ] : [])
    ];

    const allRawData = [...reviews, ...dummyReviews];

    const mappedReviews = allRawData.map((r: Review | any) => {
        /** @type {any} */
        const trailData = r.trail || r.hike || {};
        
        return {
            id: r.id,
            userName: r.user?.firstname ? `${r.user.firstname} ${r.user.lastname}` : (r.user?.username || 'Hiker'),
            location: trailData.location || trailData.province?.[0] || 'Unknown Location',
            date: formatDate(r.hikeDate || r.createdAt),
            mountainName: trailData.name || 'Unknown Trail',
            trailName: trailData.name || 'Unknown Trail',
            rating: r.overallRating || 0,
            distance: trailData.length || trailData.distance || '--',
            elevation: trailData.masl || trailData.elevation || '--',
            duration: trailData.hours || trailData.duration || '--',
            review: r.review,
            likes: r.likes,
            rawReview: r, 
            isDummy: r.isDummy || false
        };
    });

    const safeIsLiked = (item: any) => {
        if (item.isDummy) return false;
        return isLiked(item.rawReview);
    };

    const safeIsOwned = (item: any) => {
        if (item.isDummy) return item.rawReview.user?.id === profile?.id;
        return isOwned(item.rawReview);
    };

    const safeLikeReview = (item: any) => {
        if (item.isDummy) return;
        likeReview(item.rawReview);
    };

    const safeOnWriteReviewPress = (item: any) => {
        if (item.isDummy) return;
        onWriteReviewPress(item.id);
    };

    const onLeaderboardPress = () => {
        // router.push('/(main)/leaderboard');
    };

    return (
        <CommunityScreen
            reviews={mappedReviews}
            isLoading={isLoading}
            onWriteReviewPress={safeOnWriteReviewPress}
            isOwned={safeIsOwned}
            likeReview={safeLikeReview}
            isLiked={safeIsLiked}
            onRefresh={refreshFeed}
            onLeaderboardPress={onLeaderboardPress} 
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