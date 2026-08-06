import { CancellationRepo } from "@/src/core/init/repositories";
import { Cancellation } from "@/src/core/models/Cancellation/interfaces/ICancellation";
import { StateCreator } from "zustand";

export interface CancellationState {
    data: Cancellation[];
    businessCancellations: Cancellation[];
    offerCancellations: Cancellation[];
    write: (businessId: string, cancellation: Cancellation) => Promise<void>;
    delete: (businessId: string, id: string) => Promise<void>;
    
    fetchById: (businessId: string, id: string) => Promise<Cancellation | null>;
    fetchByBusinessId: (businessId: string) => Promise<void>;
    fetchByOfferId: (businessId: string, offerId: string) => Promise<Cancellation[]>;
    fetchAll: () => Promise<void>;
}

const init = {
    data: [],
    businessCancellations: [],
    offerCancellations: [],
}

export const cancellationStoreCreator: StateCreator<CancellationState, [["zustand/immer", never]]> = (set, get) => ({
    ...init,

    async write(businessId: string, cancellation: Cancellation): Promise<void> {
        try {
            const result = await CancellationRepo.write(businessId, cancellation);

            set({
                data: [...get().data.filter(c => c.id !== result.id), result]
            })

        } catch (error) {
            console.error("Error writing cancellation:", (error as Error).message);
            throw error;
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

    async fetchById(businessId: string, id: string): Promise<Cancellation | null> {
        try {
            let cancellation: Cancellation | null;

            if(get().data.length > 0) {
                cancellation = get().data.find(c => c.id === id) || null;
            } else {
                cancellation = await CancellationRepo.fetchById(businessId, id);
            }

            return cancellation;
        } catch (error) {
            console.error("Error fetching cancellation by ID:", (error as Error).message);
            throw error;
        }
    },

    async fetchByBusinessId(businessId: string): Promise<void> {
        try {
            let cancellations: Cancellation[];

            if(get().data.length > 0) {
                cancellations = get().data.filter(c => c.businessId === businessId);
            } else {
                cancellations = await CancellationRepo.fetchByBusinessId(businessId);
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

    async fetchByOfferId(businessId: string, offerId: string): Promise<Cancellation[]> {
        try {
            let cancellations: Cancellation[];

            if(get().data.length > 0) {
                cancellations = get().data.filter(c => c.businessId === businessId && c.offerId === offerId);
            } else {
                cancellations = await CancellationRepo.fetchByOfferId(businessId, offerId);
            }

            return cancellations;
        } catch (error) {
            console.error("Error fetching cancellations by offer ID:", (error as Error).message);
            throw error;
        }   
    },

    async fetchAll(): Promise<void> {
        try {

            if(get().data.length > 0) {
                return;
            }

            const cancellations = await CancellationRepo.fetchAll();
            
            set({ data: cancellations });
        } catch (error) {
            console.error("Error fetching all cancellations:", (error as Error).message);
            throw error;
        }
    },

    async refresh(): Promise<void> {
        try {
            const cancellations = await CancellationRepo.fetchAll();   
            set({ data: cancellations });
        } catch (error) {
            console.error("Error refreshing cancellations:", (error as Error).message);
            throw error;
        }
    }
});