import { db } from "@/src/core/config/Firebase";
import { createBooking } from "@/src/core/models/Booking/Ref_Booking";
import { BookingRepository } from "@/src/core/models/Booking/repositories/BookingRepository";
import { updateBookingOnCancellation } from "@/src/core/models/Booking/utils/Booking.utils";
import { createCancellationRequest } from "@/src/core/models/Cancellation/Cancellation";
import { Cancellation } from "@/src/core/models/Cancellation/interfaces/ICancellation";
import { CancellationRepository } from "@/src/core/models/Cancellation/repositories/CancellationRepository";
import { flagCancellationRequest } from "@/src/core/models/Cancellation/utils/Cancellation.utils";
import { createOffer } from "@/src/core/models/Offer/Offer";
import { OfferRepository } from "@/src/core/models/Offer/repositories/OfferRepository";
import { updateOfferOnCancellation } from "@/src/core/models/Offer/utils/Offer.utils";
import { collection, deleteDoc, doc } from "firebase/firestore";

const bookingRepo = BookingRepository(db);
const offerRepo = OfferRepository(db);
const cancellationRepo: ReturnType<typeof CancellationRepository> = CancellationRepository(db);

const ids = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type CleanupKey = {
    businessId: string;
    id: string;
};

type BookingCleanupKey = CleanupKey & {
    userId: string;
};

const created = {
    offers: [] as CleanupKey[],
    bookings: [] as BookingCleanupKey[],
    cancellations: [] as CleanupKey[],
};

const cleanup = async () => {
    const tasks = [
        ...created.offers.map(({ businessId, id }) =>
            deleteDoc(doc(collection(db, "businesses", businessId, "offers"), id)),
        ),
        ...created.bookings.map(({ userId, id }) =>
            deleteDoc(doc(collection(db, "users", userId, "bookings"), id)),
        ),
        ...created.cancellations.map(({ businessId, id }) =>
            deleteDoc(doc(collection(db, "businesses", businessId, "cancellations"), id)),
        ),
    ];

    await Promise.allSettled(tasks);
    created.offers = [];
    created.bookings = [];
    created.cancellations = [];
};

const createSeedOffer = async (businessId: string, reservedPax = 2) => {
    const offer = await offerRepo.write(
        createOffer({
            business: { id: businessId, name: "Test Business" },
            trail: { id: ids("trail"), name: "Test Trail" },
            reservedPax,
            minPax: 1,
            maxPax: 10,
            price: 1200,
            date: new Date(),
            endDate: new Date(),
            duration: "1D",
            description: "Test offer for cancellation flow",
            documents: [],
            inclusions: [],
            thingsToBring: [],
            reminders: [],
            schedule: [],
        }),
    );
    created.offers.push({ businessId, id: offer.id });
    return offer;
};

const createSeedBooking = async (params: {
    userId: string;
    businessId: string;
    offerId: string;
    status?: "paid" | "for-cancellation";
}) => {
    const booking = await bookingRepo.write(
        createBooking({
            status: params.status ?? "paid",
            offer: { id: params.offerId, price: 1200, date: new Date() },
            business: { id: params.businessId, name: "Test Business" },
            trail: { id: ids("trail"), name: "Test Trail" },
            user: {
                id: params.userId,
                username: `user-${params.userId}`,
                firstname: "User",
                lastname: "Tester",
                email: `${params.userId}@test.local`,
                phoneNumber: "09999999999",
                birthday: new Date("1990-01-01T00:00:00.000Z"),
            },
            emergencyContact: {
                name: "Emergency Contact",
                contactNumber: "09111111111",
            },
            documents: [],
            payment: [],
        }),
    );
    created.bookings.push({ userId: params.userId, businessId: params.businessId, id: booking.id });
    return booking;
};

const createPendingRequest = (params: {
    userId: string;
    bookingId: string;
    offerId: string;
    businessId: string;
    reason?: string;
    cancelledBy?: "user" | "admin";
}): Cancellation =>
    createCancellationRequest({
        userId: params.userId,
        bookingId: params.bookingId,
        offerId: params.offerId,
        businessId: params.businessId,
        reason: params.reason ?? "Change of plans",
        cancelledBy: params.cancelledBy ?? "user",
    });

