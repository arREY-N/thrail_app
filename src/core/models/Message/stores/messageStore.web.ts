import { MessageState, messageStoreCreator } from "@/src/core/models/Message/stores/messageStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useMessageStore = create<MessageState>()(
    immer(messageStoreCreator)
);

export const useMessagesStore = useMessageStore;
