import { db } from "@/src/core/config/Firebase";
import { CancellationRepository } from "@/src/core/models/Cancellation/repositories/CancellationRepository";
import { LeaderboardRepository } from "@/src/core/models/Leaderboard/repositories/LeaderboardRepository";
import { OfferRepository } from "@/src/core/models/Offer/repositories/OfferRepository";

export const LeadberboardRepo = LeaderboardRepository(db);
export const OfferRepo = OfferRepository(db);
export const CancellationRepo = CancellationRepository(db);