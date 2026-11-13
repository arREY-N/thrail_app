import CustomFeedbackInput from "@/src/components/CustomFeedbackInput";
import CustomHeader from "@/src/components/CustomHeader";
import CustomIcon from "@/src/components/CustomIcon";
import CustomText from "@/src/components/CustomText";
import ErrorMessage from "@/src/components/ErrorMessage";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

const testParams: BusinessReviewParams = {
    reviewId: 'test-review',
    bookingId: 'test-booking',
}

export default function Write() {
    const {
        reviewId: rawReviewId,
        bookingId: rawBookingId,
    } = testParams;

    const reviewId = getSearchParam(rawReviewId);
    const bookingId = getSearchParam(rawBookingId);

    return (
        <WriteBusinessReview
            reviewId={reviewId}
            bookingId={bookingId}
        />
    )
}

interface BusinessReviewParams {
    reviewId: string,
    bookingId: string,
}

export const WriteBusinessReview = (params: BusinessReviewParams) => {
    const { reviewId, bookingId } = params;
    const createBusinessReview = async () => { }

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [error, setError] = useState<string | null>(null);

    const canSubmit = rating > 0 && review.trim().length > 0;

    const handleSubmit = () => {
        if (!canSubmit) return;
        try {
            setError(null);
            createBusinessReview();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit review.');
        }
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                title="Write Business Review"
                centerTitle={true}
            />

            <View style={styles.mainContainer}>
                <View style={styles.formConstrainer}>
                    <View style={styles.fixedQuestionArea}>
                        <ErrorMessage error={error} />
                    </View>

                    <ScrollView
                        style={styles.optionsScrollView}
                        contentContainerStyle={styles.optionsScrollContent}
                        showsVerticalScrollIndicator={false}
                        overScrollMode="never"
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.sectionContainer}>
                            <CustomText variant="subtitle" style={styles.question}>
                                How was your experience? <CustomText style={styles.requiredMark}>*</CustomText>
                            </CustomText>
                            <View style={styles.starContainer}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity
                                        key={star}
                                        onPress={() => {
                                            setRating(star);
                                            if (error) setError(null);
                                        }}
                                        activeOpacity={0.7}
                                        style={styles.starWrapper}
                                    >
                                        <CustomIcon
                                            library="Ionicons"
                                            name={star <= rating ? "star" : "star-outline"}
                                            size={48}
                                            color={Colors.YELLOW}
                                        />
                                        <CustomText style={styles.starLabel}>{star}</CustomText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.sectionContainer}>
                            <CustomText variant="subtitle" style={styles.question}>
                                Write your review <CustomText style={styles.requiredMark}>*</CustomText>
                            </CustomText>
                            <CustomFeedbackInput
                                placeholder="Type your review here..."
                                value={review}
                                onChangeText={(val) => {
                                    setReview(val);
                                    if (error) setError(null);
                                }}
                            />
                        </View>
                    </ScrollView>
                </View>
            </View>

            <View style={styles.footerContainer}>
                <View style={styles.footerConstrainer}>
                    <View style={styles.footerPlaceholder} />
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={!canSubmit}
                        style={[
                            styles.submitButton,
                            !canSubmit && styles.submitButtonDisabled,
                        ]}
                    >
                        <CustomText style={styles.submitText}>Submit</CustomText>
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    formConstrainer: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        flex: 1,
    },
    fixedQuestionArea: {
        paddingTop: 8,
        marginBottom: -4,
    },
    optionsScrollView: {
        flex: 1,
    },
    optionsScrollContent: {
        paddingBottom: 40,
    },
    sectionContainer: {
        marginBottom: 32,
    },
    question: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        color: Colors.TEXT_PRIMARY,
        textAlign: 'left',
    },
    requiredMark: {
        color: Colors.ERROR,
        fontSize: 22,
    },
    starContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: 16,
    },
    starWrapper: {
        alignItems: 'center',
    },
    starLabel: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_SECONDARY,
    },
    debugText: {
        color: Colors.TEXT_SECONDARY,
    },
    footerContainer: {
        width: '100%',
        backgroundColor: Colors.BACKGROUND,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
    },
    footerConstrainer: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerPlaceholder: {
        width: 100,
    },
    submitButton: {
        backgroundColor: Colors.PRIMARY,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    submitButtonDisabled: {
        opacity: 0.5,
        backgroundColor: Colors.GRAY_MEDIUM,
    },
    submitText: {
        color: Colors.TEXT_INVERSE,
        fontWeight: 'bold',
        fontSize: 16,
    },
});