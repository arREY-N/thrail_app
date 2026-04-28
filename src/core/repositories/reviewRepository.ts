import { db } from "@/src/core/config/Firebase";
import { Repository } from "@/src/core/interface/repositoryInterface";
import { Review, reviewConverter } from "@/src/core/models/Review/Review";
import { Unsubscribe } from "firebase/auth";
import { collection, deleteDoc, doc, DocumentData, getDoc, getDocs, limit, onSnapshot, orderBy, query, QueryDocumentSnapshot, setDoc, startAfter, where } from "firebase/firestore";

const createReviewsCollection = () => {
    return collection(db, 'reviews').withConverter(reviewConverter);
}

const PAGE_SIZE = 30;
let lastDoc: QueryDocumentSnapshot<Review, DocumentData>;

class ReviewRepositoryImpl implements Repository<Review> {
    async fetchAll(isInitial: Boolean = false): Promise<Review[]> {
        try {
            const reviewCollection = createReviewsCollection();
            let q =  query(
                reviewCollection,
                orderBy('createdAt', 'desc'),
                limit(PAGE_SIZE)
            );
            
            if(!isInitial && lastDoc) { 
                q = query(q, startAfter(lastDoc));
            }

            const snapshot = await getDocs(q);

            const lastVisible = snapshot.docs[snapshot.docs.length - 1];
            lastDoc = lastVisible;

            return snapshot.docs.map((docsnap) => docsnap.data());
        } catch (error: unknown) {
            console.error('Error fetching reviews: ', error);
            throw new Error('Failed to fetch reviews');
        }
    }

    listenToReviews(onUpdate: (reviews: Review[]) => void): Unsubscribe {
        try {
            const reviewCollection = createReviewsCollection();
            const q =  query(
                reviewCollection,
                orderBy('createdAt', 'desc'),
                limit(PAGE_SIZE)
            );
            
            return onSnapshot(q, (snapshot) => {
                onUpdate(snapshot.docs.map(doc => doc.data()))
            })
        } catch (error: unknown) {
            console.error('Error fetching reviews: ', error);
            throw new Error('Failed to fetch reviews');
        }
    }

    async fetchByUserId(userId: string, isInitial: boolean = false): Promise<Review[]> {
        try {
            const reviewCollection = createReviewsCollection();
            
            let q = query(
                reviewCollection, 
                orderBy('createdAt', 'desc'), 
                limit(PAGE_SIZE), 
                where('user.id', '==', userId)
            );

            if(!isInitial && lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snapshot = await getDocs(q);  
            
            const lastVisible = snapshot.docs[snapshot.docs.length - 1];
            lastDoc = lastVisible;

            return snapshot.docs.map((docsnap) => docsnap.data());
        } catch (error: unknown) {
            console.error('Error fetching reviews by user ID: ', error);
            throw new Error('Failed to fetch reviews by user ID');
        }
    }


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
    }

    async write(data: Review, ...args: any[]): Promise<Review> {
        try {
            let review: Review = data;

            const reviewRef = data.id 
                ? doc(createReviewsCollection(), data.id)
                : doc(createReviewsCollection());

            if(!data.id)
                review = new Review({...data, id: reviewRef.id })

            console.log('repository', review);

            await setDoc(
                reviewRef,
                review,
                { merge: true }
            )

            return review;
        } catch (error: unknown) {
            console.error('Error writing review: ', error);
            throw new Error('Failed to write review');
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const reviewCollection = createReviewsCollection();
            const docRef = doc(reviewCollection, id);

            await deleteDoc(docRef);
        } catch (error: unknown) {
            console.error('Error deleting review: ', error);
            throw new Error('Failed to delete review');
        }
    }
}

export const ReviewRepository = new ReviewRepositoryImpl();