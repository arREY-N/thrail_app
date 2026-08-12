import { db } from "@/src/core/config/Firebase";
import { BookingRepository } from "@/src/core/models/Booking/repositories/BookingRepository";
import { CancellationRepository } from "@/src/core/models/Cancellation/repositories/CancellationRepository";
import { GroupRepository } from "@/src/core/models/Group/repositories/GroupRepository";
import { LeaderboardRepository } from "@/src/core/models/Leaderboard/repositories/LeaderboardRepository";
import { OfferRepository } from "@/src/core/models/Offer/repositories/OfferRepository";

export const LeadberboardRepo = LeaderboardRepository(db);
export const OfferRepo = OfferRepository(db);
export const CancellationRepo = CancellationRepository(db);
export const BookingRepo = BookingRepository(db);
export const GroupRepo = GroupRepository(db);