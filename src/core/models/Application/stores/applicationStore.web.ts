import { ApplicationState, applicationStoreCreator } from "@/src/core/models/Application/stores/applicationStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useApplicationsStore = create<ApplicationState>()(
    immer(applicationStoreCreator)
);
