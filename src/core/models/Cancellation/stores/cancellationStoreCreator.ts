import { Cancellation } from "@/src/core/models/Cancellation/interfaces/Cancellation.types";
import { CancellationRepo } from "@/src/core/models/Cancellation/repositories/CancellationRepository";
import { upsertItem } from "@/src/core/models/utils/upsert";
import { StateCreator } from "zustand";

export interface CancellationState {
    businessCancellations: Cancellation[];
    offerCancellations: Record<string, Cancellation[]>;
    userCancellations: Cancellation[];
    
    error: string | null;
    isFetching: boolean;
    isWriting: boolean;

    write: (writeData: WriteCancellationParams) => Promise<void>;
    delete: (businessId: string, cancellation: Cancellation, userId?: string) => Promise<void>;
    
    fetchUserCancellation: (businessId: string, id: string) => Promise<Cancellation | null>;
    fetchAllUserCancellations: (userId: string, refresh?: boolean) => Promise<void>;
    
    fetchAllBusinessCancellations: (businessId: string, refresh?: boolean) => Promise<void>;
    fetchAllOfferCancellations: (businessId: string, offerId: string) => Promise<Cancellation[]>;
}

const init = {
    businessCancellations: [],
    offerCancellations: {},
    userCancellations: [],

    error: null,
    isFetching: false,
    isWriting: false,
};

export type WriteCancellationParams = {
    cancellation: Cancellation;
    oldCancellation?: Cancellation;
    isAdmin: boolean;
};

export const cancellationStoreCreator: StateCreator<CancellationState, [["zustand/immer", never]]> = (set, get) => ({
    ...init,

    async write(writeData: WriteCancellationParams): Promise<void> {
        const { cancellation, oldCancellation, isAdmin } = writeData;
        
        try {
            set({ isWriting: true, error: null });

            const alreadyApproved = oldCancellation?.status === "approved";
            
            const alreadyProcessed = alreadyApproved || (oldCancellation?.status === "rejected" && isAdmin);

            if (alreadyProcessed) {
                throw new Error("Cannot modify a cancellation that has already been processed.");
            }

            const forApproval = cancellation.status === "approved";

            if (forApproval && !isAdmin) {
                if (isAdmin && cancellation.cancelledBy === 'admin')
                    throw new Error("This cancellation was made by an admin and cannot be approved by an admin.");

                if (!isAdmin && cancellation.cancelledBy === 'user')
                    throw new Error("This cancellation was made by a user and cannot be approved by a user.");
            }

            const result = await CancellationRepo.write(cancellation.businessId, cancellation);

            set(state => {
                if (isAdmin) {
                    return {
                        offerCancellations: {
                            ...state.offerCancellations,
                            [result.offerId]: upsertItem(state.offerCancellations[result.offerId] ?? [], result)
                        },
                        businessCancellations: upsertItem(state.businessCancellations, result),
                    };
                } else {
                    return {
                        userCancellations: upsertItem(state.userCancellations, result)
                    };
                }
            });
        } catch (error) {
            const errorMessage = `Error writing ${isAdmin ? 'admin' : 'user'} cancellation: ${(error as Error).message}`;
            set({ error: errorMessage });
            throw error;
        } finally {
            set({ isWriting: false });
        }
    },

    async delete(businessId: string, cancellation: Cancellation, userId?: string): Promise<void> {
        try {
            if (cancellation.status !== "pending") {
                throw new Error("Only pending cancellations can be deleted.");
            }

            if (cancellation.cancelledBy === 'user' && !userId) {
                throw new Error("User ID is required to delete a user cancellation.");
            }

            if (cancellation.cancelledBy !== 'admin' && cancellation.userId !== userId) {
                throw new Error("Users can only delete their own cancellation requests.");
            }

            set({ isWriting: true, error: null });

            const id = cancellation.id;

            await CancellationRepo.delete(businessId, id);
            
            set((state) => {
                if (cancellation.cancelledBy === 'admin') {
                    return {
                        businessCancellations: state.businessCancellations.filter(c => c.id !== id),
                    };
                } else {
                    return {
                        userCancellations: state.userCancellations.filter(c => c.id !== id),
                    };
                }
            });
        } catch (error) {
            throw error;
        } finally {
            set({ isWriting: false });
        }
    },

    async fetchUserCancellation(businessId: string, id: string): Promise<Cancellation | null> {
        try {
            let cancellation: Cancellation | null;

            if (get().userCancellations.length > 0 && get().userCancellations.some(c => c.id === id)) {
                cancellation = get().userCancellations.find(c => c.id === id) || null;
            } else {
                cancellation = await CancellationRepo.fetchCancellation(businessId, id);
            }

            return cancellation;
        } catch (error) {
            console.error("Error fetching cancellation by ID:", (error as Error).message);
            throw error;
        }
    },
    
    async fetchAllUserCancellations(userId: string, refresh: boolean = false): Promise<void> {
        if (get().isFetching) {
            console.log("Fetch already in progress for userId:", userId);
            return;
        }
        
        if (get().userCancellations.length > 0 && get().userCancellations[0].userId === userId && !refresh) {
            console.log("User cancellations already fetched for userId:", userId);
            return;
        }

        try {    
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

    async fetchAllBusinessCancellations(businessId: string, refresh: boolean = false): Promise<void> {
        if (get().isFetching) {
            console.log("Fetch already in progress for businessId:", businessId);
            return;
        }

        if (get().businessCancellations.length > 0 && get().businessCancellations[0].businessId === businessId && !refresh) {
            console.log("Business cancellations already fetched for businessId:", businessId);
            return;
        }

        try {
            set({ isFetching: true, error: null });

            const cancellations = await CancellationRepo.fetchAllBusinessCancellations(businessId);

            set({
                businessCancellations: cancellations,
                isFetching: false
            });
        } catch (error) {
            set({ 
                error: (error as Error).message,
                isFetching: false
            });
            throw error;
        }
    },

    async fetchAllOfferCancellations(businessId: string, offerId: string): Promise<Cancellation[]> {
        try {
            let cancellations: Cancellation[];

            const offerCancellations = get().offerCancellations[offerId];

            if (offerCancellations && offerCancellations.length > 0) {
                cancellations = offerCancellations.filter(c => c.businessId === businessId && c.offerId === offerId);
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