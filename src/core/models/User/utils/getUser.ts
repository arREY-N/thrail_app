import { User } from "@/src/core/models/User/interfaces/User.types";
import { useUserStore } from "@/src/core/models/User/stores/userStore";

export async function getUser(userId: string): Promise<User> {
    const user = await useUserStore.getState().loadUser(userId);

    if (!user) throw new Error(`User not found ${userId}`);

    return user;
}

export async function getUsersByEmail(email: string): Promise<User[]> {
    const users = await useUserStore.getState().loadUserByEmail(email);
    if (users.length === 0) throw new Error(`User not found ${email}`);
    return users;
}