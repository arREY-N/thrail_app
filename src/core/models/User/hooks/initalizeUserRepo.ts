import { db } from "@/src/core/config/Firebase";
import { UserRepo } from "@/src/core/models/User/repositories/userRepo";

export const UserRepository = UserRepo(db);