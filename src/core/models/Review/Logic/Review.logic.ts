import { Review } from "@/src/core/models/Review/utils/ReviewFactory";
import { Trail, TrailLogic } from "@/src/core/models/Trail/Trail";
import { User, UserLogic } from "@/src/core/models/User/User";


export type ReviewObject = {
    user: User;
    trail: Trail;
    review: Review;
}

export const ReviewLogic = {
    setReviewObject({ user, trail, review }: ReviewObject): Review {
        const userSummary = UserLogic.toSummary(user);
        const trailSummary = TrailLogic.toSummary(trail);
        return new Review({
            ...review,
            trail: {
                ...trailSummary,
            },
            user: {
                ...review.user,
                ...userSummary,
            }
        })
    },
}