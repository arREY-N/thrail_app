import { Review } from "@/src/core/models/Review/Review";
import { TrailLogic } from "@/src/core/models/Trail/logic/Trail.logic";
import { Trail } from "@/src/core/models/Trail/Trail";
import { UserLogic } from "@/src/core/models/User/logic/User.logic";
import { User } from "@/src/core/models/User/User";

export type ReviewObject = {
    user: User;
    trail: Trail;
    review: Review;
}

export const ReviewLogic = {
    setReviewObject({user, trail, review}: ReviewObject): Review {
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