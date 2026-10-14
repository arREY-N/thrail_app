import { db } from "@/src/core/config/Firebase";
import { Message } from "@/src/core/models/Message/interfaces/Message.types";
import { messageConverter, newMessage } from "@/src/core/models/Message/utils/MessageFactory";
import { IUserSummary } from "@/src/core/models/User/User";
import {
    arrayUnion,
    collection,
    doc,
    Firestore,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Unsubscribe,
    updateDoc,
} from "firebase/firestore";

export const MessageRepository = (db: Firestore) => {
    const createGroupMessagesCollection = (groupId: string) => {
        return collection(db, "groups", groupId, "messages").withConverter(messageConverter);
    };

    return {
        /**
         * Listens to messages for a given group in real-time with pagination support.
         */
        listenToGroupMessages(
            groupId: string,
            limitCount: number,
            onUpdate: (messages: Message[], fromCache: boolean) => void
        ): Unsubscribe {
            const q = query(
                createGroupMessagesCollection(groupId),
                orderBy("timesent", "desc"),
                limit(limitCount)
            );

            return onSnapshot(
                q,
                (snapshot) => {
                    onUpdate(
                        snapshot.docs.map((d) => d.data()),
                        snapshot.metadata.fromCache
                    );
                },
                (error) => {
                    console.error("Error in listenToGroupMessages: ", error);
                }
            );
        },

        /**
         * Fetches a list of messages for a given group.
         */
        async fetchGroupMessages(groupId: string, limitCount: number = 30): Promise<Message[]> {
            try {
                const q = query(
                    createGroupMessagesCollection(groupId),
                    orderBy("timesent", "desc"),
                    limit(limitCount)
                );
                const snapshot = await getDocs(q);
                return snapshot.docs.map((d) => d.data());
            } catch (error) {
                console.error("MessageRepository fetchGroupMessages Error:", error);
                throw error;
            }
        },

        /**
         * Sends a message in a group chat, writing to the messages subcollection and updating group metadata.
         */
        async sendMessage(groupId: string, message: Message): Promise<Message> {
            try {
                const messagesCol = createGroupMessagesCollection(groupId);
                const messageRef = message.id ? doc(messagesCol, message.id) : doc(messagesCol);
                const toSave = newMessage({ ...message, id: messageRef.id });

                await setDoc(messageRef, toSave);

                // Update the parent group's lastMessage and updatedAt
                const groupRef = doc(db, "groups", groupId);
                await setDoc(
                    groupRef,
                    {
                        lastMessage: {
                            id: toSave.id,
                            content: toSave.content,
                            senderId: toSave.senderId,
                            senderName: toSave.senderName,
                            readBy: toSave.readBy,
                            status: toSave.status,
                            timesent: serverTimestamp(),
                        },
                        updatedAt: serverTimestamp(),
                    },
                    { merge: true }
                );

                return toSave;
            } catch (error) {
                console.error("MessageRepository sendMessage Error:", error);
                throw error;
            }
        },

        /**
         * Marks a message as read by the user in the subcollection and the parent group lastMessage.
         */
        async markMessageAsRead(groupId: string, messageId: string, userSummary: IUserSummary): Promise<void> {
            try {
                const messageRef = doc(db, "groups", groupId, "messages", messageId);
                const groupRef = doc(db, "groups", groupId);

                const readUser = {
                    id: userSummary.id,
                    username: userSummary.username,
                    firstname: userSummary.firstname,
                    lastname: userSummary.lastname,
                    email: userSummary.email,
                };

                await updateDoc(messageRef, {
                    readBy: arrayUnion(readUser),
                });

                await updateDoc(groupRef, {
                    "lastMessage.readBy": arrayUnion(readUser),
                });
            } catch (error) {
                console.error("MessageRepository markMessageAsRead Error:", error);
            }
        },
    };
};

export const MessageRepo = MessageRepository(db);
