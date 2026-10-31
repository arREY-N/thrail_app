import { BaseStore } from "@/src/core/interface/storeInterface";
import { IRecommendedTrail } from "@/src/core/models/Recommendation/Recommendation";
import { Trail } from "@/src/core/models/Trail/interfaces/Trail.types";
import { TrailRepo } from "@/src/core/models/Trail/repositories/TrailRepository";
import { newTrail } from "@/src/core/models/Trail/utils/TrailFactory";
import { upsertItem } from "@/src/core/models/utils/upsert";
import { Profile } from "@/src/recommendation/interfaces/Profile";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";
import { StateCreator } from "zustand";

export interface TrailState extends BaseStore<Trail> {
	hikingTrail: {
		trail: Trail | null;
		hiking: boolean;
	};
	recommendedTrail: Trail[];
	discoverTrail: Trail[];
	hasLoadedSession: boolean;

	setHikingTrail: (id: string) => void;
	setRecommendedTrail: (trails: IRecommendedTrail[]) => Promise<Trail[]>;
	setDiscoverTrail: () => Promise<Trail[]>;
	setOnHike: () => void;

	fetchTrailByName: (trailName: string) => Promise<Trail>;
	saveBatchTrailProfiles: (updates: { id: string; profile: Profile }[]) => Promise<boolean>;
}

const init = {
	data: [],
	current: null,
	isLoading: true,
	error: null,
	hikingTrail: {
		trail: null,
		hiking: false,
	},
	recommendedTrail: [],
	discoverTrail: [],
	hasLoadedSession: false,
};

export const trailStoreCreator: StateCreator<TrailState, [["zustand/immer", never]]> = (set, get) => ({
	...init,

	fetchAll: async () => {
		const platform = Platform.OS;

		if (platform !== 'web') {
			const network = await NetInfo.fetch();
			const isOnline = (network.isConnected && network.isInternetReachable);

			if (!isOnline) {
				set({ isLoading: false });
				return;
			}
		}

		const isCacheEmpty = get().data.length === 0;

		set({ data: get().data, isLoading: isCacheEmpty, error: null });

		try {
			const trails = await TrailRepo.fetchAll();
			if (trails && Array.isArray(trails) && trails.length > 0) {
				const sorted = trails.sort((a, b) =>
					(a.general?.name || '').localeCompare(b.general?.name || ''),
				);

				set({
					data: sorted,
					isLoading: false,
				});
			} else {
				set({ isLoading: false });
			}
		} catch (err) {
			set({
				isLoading: false,
				error: get().data.length === 0 ? ((err as Error).message ?? "Failed to load trails") : null,
			});
		}
	},

	refresh: async () => {
		set({ isLoading: true, error: null });

		try {
			const trails = await TrailRepo.fetchAll();
			const sorted = trails.sort((a, b) =>
				(a.general?.name || '').localeCompare(b.general?.name || ''),
			);
			set({
				data: sorted,
				isLoading: false,
			});
		} catch (err) {
			console.error(err);
			set({
				error: (err as Error).message ?? "Failed to load trails",
				isLoading: false,
			});
		}
	},

	load: async (id: string | null) => {
		if (id === 'diy') {
			return;
		}
		if (!id) {
			set({ current: newTrail() });
			return;
		}

		set({ isLoading: true, error: null });

		try {
			let trail: Trail | undefined | null = null;
			let data = get().data;

			if (data.length > 0) {
				trail = data.find((t) => t.id === id);
			}

			if (!trail) {
				trail = await TrailRepo.fetchById(id);
			}

			if (!trail) {
				throw new Error(`Could not find trail with id ${id}`);
			}

			set({
				data: upsertItem(get().data, trail),
				current: trail,
				isLoading: false,
			});
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Failed loading trail';
			console.error(msg);
			set({
				error: msg,
				isLoading: false,
			});
		}
	},

	fetchTrailByName: async (trailName: string): Promise<Trail> => {
		try {
			set({ isLoading: true, error: null })

			let trail: Trail | undefined | null = null;

			trail = get().data.find((t) => t.general?.name.toUpperCase().trim() === trailName.toUpperCase().trim());

			if (!trail) {
				trail = await TrailRepo.fetchByName(trailName);
			}

			if (!trail) {
				throw new Error('Trail not found ' + trailName);
			}

			set((state) => ({
				isLoading: false,
				data: upsertItem(state.data, trail)
			}));
			return trail;
		} catch (error) {
			throw error;
		}
	},

	create: async (trail: Trail) => {
		set({ isLoading: true, error: null });
		const data = get().data;

		try {
			const hasDuplicate = data.some((t) => {
				const existingName = (t.general?.name || '').toUpperCase().trim();
				const save = (trail.general?.name || '').toUpperCase().trim();
				console.log('has duplicate: ', existingName === save && t.id !== trail.id);
				return existingName === save && t.id !== trail.id;
			});

			if (hasDuplicate) {
				throw new Error("A trail with the same name already exists.");
			}

			const saved = await TrailRepo.write(trail);

			set({
				data: get().data.some((d) => d.id === saved.id)
					? [...get().data.filter((d) => d.id !== saved.id), saved]
					: [...get().data, saved],
				isLoading: false,
			});
			return true;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : 'Failed creating trail';
			console.error(errMessage);
			set({
				error: errMessage,
				isLoading: false,
			});
			return false;
		}
	},

	delete: async (id: string) => {
		set({ isLoading: true, error: null });

		try {
			await TrailRepo.delete(id);

			set({
				data: get().data.filter((f) => f.id !== id),
				isLoading: false,
			});
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Failed to delete trail";
			console.error(msg);
			set({
				error: msg,
				isLoading: false,
			});
		}
	},

	reset: () => set(init),

	setHikingTrail: (id: string) => {
		set({ isLoading: true, error: null });

		try {
			const data = get().data;
			const trail = data.find((t) => t.id === id);

			if (!trail) {
				set({
					error: "Trail not found",
					isLoading: false,
				});
				return;
			}

			set((state) => {
				return {
					hikingTrail: {
						...state.hikingTrail,
						trail,
					},
				};
			});
		} catch (err) {
			console.error((err as Error).message);
			set({
				error: (err as Error).message,
				isLoading: false,
			});
		}
		let trail: Trail = newTrail();
		return trail;
	},

	setOnHike: () => {
		const hiking = get().hikingTrail.hiking;
		console.log(hiking);

		set((state) => {
			return {
				hikingTrail: {
					...state.hikingTrail,
					hiking: !hiking,
				},
			};
		});
	},

	setDiscoverTrail: async () => {
		let discover: Trail[] = [];

		return discover;
	},

	setRecommendedTrail: async (trails: IRecommendedTrail[]) => {
		let recommended: Trail[] = [];
		return recommended;
	},

	saveBatchTrailProfiles: async (updates: { id: string; profile: Profile }[]) => {
		if (!updates || updates.length === 0) return true;

		try {
			await TrailRepo.updateBatchProfiles(updates);

			const profileMap = new Map(updates.map((u) => [u.id, u.profile]));
			set((state) => ({
				data: state.data.map((t) => {
					const profile = profileMap.get(t.id);
					return profile ? { ...t, profile } : t;
				}),
				current: state.current && profileMap.has(state.current.id)
					? { ...state.current, profile: profileMap.get(state.current.id)! }
					: state.current,
			}));

			return true;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : 'Failed saving trail profiles';
			console.error(errMessage);
			set({ error: errMessage });
			return false;
		}
	},
});