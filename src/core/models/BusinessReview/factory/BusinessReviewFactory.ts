import { BusinessReview, BusinessReviewDB } from "@/src/core/models/BusinessReview/interfaces/BusinessReview";
import { toDate } from "@/src/core/utility/date";
import { FirestoreDataConverter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";

export const newBusinessReview = (
    init:
        Pick<BusinessReview, 'business' | 'user' | 'trail' | 'hikeDate' | 'offerId' | 'hikeReview'>
        & Partial<Omit<BusinessReview, 'business' | 'user' | 'trail' | 'hikeDate' | 'hikeReview'>>
): BusinessReview => {
    return {
        id: init?.id || '',
        business: init.business,
        user: init.user,
        review: init.review || '',
        image: init.image || [],
        trail: init.trail,
        offerId: init.offerId,
        hikeDate: init.hikeDate,
        hikeReview: init.hikeReview,
        rating: init.rating || 0,
        likes: Array.isArray(init.likes) ? init.likes : [],
        createdAt: init.createdAt || new Date(),
        updatedAt: new Date(),
    }
}
const businessReviesFromFirestore = (id: string, data: BusinessReviewDB): BusinessReview => {
    return {
        ...data,
        id,
        image: Array.isArray(data.image) ? data.image : [],
        likes: Array.isArray(data.likes) ? data.likes : [],
        hikeDate: toDate(data.hikeDate),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt)
    }
}

export const businessReviewToFirestore = (businessReview: BusinessReview): BusinessReviewDB => {
    const isNew = businessReview.id === '';

    const data: BusinessReviewDB = {
        id: businessReview.id,
        business: businessReview.business,
        user: businessReview.user,
        trail: businessReview.trail,
        hikeDate: Timestamp.fromDate(businessReview.hikeDate),
        review: businessReview.review,
        image: businessReview.image ?? [],
        offerId: businessReview.offerId,
        hikeReview: businessReview.hikeReview,
        rating: businessReview.rating,
        likes: businessReview.likes ?? [],
        createdAt: isNew ? serverTimestamp() : Timestamp.fromDate(businessReview.createdAt),
        updatedAt: serverTimestamp()
    }

    return data;
}

export const businessReviewConverter: FirestoreDataConverter<BusinessReview> = {
    toFirestore: (businessReview: BusinessReview) => {
        return businessReviewToFirestore(businessReview);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): BusinessReview => {
        const data = snapshot.data() as BusinessReviewDB;
        return businessReviesFromFirestore(snapshot.id, data);
    }
}