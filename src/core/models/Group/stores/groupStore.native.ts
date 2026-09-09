import { GroupState, groupStoreCreator } from "@/src/core/models/Group/stores/groupStoreCreator";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useGroupStore = create<GroupState>()(
    persist(
        immer(groupStoreCreator),
        {
            name: 'group-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                groups: state.groups.length > 0 ? state.groups : [],
                messagesByGroup: Object.fromEntries(
                    Object.entries(state.messagesByGroup).map(([getPropsBuilder, msgs]) => [
                        getPropsBuilder, msgs.slice(-30)
                    ])
                ),
            })
        }
    )
);