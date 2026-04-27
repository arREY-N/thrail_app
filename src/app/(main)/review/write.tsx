import useReviewWrite from "@/src/core/hook/review/useReviewWrite";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { useLocalSearchParams } from "expo-router";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import WriteReviewScreen from "@/src/features/Navigation/screens/WriteReviewScreen";

export default function WriteReview() {
    const { reviewId: rawId, trailId: rawTrail } = useLocalSearchParams();

    const reviewId = getSearchParam(rawId);
    const trailId = getSearchParam(rawTrail);

    const  { onBackPress } = useAppNavigation();

    const {
        review,
        isLoading,
        error,
        onUpdatePress,
        onSaveReview,
    } = useReviewWrite({ reviewId, trailId });

    return (
        // <TestWriteReview 
        //     review={review}
        //     error={error}
        //     isLoading={isLoading}
        //     onUpdatePress={onUpdatePress}
        //     onSaveReview={onSaveReview}
        // />
        <WriteReviewScreen 
        review={review}
        error={error}
        isLoading={isLoading}
        onUpdatePress={onUpdatePress}
        onSaveReview={onSaveReview}
        onBackPress={onBackPress}
    />
    )
}

// export type TestWriteParams = {
//     review: Review;
//     error: string | null;
//     isLoading: boolean;
//     onUpdatePress: (params: TEdit<Review>) => void;
//     onSaveReview: () => void;
// }

// export const TestWriteReview = (params: TestWriteParams) => {
//     const { 
//         review, 
//         error, 
//         isLoading,
//         onUpdatePress,
//         onSaveReview,
//     } = params;

//     console.log(review);

//     return(
//         <View>
//             { error && <Text>{ error }</Text>}
//             <Text>Write Review</Text>
//             <Text>For: { review.trail.name }</Text>
//             <CustomTextInput 
//                 label={'Review'}
//                 placeholder={'Enter review'}
//                 value={review.review}
//                 onChangeText={(value: string) => onUpdatePress({
//                     section: 'root',
//                     id: 'review',
//                     value: value
//                 })}
//                 secureTextEntry={undefined}
//                 keyboardType={undefined}
//                 isPasswordVisible={undefined}
//                 onTogglePassword={undefined}
//                 style={undefined}
//                 icon={undefined}
//                 prefix={undefined}
//                 children={undefined}
//                 showTodayButton={undefined}
//                 allowFutureDates={undefined} inputStyle={undefined} multiline={undefined}            />

//             <Pressable onPress={() => onSaveReview()}>
//                 <Text>Save Review</Text>
//             </Pressable>
//         </View>
//     )
// }