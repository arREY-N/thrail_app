import { User } from "@/src/core/models/User/User";
import { IUserSummary } from "@/src/core/models/User/User.types";

export const UserLogic = {
    toSummary(user: User): IUserSummary {
        return {
            id: user.id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.lastname,
        }
    }
}