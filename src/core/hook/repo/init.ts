import { db } from "@/src/core/config/Firebase";
import { HikeRepo } from "@/src/core/models/Hike/repositories/hikeRepo";
import { UserRepo } from "@/src/core/models/User/repositories/userRepo";

export const UserRepository = UserRepo(db);
export const HikeRepository = HikeRepo(db);