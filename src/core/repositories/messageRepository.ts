import { db } from "@/src/core/config/Firebase";
import { Group, GroupConverter } from "@/src/core/models/Group/Group";
import { Message, MessageConverter } from "@/src/core/models/Message/Message";
import { IUserSummary } from "@/src/core/models/User/User.types";
import { arrayUnion, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, Unsubscribe, updateDoc, where } from "firebase/firestore";

export interface ChatRepositoryInterface {
  listenToUserGroups(userId: string, onUpdate: (groups: Group[]) => void): Unsubscribe;
  listenToMessages(groupId: string, onUpdate: (messages: Message[]) => void): Unsubscribe;
  sendMessage(groupId: string, message: Message): Promise<void>;
  writeGroup(group: Group): Promise<void>;
  markMessageAsRead(groupId: string, messageId: string, userSummary: IUserSummary): Promise<void>;
  fetchGroup(groupId: string): Promise<Group>;
}


class MessageRepositoryImpl implements ChatRepositoryInterface {
    async fetchGroup(groupId: string): Promise<Group> {
        try {
            const docRef = doc(db, 'groups', groupId).withConverter(GroupConverter);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists())
                throw new Error('Group not found');
                        
            return docSnap.data();
        } catch (error) {
            console.error('MessageRepository Error:', error);
            throw error;
        }
    }

    listenToUserGroups(userId: string, onUpdate: (groups: Group[]) => void): Unsubscribe {
        const q = query(
            collection(db, 'groups'),
            where('participantsIds', 'array-contains', userId),
            orderBy('updatedAt', 'desc')
        ).withConverter(GroupConverter);

        return onSnapshot(q, (snapshot) => {
            onUpdate(snapshot.docs.map(doc => doc.data()));
        });
    }

    listenToMessages(groupId: string, onUpdate: (messages: Message[]) => void): Unsubscribe {
        const q = query(
            collection(db, 'groups', groupId, 'messages'),
            orderBy('timesent', 'asc')
        ).withConverter(MessageConverter);

        return onSnapshot(q, (snapshot) => {
            onUpdate(snapshot.docs.map(doc => doc.data()));
        });
    }

    async writeGroup(group: Group): Promise<void> {
        try {
            const create = group.id === '';

            const ref = create
                ? doc(collection(db, 'groups')).withConverter(GroupConverter)
                : doc(collection(db, 'groups'), group.id).withConverter(GroupConverter);
            
            console.log(ref.path);

            await setDoc(ref, group, {merge: true});
        } catch (error) {
            console.error('MessageRepository Error:', error);
            throw error;
        }
    }

    async sendMessage(groupId: string, message: Message): Promise<void> {
        try {
            const messagesCol = collection(db, 'groups', groupId, 'messages').withConverter(MessageConverter);
            const messageRef = doc(messagesCol);
            
            message.id = messageRef.id;

            await setDoc(messageRef, message);

            const groupRef = doc(db, 'groups', groupId);
            await setDoc(groupRef, {
                lastMessage: message.toFirestore(),
                updatedAt: serverTimestamp(),
            }, { merge: true });

        } catch (error) {
            console.error('MessageRepository Error:', error);
            throw error;
        }
    }

    async markMessageAsRead(groupId: string, messageId: string, userSummary: IUserSummary): Promise<void> {
        try {
            const messageRef = doc(db, 'groups', groupId, 'messages', messageId);

            console.log('marking read in repo')
            await updateDoc(
                messageRef,
                {
                    readBy: arrayUnion({
                        id: userSummary.id,
                        username: userSummary.username,
                        firstname: userSummary.firstname,
                        lastname: userSummary.lastname,
                        email: userSummary.email,
                    })
                }
            )
        } catch (error) {
            
        }
    }
}

export const MessageRepository = new MessageRepositoryImpl();