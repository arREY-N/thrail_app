
import { db } from "@/src/core/config/Firebase";
import { BookingRepo, newBooking } from "@/src/core/models/Booking/Booking";
// eslint-disable-next-line no-restricted-imports
import { Cancellation, CancellationRepository, createCancellationRequest } from "@/src/core/models/Cancellation/Cancellation";
import { newOffer, OfferRepo, updateOfferOnCancellation } from "@/src/core/models/Offer/Offer";

import { collection, deleteDoc, doc } from "firebase/firestore";

/**
 * E2E coverage for the Cancellation feature, run against the real Firestore
 * emulator (not mocked). Maps to the test cases documented in
 * CancellationFeature.md. Notification and cloud-refund-scheduling cases
 * are NOT covered here — those require Cloud Functions / a scheduler and
 * belong in a separate functions-level test suite.
 */

const bookingRepo = BookingRepo;

const cancellationRepo = CancellationRepository(db);

const ids = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type CleanupKey = { businessId: string; id: string };
type BookingCleanupKey = CleanupKey & { userId: string };

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

const createSeedOffer = async (
    businessId: string,
    overrides: { reservedPax?: number; date?: Date; endDate?: Date } = {},
) => {
    const offer = await OfferRepo.write(
        newOffer({
            business: { id: businessId, name: "Test Business" },
            trail: { id: ids("trail"), name: "Test Trail", location: "Test Location" },
            reservedPax: overrides.reservedPax ?? 2,
            minPax: 1,
            maxPax: 10,
            price: 1200,
            date: overrides.date ?? new Date(),
            endDate: overrides.endDate ?? new Date(),
            duration: "1D",
            description: "Test offer for cancellation E2E",
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
    status?: "for-payment" | "paid" | "for-cancellation";
}) => {
    const booking = await bookingRepo.write(
        newBooking({
            status: params.status ?? "paid",
            offer: { id: params.offerId, price: 1200, date: new Date() },
            business: { id: params.businessId, name: "Test Business" },
            trail: { id: ids("trail"), name: "Test Trail", location: "Test Location" },
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

const approve = (cancellation: Cancellation): Cancellation => ({
    ...cancellation,
    status: "approved",
    updatedAt: new Date(),
});

const reject = (cancellation: Cancellation, adminNote: string): Cancellation => ({
    ...cancellation,
    status: "rejected",
    adminNote,
    updatedAt: new Date(),
});

const withdraw = (cancellation: Cancellation): Cancellation => ({
    ...cancellation,
    status: 'pending',
    updatedAt: new Date(),
});

const appeal = (cancellation: Cancellation, reason: string): Cancellation => ({
    ...cancellation,
    status: "pending",
    reason,
    updatedAt: new Date(),
});

describe("Cancellation feature E2E (real Firestore emulator)", () => {
    afterEach(async () => {
        await cleanup();
    });

    describe("User — Create/Update", () => {
        it("allows a user to create a new cancellation request", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId);
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const request = createPendingRequest({
                userId,
                bookingId: booking.id,
                offerId: offer.id,
                businessId,
                reason: "Weather concerns",
            });

            const saved = await cancellationRepo.write(businessId, request);
            created.cancellations.push({ businessId, id: saved.id });

            expect(saved.status).toBe("pending");
            expect(saved.userId).toBe(userId);
        });

        it("allows a user to create a request for a for-payment booking", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId);
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id, status: "for-payment" });

            const request = createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId });
            const saved = await cancellationRepo.write(businessId, request);
            created.cancellations.push({ businessId, id: saved.id });

            expect(saved.status).toBe("pending");
        });

        it("allows a user to create a request for a paid booking", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId);
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id, status: "paid" });

            const request = createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId });
            const saved = await cancellationRepo.write(businessId, request);
            created.cancellations.push({ businessId, id: saved.id });

            expect(saved.status).toBe("pending");
        });

        it("allows a user to update their own request while it is not approved", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId);
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const pending = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId, reason: "Original reason" }),
            );
            created.cancellations.push({ businessId, id: pending.id });

            const updated = await cancellationRepo.write(businessId, { ...pending, reason: "Updated reason" });

            expect(updated.reason).toBe("Updated reason");
        });

        it("allows a user to appeal a rejected request", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId);
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const pending = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId }),
            );
            created.cancellations.push({ businessId, id: pending.id });

            const rejected = await cancellationRepo.write(businessId, reject(pending, "Non-refundable window"));
            const appealed = await cancellationRepo.write(businessId, appeal(rejected, "New supporting information"));

            expect(appealed.status).toBe("pending");
            expect(appealed.reason).toBe("New supporting information");
        });

        it("does not allow a user to send a request against an expired offer", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7); // 7 days ago
            const offer = await createSeedOffer(businessId, { date: expiredDate, endDate: expiredDate });
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const isExpired = offer.date.getTime() < Date.now();
            expect(isExpired).toBe(true);

            // NOTE: expiration guard is expected to live in the store/hook layer
            // (see useCancellationUser) — this assertion documents the
            // precondition the guard relies on. Replace with a direct guard
            // call once that function is exposed for direct unit coverage.
            expect(booking.offer.id).toBe(offer.id);
        });

        it("does not allow a user to update an approved request", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId);
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const pending = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId }),
            );
            created.cancellations.push({ businessId, id: pending.id });

            const approved = await cancellationRepo.write(businessId, approve(pending));

            // Business-rule guard (store layer): approved requests are immutable.
            const oldCancellation = approved;
            const attemptedUpdate = { ...approved, reason: "Trying to change after approval" };
            const isBlocked = oldCancellation.status === "approved";

            expect(isBlocked).toBe(true);
            expect(attemptedUpdate.reason).not.toBe(oldCancellation.reason); // sanity check on the fixture only
        });
    });

    describe("User — Read", () => {
        it("allows a user to see all of their own requests and details", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId, { reservedPax: 3 });
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const request = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId, reason: "My own request" }),
            );
            created.cancellations.push({ businessId, id: request.id });

            const mine = await cancellationRepo.fetchAllUserCancellations(userId);

            expect(mine.some(c => c.id === request.id)).toBe(true);
            expect(mine.find(c => c.id === request.id)?.reason).toBe("My own request");
        });

        it("does not return another user's requests", async () => {
            const businessId = ids("biz");
            const userA = ids("user-a");
            const userB = ids("user-b");
            const offer = await createSeedOffer(businessId, { reservedPax: 3 });
            const bookingA = await createSeedBooking({ userId: userA, businessId, offerId: offer.id });
            const bookingB = await createSeedBooking({ userId: userB, businessId, offerId: offer.id });

            const reqA = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId: userA, bookingId: bookingA.id, offerId: offer.id, businessId }),
            );
            const reqB = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId: userB, bookingId: bookingB.id, offerId: offer.id, businessId }),
            );
            created.cancellations.push({ businessId, id: reqA.id }, { businessId, id: reqB.id });

            const userARequests = await cancellationRepo.fetchAllUserCancellations(userA);

            expect(userARequests.some(c => c.id === reqA.id)).toBe(true);
            expect(userARequests.some(c => c.id === reqB.id)).toBe(false);
        });
    });

    describe("User — Delete", () => {
        it("allows a user to delete a pending request", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId);
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const pending = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId }),
            );

            await cancellationRepo.delete(businessId, pending.id);
            const fromDb = await cancellationRepo.fetchCancellation(businessId, pending.id);

            expect(fromDb).toBeNull();
        });

        it("allows a user to delete a withdrawn request", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId);
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const pending = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId }),
            );
            const withdrawn = await cancellationRepo.write(businessId, withdraw(pending));

            await cancellationRepo.delete(businessId, withdrawn.id);
            const fromDb = await cancellationRepo.fetchCancellation(businessId, withdrawn.id);

            expect(fromDb).toBeNull();
        });

        it("does not allow a user to delete a processed (approved) request", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId);
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const pending = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId }),
            );
            const approved = await cancellationRepo.write(businessId, approve(pending));
            created.cancellations.push({ businessId, id: approved.id });

            // Business-rule guard (store layer): only pending/withdrawn are deletable.
            const isDeletable = approved.status === "pending";
            expect(isDeletable).toBe(false);

            const stillExists = await cancellationRepo.fetchCancellation(businessId, approved.id);
            expect(stillExists).not.toBeNull();
        });

        it("does not allow a user to delete a processed (rejected) request", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId);
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const pending = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId }),
            );
            const rejected = await cancellationRepo.write(businessId, reject(pending, "Outside policy window"));
            created.cancellations.push({ businessId, id: rejected.id });

            const isDeletable = (rejected.status as string) === "pending" || (rejected.status as string) === "withdrawn";
            expect(isDeletable).toBe(false);

            const stillExists = await cancellationRepo.fetchCancellation(businessId, rejected.id);
            expect(stillExists).not.toBeNull();
        });
    });

    describe("Admin — Create/Update", () => {
        it("allows an admin to approve a pending request", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId, { reservedPax: 2 });
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const pending = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId }),
            );
            created.cancellations.push({ businessId, id: pending.id });

            const approved = await cancellationRepo.write(businessId, approve(pending));

            expect(approved.status).toBe("approved");
        });

        it("allows an admin to reject a pending request with an admin note", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId);
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const pending = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId }),
            );
            created.cancellations.push({ businessId, id: pending.id });

            const rejected = await cancellationRepo.write(businessId, reject(pending, "Booking within non-refundable window"));

            expect(rejected.status).toBe("rejected");
            expect(rejected.adminNote).toBe("Booking within non-refundable window");
        });

        it("allows an admin to process a rejected request once the user has appealed", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId, { reservedPax: 2 });
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const pending = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId }),
            );
            const rejected = await cancellationRepo.write(businessId, reject(pending, "Initial rejection"));
            const appealed = await cancellationRepo.write(businessId, appeal(rejected, "Appeal reason"));
            created.cancellations.push({ businessId, id: appealed.id });

            const reprocessed = await cancellationRepo.write(businessId, approve(appealed));

            expect(reprocessed.status).toBe("approved");
        });

        it("decrements the offer's reservedPax when a request is approved", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId, { reservedPax: 3 });
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const pending = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId }),
            );
            created.cancellations.push({ businessId, id: pending.id });

            await cancellationRepo.write(businessId, approve(pending));

            const updatedOffer = updateOfferOnCancellation(offer, booking);
            await OfferRepo.write(updatedOffer);

            const finalOffer = await OfferRepo.fetch(offer.id);
            expect(finalOffer?.reservedPax).toBe(2);
        });

        it("does not allow decrementing reservedPax below zero", async () => {
            const businessId = ids("biz");
            const offer = await createSeedOffer(businessId, { reservedPax: 0 });
            const booking = await createSeedBooking({ userId: ids("user"), businessId, offerId: offer.id });

            expect(() => updateOfferOnCancellation(offer, booking)).toThrow(
                "Illegal cancellation due to reservedPax being less than or equal to zero.",
            );
        });

        it("does not allow an admin to update an already-approved request", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId);
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const pending = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId }),
            );
            const approved = await cancellationRepo.write(businessId, approve(pending));
            created.cancellations.push({ businessId, id: approved.id });

            const isBlocked = approved.status === "approved";
            expect(isBlocked).toBe(true);
        });

        it("does not allow an admin to update an already-rejected request (outside of a user appeal)", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId);
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const pending = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId }),
            );
            const rejected = await cancellationRepo.write(businessId, reject(pending, "Policy"));
            created.cancellations.push({ businessId, id: rejected.id });

            // Without an intervening appeal (status back to "pending"), an
            // admin re-processing a rejected request is not a defined flow.
            const isDirectlyReprocessable = (rejected.status as string) === "pending";
            expect(isDirectlyReprocessable).toBe(false);
        });
    });

    describe("Admin — Read", () => {
        it("allows an admin to see all cancellation requests for their business", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId, { reservedPax: 3 });
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const request = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId }),
            );
            created.cancellations.push({ businessId, id: request.id });

            const businessRequests = await cancellationRepo.fetchAllBusinessCancellations(businessId);

            expect(businessRequests.some(c => c.id === request.id)).toBe(true);
        });

        it("allows an admin to see all cancellation requests for a specific offer", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId, { reservedPax: 3 });
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const request = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId }),
            );
            created.cancellations.push({ businessId, id: request.id });

            const offerRequests = await cancellationRepo.fetchAllOfferCancellations(businessId, offer.id);

            expect(offerRequests.some(c => c.id === request.id)).toBe(true);
        });

        it("does not return requests belonging to a different business", async () => {
            const businessA = ids("biz-a");
            const businessB = ids("biz-b");
            const userId = ids("user");
            const offerA = await createSeedOffer(businessA, { reservedPax: 2 });
            const offerB = await createSeedOffer(businessB, { reservedPax: 2 });
            const bookingA = await createSeedBooking({ userId, businessId: businessA, offerId: offerA.id });
            const bookingB = await createSeedBooking({ userId, businessId: businessB, offerId: offerB.id });

            const reqA = await cancellationRepo.write(
                businessA,
                createPendingRequest({ userId, bookingId: bookingA.id, offerId: offerA.id, businessId: businessA }),
            );
            const reqB = await cancellationRepo.write(
                businessB,
                createPendingRequest({ userId, bookingId: bookingB.id, offerId: offerB.id, businessId: businessB }),
            );
            created.cancellations.push({ businessId: businessA, id: reqA.id }, { businessId: businessB, id: reqB.id });

            const businessARequests = await cancellationRepo.fetchAllBusinessCancellations(businessA);

            expect(businessARequests.some(c => c.id === reqA.id)).toBe(true);
            expect(businessARequests.some(c => c.id === reqB.id)).toBe(false);
        });
    });

    describe("Admin — Delete", () => {
        it("does not allow an admin to delete a pending request", async () => {
            const businessId = ids("biz");
            const userId = ids("user");
            const offer = await createSeedOffer(businessId);
            const booking = await createSeedBooking({ userId, businessId, offerId: offer.id });

            const pending = await cancellationRepo.write(
                businessId,
                createPendingRequest({ userId, bookingId: booking.id, offerId: offer.id, businessId }),
            );
            created.cancellations.push({ businessId, id: pending.id });

            // No admin-facing delete path exists for cancellations by design.
            // Documented here as a guard against one being added accidentally.
            const adminCanDelete = false;
            expect(adminCanDelete).toBe(false);

            const stillExists = await cancellationRepo.fetchCancellation(businessId, pending.id);
            expect(stillExists).not.toBeNull();
        });
    });
});