describe("Cancellation feature E2E (real Firestore)", () => {
    afterEach(async () => {
        await cleanup();
    });

    it("stores a user cancellation request in Firestore with expected output", async () => {
        const businessId = ids("biz");
        const userId = ids("user");
        const offer = await createSeedOffer(businessId, 2);
        const booking = await createSeedBooking({ userId, businessId, offerId: offer.id, status: "for-cancellation" });

        const request = createPendingRequest({
            userId,
            bookingId: booking.id,
            offerId: offer.id,
            businessId,
            reason: "Weather concerns",
        });

        const saved = await cancellationRepo.write(businessId, request);
        created.cancellations.push({ businessId, id: saved.id });

        const fromDb = await cancellationRepo.fetchById(businessId, saved.id);

        expect(fromDb).not.toBeNull();
        expect(fromDb).toMatchObject({
            id: saved.id,
            userId,
            bookingId: booking.id,
            offerId: offer.id,
            businessId,
            reason: "Weather concerns",
            cancelledBy: "user",
            status: "pending",
        });
    });

    it("returns only the admin business cancellation requests", async () => {
        const businessA = ids("biz-a");
        const businessB = ids("biz-b");
        const userA = ids("user-a");
        const userB = ids("user-b");

        const offerA = await createSeedOffer(businessA, 3);
        const offerB = await createSeedOffer(businessB, 3);
        const bookingA = await createSeedBooking({ userId: userA, businessId: businessA, offerId: offerA.id });
        const bookingB = await createSeedBooking({ userId: userB, businessId: businessB, offerId: offerB.id });

        const reqA = await cancellationRepo.write(
            businessA,
            createPendingRequest({ userId: userA, bookingId: bookingA.id, offerId: offerA.id, businessId: businessA }),
        );
        const reqB = await cancellationRepo.write(
            businessB,
            createPendingRequest({ userId: userB, bookingId: bookingB.id, offerId: offerB.id, businessId: businessB }),
        );

        created.cancellations.push(
            { businessId: businessA, id: reqA.id },
            { businessId: businessB, id: reqB.id },
        );

        const businessARequests = await cancellationRepo.fetchByBusinessId(businessA);

        expect(businessARequests.length).toBeGreaterThan(0);
        expect(businessARequests.every((r) => r.businessId === businessA)).toBe(true);
        expect(businessARequests.some((r) => r.id === reqA.id)).toBe(true);
        expect(businessARequests.some((r) => r.id === reqB.id)).toBe(false);
    });

    it("approves a cancellation request and updates cancellation, booking, and offer in Firestore", async () => {
        const businessId = ids("biz");
        const userId = ids("user");
        const offer = await createSeedOffer(businessId, 2);
        const booking = await createSeedBooking({ userId, businessId, offerId: offer.id, status: "paid" });

        const pending = await cancellationRepo.write(
            businessId,
            createPendingRequest({
                userId,
                bookingId: booking.id,
                offerId: offer.id,
                businessId,
                reason: "Medical emergency",
            }),
        );
        created.cancellations.push({ businessId, id: pending.id });

        const fromDbBooking = await bookingRepo.fetchById(booking.id);
        const fromDbOffer = await offerRepo.fetch(offer.id);
        expect(fromDbBooking).not.toBeNull();
        expect(fromDbOffer).not.toBeNull();

        const updatedOffer = updateOfferOnCancellation(fromDbOffer!);
        const updatedBooking = updateBookingOnCancellation(fromDbBooking!, pending, true);
        const updatedCancellation = flagCancellationRequest(pending, true);

        await offerRepo.write(updatedOffer);
        await bookingRepo.write(updatedBooking);
        await cancellationRepo.write(businessId, updatedCancellation);

        const finalOffer = await offerRepo.fetch(offer.id);
        const finalBooking = await bookingRepo.fetchById(booking.id);
        const finalRequest = await cancellationRepo.fetchById(businessId, pending.id);

        expect(finalOffer?.reservedPax).toBe(1);
        expect(finalBooking?.status).toBe("refund");
        expect(finalBooking?.cancellationReason).toBe("Medical emergency");
        expect(finalRequest?.status).toBe("approved");
    });

    it("rejects a cancellation request with admin note and stores the rejection reason", async () => {
        const businessId = ids("biz");
        const userId = ids("user");
        const offer = await createSeedOffer(businessId, 2);
        const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

        const pending = await cancellationRepo.write(
            businessId,
            createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId }),
        );
        created.cancellations.push({ businessId, id: pending.id });

        const rejected = flagCancellationRequest(
            pending,
            false,
            "Booking is within non-refundable period per policy.",
        );
        await cancellationRepo.write(businessId, rejected);

        const fromDb = await cancellationRepo.fetchById(businessId, pending.id);

        expect(fromDb?.status).toBe("rejected");
        expect(fromDb?.adminNote).toBe("Booking is within non-refundable period per policy.");
    });

    it("allows the user to view pending, approved, and rejected cancellation request statuses", async () => {
        const businessId = ids("biz");
        const userId = ids("user");
        const offer = await createSeedOffer(businessId, 3);
        const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

        const pending = await cancellationRepo.write(
            businessId,
            createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId, reason: "Pending request" }),
        );
        const approved = await cancellationRepo.write(
            businessId,
            flagCancellationRequest(
                createPendingRequest({
                    userId,
                    bookingId: booking.id,
                    offerId: offer.id,
                    businessId,
                    reason: "Approved request",
                }),
                true,
            ),
        );
        const rejected = await cancellationRepo.write(
            businessId,
            flagCancellationRequest(
                createPendingRequest({
                    userId,
                    bookingId: booking.id,
                    offerId: offer.id,
                    businessId,
                    reason: "Rejected request",
                }),
                false,
                "Insufficient supporting documentation",
            ),
        );

        created.cancellations.push(
            { businessId, id: pending.id },
            { businessId, id: approved.id },
            { businessId, id: rejected.id },
        );

        const pendingStatus = await cancellationRepo.fetchById(businessId, pending.id);
        const approvedStatus = await cancellationRepo.fetchById(businessId, approved.id);
        const rejectedStatus = await cancellationRepo.fetchById(businessId, rejected.id);

        expect(pendingStatus?.status).toBe("pending");
        expect(approvedStatus?.status).toBe("approved");
        expect(rejectedStatus?.status).toBe("rejected");
    });

    it("does not allow cancellation when offer reservedPax is 0", async () => {
        const offer = await createSeedOffer(ids("biz"), 0);
        expect(() => updateOfferOnCancellation(offer)).toThrow(
            "Illegal cancellation due to reservedPax being less than or equal to zero.",
        );
    });

    it("allows only users to submit cancellation requests for their own bookings", async () => {
        const businessId = ids("biz");
        const bookingOwnerUserId = ids("owner");
        const otherUserId = ids("other-user");
        const offer = await createSeedOffer(businessId, 1);
        const booking = await createSeedBooking({ userId: bookingOwnerUserId, businessId, offerId: offer.id });

        const unauthorizedRequest = createPendingRequest({
            userId: otherUserId,
            bookingId: booking.id,
            offerId: offer.id,
            businessId,
            cancelledBy: "user",
        });

        await expect(cancellationRepo.write(businessId, unauthorizedRequest)).rejects.toThrow(
            "Only users can submit cancellation requests for their own bookings.",
        );
    });

    it("allows only business admins to approve or reject cancellations for their own business", async () => {
        const businessA = ids("biz-a");
        const businessB = ids("biz-b");
        const userId = ids("user");
        const offer = await createSeedOffer(businessA, 2);
        const booking = await createSeedBooking({ userId, businessId: businessA, offerId: offer.id });
        const request = await cancellationRepo.write(
            businessA,
            createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId: businessA }),
        );
        created.cancellations.push({ businessId: businessA, id: request.id });

        const unauthorizedApproved = flagCancellationRequest(request, true);

        await expect(cancellationRepo.write(businessB, unauthorizedApproved)).rejects.toThrow(
            "Only admins can approve or reject cancellation requests for bookings that belong to their business.",
        );
    });
});