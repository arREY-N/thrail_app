import { BaseStore } from "@/src/core/interface/storeInterface";
import { IRecommendedTrail } from "@/src/core/models/Recommendation/Recommendation.types";
import { TrailRepository } from "@/src/core/repositories/trailRepository";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Trail } from "../models/Trail/Trail";
export interface TrailState extends BaseStore<Trail> {
  hikingTrail: {
    trail: Trail | null;
    hiking: boolean;
  };
  setHikingTrail: (id: string) => void;
  recommendedTrail: Trail[];
  setRecommendedTrail: (trails: IRecommendedTrail[]) => Promise<Trail[]>;
  discoverTrail: Trail[];
  setDiscoverTrail: () => Promise<Trail[]>;
  setOnHike: () => void;
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
};

// [DEV TESTING MOCKS]
// We created these 'tempoTrails' temporary offline mock endpoints to bypass Firebase requirements during UI/UX development.
// Because the actual map geometries (trails.json) represent these specific mountains, we feed these exact 'startLat' and 'startLong'
// coordinates down from the 'Hike' button into the MapLibre components. This guarantees we can functionally test
// that the map camera perfectly centers precisely on the drawn green trails without needing a live network connection to Firestore.
// DO NOT DELETE these mocks until the Map Navigation and "Hike Map FlyTo" camera animation is fully validated in production!
const tempoTrails = [
  {
    id: "mock_tagapo",
    name: "Mount Tagapo",
    province: "Rizal",
    address: "Talim Island, Rizal",
    score: 4.8,
    masl: 438,
    length: 5,
    geography: { startLat: 14.3392772, startLong: 121.2325293 },
  },
  {
    id: "mock_marami",
    name: "Mount Marami",
    province: "Rizal",
    address: "Tanay, Rizal",
    score: 4.9,
    masl: 739,
    length: 7,
    geography: { startLat: 14.1986108, startLong: 120.6858334 },
  },
  {
    id: "mock_batulao",
    name: "Mount Batulao",
    province: "Batangas",
    address: "Nasugbu, Batangas",
    score: 4.7,
    masl: 811,
    length: 9,
    geography: { startLat: 14.0399434, startLong: 120.8023782 },
  },
  {
    id: "mock_makiling",
    name: "Mount Makiling",
    province: "Laguna",
    address: "Los Baños, Laguna",
    score: 4.6,
    masl: 1090,
    length: 12,
    geography: { startLat: 14.1352241, startLong: 121.1944517 },
  },
  {
    id: "mock_maculot",
    name: "Mount Maculot",
    province: "Batangas",
    address: "Cuenca, Batangas",
    score: 4.8,
    masl: 930,
    length: 4,
    geography: { startLat: 13.9208682, startLong: 121.0516961 },
  },
].map((matchedMock) => ({
  id: matchedMock.id,
  general: {
    name: matchedMock.name,
    address: matchedMock.address,
    province: [matchedMock.province],
    mountain: [matchedMock.name],
    rating: matchedMock.score,
    reviewCount: 150,
  },
  geography: matchedMock.geography,
  difficulty: {
    length: matchedMock.length,
    elevation: matchedMock.masl,
    slope: 10,
    hours: 4,
    circularity: "Out and Back",
  },
  tourism: {},
})) as any as Trail[];

export const useTrailsStore = create<TrailState>()(
  immer((set, get) => ({
    ...init,
    data: tempoTrails, // Preload mocks immediately into init state

    fetchAll: async () => {
      // Only return if we have real data beyond just the mocks
      if (get().data.length > tempoTrails.length) return;

      set({ isLoading: true, error: null });

      try {
        const trails = await TrailRepository.fetchAll();
        const normalizedFirebaseTrails = trails.map((t: any) => ({
          ...t,
          difficulty: {
            ...(t.difficulty || {}),
            elevation: t.difficulty?.elevation ?? t.masl ?? t.geography?.masl,
            length: t.difficulty?.length ?? t.length,
          },
          general: {
            ...(t.general || {}),
            name: t.general?.name ?? t.name,
            address: t.general?.address ?? t.address,
            rating: t.general?.rating ?? t.score,
            province: t.general?.province ?? (t.province ? [t.province] : []),
          },
        }));
        // Combine real Firebase trails with our temp mocks
        const combined = [...tempoTrails, ...normalizedFirebaseTrails];
        const sorted = combined.sort((a, b) =>
          a.general.name.localeCompare(b.general.name),
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

    refresh: async () => {
      set({ isLoading: true, error: null });

      try {
        const trails = await TrailRepository.fetchAll();
        const normalizedFirebaseTrails = trails.map((t: any) => ({
          ...t,
          difficulty: {
            ...(t.difficulty || {}),
            elevation: t.difficulty?.elevation ?? t.masl ?? t.geography?.masl,
            length: t.difficulty?.length ?? t.length,
          },
          general: {
            ...(t.general || {}),
            name: t.general?.name ?? t.name,
            address: t.general?.address ?? t.address,
            rating: t.general?.rating ?? t.score,
            province: t.general?.province ?? (t.province ? [t.province] : []),
          },
        }));
        const combined = [...tempoTrails, ...normalizedFirebaseTrails];
        const sorted = combined.sort((a, b) =>
          a.general.name.localeCompare(b.general.name),
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
      if (!id) {
        set({ current: new Trail() });
        return;
      }

      set({ isLoading: true, error: null });

      try {
        let trail: Trail | undefined | null = null;
        let data = get().data;

        if (data.length > 0) {
          trail = data.find((t) => t.id === id);
        }

        // Prevent firebase fetch if it's a mocked offline ID
        if (!trail && !id.startsWith("mock_")) {
          trail = await TrailRepository.fetchById(id);
        }

        if (!trail) {
          throw new Error(`Could not find trail with id ${id}`);
        }

        set({
          data: data.find((d) => d.id === trail?.id) ? data : [...data, trail],
          current: trail,
          isLoading: false,
        });
      } catch (err: any) {
        console.error(err.message);
        set({
          error: err.message,
          isLoading: false,
        });
      }
    },

    create: async (trail: Trail) => {
      set({ isLoading: true, error: null });
      const data = get().data;

      try {
        data.find((t) => {
          const name = t.general.name.toUpperCase().trim();
          const save = trail.general.name.toUpperCase().trim();

          if (name.includes(save) && t.id !== trail.id)
            throw new Error("A trail with the same name already exists.");
        });

        console.log("New:", trail);
        const saved = await TrailRepository.write(trail);

        set({
          data: get().data.some((d) => d.id === saved.id)
            ? [...get().data.filter((d) => d.id !== saved.id), saved]
            : [...get().data, saved],
          isLoading: false,
        });
        return true;
      } catch (err: any) {
        console.error(err.message);
        set({
          error: err.message,
          isLoading: false,
        });
        return false;
      }
    },

    delete: async (id: string) => {
      set({ isLoading: true, error: null });

      try {
        await TrailRepository.delete(id);

        set({
          data: get().data.filter((f) => f.id !== id),
          isLoading: false,
        });
      } catch (err: any) {
        console.error(err);
        set({
          error: err.message ?? "Failed to delete trail",
          isLoading: false,
        });
      }
    },

    reset: () => set(init),

    setHikingTrail: (id: string) => {
      set({ isLoading: true, error: null });
      console.log("setting: ", id);
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
      let trail: Trail = new Trail();
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
  })),
);
