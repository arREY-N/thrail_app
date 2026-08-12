import { GroupState, groupStoreCreator } from "@/src/core/models/Group/stores/groupStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useGroupStore = create<GroupState>()(
    immer(groupStoreCreator),
);