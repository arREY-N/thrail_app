import { db } from "@/src/core/config/Firebase";
import { Group } from "@/src/core/models/Group/interfaces/Group.types";
import { groupConverter } from "@/src/core/models/Group/utils/GroupFactory";
import { Message, messageConverter } from "@/src/core/models/Message/Message";
import { IUserSummary } from "@/src/core/models/User/User";
import {
    arrayUnion,
    collection,
    doc,
    Firestore,
    getDoc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Unsubscribe,
    updateDoc,
    where,
} from "firebase/firestore";

export const GroupRepository = (db: Firestore) => ({
    async fetchGroup(groupId: string): Promise<Group> {
        try {
            const docRef = doc(db, 'groups', groupId).withConverter(groupConverter);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists())
                throw new Error('Group not found');

            return docSnap.data();
        } catch (error) {
            console.log('GroupRepository fetchGroup Error:', error);
            throw error;
        }
    },

    listenToUserGroups(userId: string, onUpdate: (groups: Group[]) => void): Unsubscribe {
        const q = query(
            collection(db, 'groups'),
            where('participantsIds', 'array-contains', userId),
            orderBy('updatedAt', 'desc')
        ).withConverter(groupConverter);

        return onSnapshot(q, (snapshot) => {
            onUpdate(snapshot.docs.map(d => d.data()));
        }, (error) => {
            console.error('Error in listenToUserGroups: ', error);
        });
    },

    listenToMessages(groupId: string, limitCount: number, onUpdate: (messages: Message[], fromCache: boolean) => void): Unsubscribe {
        const q = query(
            collection(db, 'groups', groupId, 'messages'),
            orderBy('timesent', 'desc'),
            limit(limitCount)
        ).withConverter(messageConverter);

        return onSnapshot(q, (snapshot) => {
            onUpdate(snapshot.docs.map(d => d.data()), snapshot.metadata.fromCache);
        }, (error) => {
            console.error('Error in listenToMessages: ', error);
        });
    },

    async writeGroup(group: Group): Promise<void> {
        try {
            const create = group.id === '';

            const ref = create
                ? doc(collection(db, 'groups')).withConverter(groupConverter)
                : doc(collection(db, 'groups'), group.id).withConverter(groupConverter);

            await setDoc(ref, group, { merge: true });
        } catch (error) {
            throw error;
        }
    },

    async sendMessage(groupId: string, message: Message): Promise<void> {
        try {
            const messagesCol = collection(db, 'groups', groupId, 'messages').withConverter(messageConverter);
            const messageRef = doc(messagesCol);

            const toSave = {
                ...message,
                id: messageRef.id,
            };

            await setDoc(messageRef, toSave);

            const groupRef = doc(db, 'groups', groupId);
            await setDoc(groupRef, {
                lastMessage: {
                    id: toSave.id,
                    content: toSave.content,
                    senderId: toSave.senderId,
                    senderName: toSave.senderName,
                    readBy: toSave.readBy || [],
                    status: toSave.status,
                    timesent: serverTimestamp(),
                },
                updatedAt: serverTimestamp(),
            }, { merge: true });

        } catch (error) {
            console.log('GroupRepository sendMessage Error:', error);
            throw error;
        }
    },

    async markMessageAsRead(groupId: string, messageId: string, userSummary: IUserSummary): Promise<void> {
        try {
            const messageRef = doc(db, 'groups', groupId, 'messages', messageId);
            const groupRef = doc(db, 'groups', groupId);

            const readUser = {
                id: userSummary.id,
                username: userSummary.username,
                firstname: userSummary.firstname,
                lastname: userSummary.lastname,
                email: userSummary.email,
            };

            // Update the actual message
            await updateDoc(messageRef, {
                readBy: arrayUnion(readUser),
            });

            // Update the parent group so the Group List unread dot disappears
            await updateDoc(groupRef, {
                'lastMessage.readBy': arrayUnion(readUser),
            });

        } catch (error) {
            console.log('Failed to mark as read:', error);
        }
    },

    async markGroupAsVisited(groupId: string, userSummary: IUserSummary): Promise<void> {
        try {
            const groupRef = doc(db, 'groups', groupId);

            const visitedUser = {
                id: userSummary.id,
                username: userSummary.username,
                firstname: userSummary.firstname,
                lastname: userSummary.lastname,
                email: userSummary.email,
            };

            // Merge visited user into the group-level lastMessage.readBy.
            await updateDoc(groupRef, {
                'lastMessage.readBy': arrayUnion(visitedUser),
            });
        } catch {
            // Non-critical — swallow silently if group has no lastMessage yet
        }
    },
});

export const GroupRepo = GroupRepository(db);