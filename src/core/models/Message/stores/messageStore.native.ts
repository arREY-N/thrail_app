import { MessageState, messageStoreCreator } from "@/src/core/models/Message/stores/messageStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useMessageStore = create<MessageState>()(
    persist(
        immer(messageStoreCreator),
        {
            name: "message-storage",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                messagesByGroup: state.messagesByGroup,
            }),
        }
    )
);

export const useMessagesStore = useMessageStore;
