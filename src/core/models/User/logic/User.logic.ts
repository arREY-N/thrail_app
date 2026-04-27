import { IUserBooking } from "@/src/core/models/Booking/Booking.types";
import { User } from "@/src/core/models/User/User";
import { IUserSummary } from "@/src/core/models/User/User.types";

export const UserLogic = {
    toSummary(user: User): IUserSummary {
        return {
            id: user.id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
        }
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
        }
    }
}