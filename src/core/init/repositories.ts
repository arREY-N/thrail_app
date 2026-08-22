/* eslint-disable no-restricted-imports */
// Disabled restriction to allow centralized initialization and 
// direct reference to internal feature repository without eslint error.

import { db } from "@/src/core/config/Firebase";
import { AdminRepository } from "@/src/core/models/Admin/repositories/AdminRepository";
import { ApplicationRepository } from "@/src/core/models/Application/repositories/applicationRepository";
import { BookingRepository } from "@/src/core/models/Booking/repositories/BookingRepository";
import { BusinessRepository } from "@/src/core/models/Business/repositories/businessRepository";
import { CancellationRepository } from "@/src/core/models/Cancellation/repositories/CancellationRepository";
import { GroupRepository } from "@/src/core/models/Group/repositories/GroupRepository";
import { HikeRepository } from "@/src/core/models/Hike/repositories/HikeRepository";
import { LeaderboardRepository } from "@/src/core/models/Leaderboard/repositories/LeaderboardRepository";
import { MountainRepository } from "@/src/core/models/Mountain/repositories/MountainRepository";
import { NotificationRepository } from "@/src/core/models/Notification/repositories/NotificationRepository";
import { OfferRepository } from "@/src/core/models/Offer/repositories/OfferRepository";
import { RecommendationRepository } from "@/src/core/models/Recommendation/repositories/recommendationRepository";
import { RescheduleRepository } from "@/src/core/models/Reschedule/repositories/RescheduleRepository";
import { ReviewRepository } from "@/src/core/models/Review/repositories/ReviewRepository";
import { TrailRepository } from "@/src/core/models/Trail/repositories/TrailRepository";

export const AdminRepo = AdminRepository(db);
export const ApplicationRepo = ApplicationRepository(db);
export const BusinessRepo = BusinessRepository(db);
export const LeadberboardRepo = LeaderboardRepository(db);
export const MountainRepo = MountainRepository(db);
export const NotificationRepo = NotificationRepository(db);
export const OfferRepo = OfferRepository(db);
export const CancellationRepo = CancellationRepository(db);
export const BookingRepo = BookingRepository(db);
export const GroupRepo = GroupRepository(db);
export const HikeRepo = HikeRepository(db);
export const RecommendationRepo = RecommendationRepository(db);
export const RescheduleRepo = RescheduleRepository(db);
export const ReviewRepo = ReviewRepository(db);
export const TrailRepo = TrailRepository(db);