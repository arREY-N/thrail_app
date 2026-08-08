import { CancellationRepo } from "@/src/core/init/repositories";
import { Cancellation } from "@/src/core/models/Cancellation/interfaces/ICancellation";
import { StateCreator } from "zustand";

export interface CancellationState {
    data: Cancellation[];
    businessCancellations: Cancellation[];
    offerCancellations: Cancellation[];
    userCancellations: Cancellation[];
    
    error: string | null;
    isFetching: boolean;
    isWriting: boolean;

    write: (businessId: string, cancellation: Cancellation) => Promise<void>;
    delete: (businessId: string, id: string) => Promise<void>;
    
    fetchCancellation: (businessId: string, id: string) => Promise<Cancellation | null>;
    fetchAllUserCancellations: (userId: string) => Promise<void>;
    
    fetchAllBusinessCancellations: (businessId: string) => Promise<void>;
    fetchAllOfferCancellations: (businessId: string, offerId: string) => Promise<Cancellation[]>;
}

const init = {
    data: [],
    businessCancellations: [],
    offerCancellations: [],
    userCancellations: [],

    error: null,
    isFetching: true,
    isWriting: false,
}

export const cancellationStoreCreator: StateCreator<CancellationState, [["zustand/immer", never]]> = (set, get) => ({
    ...init,

    async write(businessId: string, cancellation: Cancellation): Promise<void> {
        try {

            const cachedCancellation = get().data.find(c => c.id === cancellation.id);
            set({ isWriting: true, error: null });

            const result = await CancellationRepo.write(businessId, cancellation);

            set({
                userCancellations: [
                    ...get().userCancellations.filter(c => c.id !== result.id), 
                    result
                ]
            })
        } catch (error) {
            console.error("Error writing cancellation:", (error as Error).message);
            set({ error: (error as Error).message });
        }
    },

    async delete(businessId: string, id: string): Promise<void> {
        try {
            await CancellationRepo.delete(businessId, id);
            set({
                data: get().data.filter(c => c.id !== id)
            });
        } catch (error) {
            console.error("Error deleting cancellation:", (error as Error).message);
            throw error;
        }
    },


    async fetchCancellation(businessId: string, id: string): Promise<Cancellation | null> {
        try {
            let cancellation: Cancellation | null;

            if(get().data.length > 0) {
                cancellation = get().data.find(c => c.id === id) || null;
            } else {
                cancellation = await CancellationRepo.fetchCancellation(businessId, id);
            }

            return cancellation;
        } catch (error) {
            console.error("Error fetching cancellation by ID:", (error as Error).message);
            throw error;
        }
    },
    
    async fetchAllUserCancellations(userId: string): Promise<void> {
        try {
            if(get().userCancellations.length > 0 && get().userCancellations[0].userId === userId)
                return;
        
            if(get().isFetching)
                return;
            
            set({ isFetching: true, error: null });

            const userCancellations = await CancellationRepo.fetchAllUserCancellations(userId);
            
            set({ userCancellations });
        } catch (error) {
            console.error("Error fetching user cancellations:", (error as Error).message);
            set({ error: (error as Error).message });
        } finally {
            set({ isFetching: false });
        }
    },

    async fetchAllBusinessCancellations(businessId: string): Promise<void> {
        try {
            let cancellations: Cancellation[];

            if(get().data.length > 0) {
                cancellations = get().data.filter(c => c.businessId === businessId);
            } else {
                cancellations = await CancellationRepo.fetchAllBusinessCancellations(businessId);
            }

            set({
                data: [...get().data.filter(c => c.businessId !== businessId), ...cancellations],
                businessCancellations: cancellations
            })
        } catch (error) {
            console.error("Error fetching cancellations by business ID:", (error as Error).message);
            throw error;
        }
    },

    async fetchAllOfferCancellations(businessId: string, offerId: string): Promise<Cancellation[]> {
        try {
            let cancellations: Cancellation[];

            if(get().data.length > 0) {
                cancellations = get().data.filter(c => c.businessId === businessId && c.offerId === offerId);
            } else {
                cancellations = await CancellationRepo.fetchAllOfferCancellations(businessId, offerId);
            }

            return cancellations;
        } catch (error) {
            console.error("Error fetching cancellations by offer ID:", (error as Error).message);
            throw error;
        }   
    },
});