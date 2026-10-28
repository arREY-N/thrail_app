import { db } from "@/src/core/config/Firebase";
import { Review } from "@/src/core/models/Review/interfaces/Review.types";
import { newReview, reviewConverter } from "@/src/core/models/Review/utils/ReviewFactory";
import {
    collection,
    deleteDoc,
    doc,
    DocumentData,
    Firestore,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    QueryDocumentSnapshot,
    setDoc,
    startAfter,
    Unsubscribe,
    where,
} from "firebase/firestore";

const PAGE_SIZE = 30;

export const ReviewRepository = (db: Firestore) => {
    const createReviewsCollection = () => {
        return collection(db, 'reviews').withConverter(reviewConverter);
    };

    let lastFetchAllDoc: QueryDocumentSnapshot<Review, DocumentData> | undefined;
    let lastFetchByUserDoc: QueryDocumentSnapshot<Review, DocumentData> | undefined;

    return {
        async fetchAll(isInitial: boolean = false): Promise<Review[]> {
            try {
                const reviewCollection = createReviewsCollection();
                if (isInitial) {
                    lastFetchAllDoc = undefined;
                }

                let q = query(
                    reviewCollection,
                    orderBy('createdAt', 'desc'),
                    limit(PAGE_SIZE)
                );

                if (!isInitial && lastFetchAllDoc) {
                    q = query(q, startAfter(lastFetchAllDoc));
                }

                const snapshot = await getDocs(q);
                const lastVisible = snapshot.docs[snapshot.docs.length - 1];
                lastFetchAllDoc = lastVisible;

                return snapshot.docs.map((docsnap) => docsnap.data());
            } catch (error: unknown) {
                console.error('Error fetching reviews: ', error);
                throw new Error('Failed to fetch reviews');
            }
        },

        async retrieveAll(): Promise<Review[]> {
            try {
                const reviewCollection = createReviewsCollection();
                let snapshot;
                try {
                    const q = query(
                        reviewCollection,
                        orderBy('createdAt', 'desc'),
                    );
                    snapshot = await getDocs(q);
                } catch (orderErr) {
                    console.warn('Could not orderBy createdAt on reviews, fetching unordered:', orderErr);
                    snapshot = await getDocs(reviewCollection);
                }
                const reviews = snapshot.docs.map((docsnap) => docsnap.data());
                reviews.sort((a, b) => {
                    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : (b.hikeDate ? new Date(b.hikeDate).getTime() : 0);
                    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : (a.hikeDate ? new Date(a.hikeDate).getTime() : 0);
                    return bTime - aTime;
                });
                return reviews;
            } catch (error: unknown) {
                console.error('Error fetching reviews: ', error);
                throw new Error('Failed to fetch reviews');
            }
        },

        listenToReviews(
            onUpdate: (reviews: Review[]) => void,
            onError?: (error: Error) => void,
            limitCount?: number
        ): Unsubscribe {
            try {
                const reviewCollection = createReviewsCollection();
                const q = limitCount
                    ? query(reviewCollection, orderBy('createdAt', 'desc'), limit(limitCount))
                    : query(reviewCollection);

                return onSnapshot(q, (snapshot) => {
                    const list = snapshot.docs.map((docSnap) => docSnap.data());
                    list.sort((a, b) => {
                        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : (b.hikeDate ? new Date(b.hikeDate).getTime() : 0);
                        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : (a.hikeDate ? new Date(a.hikeDate).getTime() : 0);
                        return bTime - aTime;
                    });
                    onUpdate(list);
                }, (error) => {
                    console.error('Error in listenToReviews: ', error);
                    onError?.(error);
                });
            } catch (error: unknown) {
                console.error('Error fetching reviews: ', error);
                onError?.(error as Error);
                throw new Error('Failed to fetch reviews');
            }
        },

        async fetchByUserId(userId: string, isInitial: boolean = false): Promise<Review[]> {
            try {
                const reviewCollection = createReviewsCollection();
                if (isInitial) {
                    lastFetchByUserDoc = undefined;
                }

                let q = query(
                    reviewCollection,
                    orderBy('createdAt', 'desc'),
                    limit(PAGE_SIZE),
                    where('user.id', '==', userId)
                );

                if (!isInitial && lastFetchByUserDoc) {
                    q = query(q, startAfter(lastFetchByUserDoc));
                }

                const snapshot = await getDocs(q);
                const lastVisible = snapshot.docs[snapshot.docs.length - 1];
                lastFetchByUserDoc = lastVisible;

                return snapshot.docs.map((docsnap) => docsnap.data());
            } catch (error: unknown) {
                console.error('Error fetching reviews by user ID: ', error);
                throw new Error('Failed to fetch reviews by user ID');
            }
        },

        async fetchById(id: string): Promise<Review | null> {
            try {
                const reviewCollection = createReviewsCollection();
                const docRef = doc(reviewCollection, id);
                const snapshot = await getDoc(docRef);

                if (!snapshot.exists()) {
                    return null;
                }

                return snapshot.data();
            } catch (error: unknown) {
                console.error('Error fetching review by ID: ', error);
                throw new Error('Failed to fetch review by ID');
            }
        },

        async write(data: Review): Promise<Review> {
            try {
                let review: Review = data;
                const reviewCollection = createReviewsCollection();
                const reviewRef = data.id
                    ? doc(reviewCollection, data.id)
                    : doc(reviewCollection);

                if (!data.id) {
                    review = newReview({ ...data, id: reviewRef.id });
                }

                await setDoc(reviewRef, review, { merge: true });
                return review;
            } catch (error: unknown) {
                console.error('Error writing review: ', error);
                throw new Error('Failed to write review');
            }
        },

        async delete(id: string): Promise<void> {
            try {
                const reviewCollection = createReviewsCollection();
                const docRef = doc(reviewCollection, id);
                await deleteDoc(docRef);
            } catch (error: unknown) {
                console.error('Error deleting review: ', error);
                throw new Error('Failed to delete review');
            }
        },
    };
};

export const ReviewRepo = ReviewRepository(db);

