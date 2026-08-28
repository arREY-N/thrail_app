// DEPRECATED / MARKED FOR DELETION
// Replaced by src/core/models/User/utils/User.logic.ts

import { IUserBooking } from "@/src/core/models/Booking/Booking";
import { IUserSummary, User } from "@/src/core/models/User/interfaces/User.types";

export const UserLogic = {
    toSummary(user: User): IUserSummary {
        return {
            id: user.id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
        };
    },
    toBookingSummary(user: User): IUserBooking<Date> {
        return {
            id: user.id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            birthday: user.birthday,
        };
    },
};