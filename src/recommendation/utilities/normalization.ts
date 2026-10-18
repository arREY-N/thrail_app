import { Hike } from "@/src/core/models/Hike/Hike";
import { Review } from "@/src/core/models/Review/Review";
import { toDate } from "@/src/core/utility/date";

/**
 * Safely normalizes raw hike data from Firestore or local cache.
 * Avoids strict creation validations in newHike (which throws on empty trail ID or missing booking ID).
 */
export function normalizeHike(raw: any): Hike {
    if (!raw) {
        return {
            id: "",
            hikeDate: new Date(),
            status: "unhiked",
            mode: "direct",
            distance: 0,
            duration: 0,
            elevation: 0,
            trail: { id: "diy", name: "DIY Hike / Custom Route", location: "" },
            user: { id: "", username: "", firstname: "", lastname: "", email: "" },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }

    const trail = raw.trail || {};
    const user = raw.user || {};

    return {
        ...raw,
        id: raw.id || "",
        trail: {
            id: trail.id || "diy",
            name: trail.name || "DIY Hike / Custom Route",
            location: trail.location || "",
        },
        user: {
            id: user.id || "",
            username: user.username || "",
            firstname: user.firstname || "",
            lastname: user.lastname || "",
            email: user.email || "",
        },
        status: raw.status || "unhiked",
        mode: raw.mode || "direct",
        bookingId: raw.bookingId,
        distance: typeof raw.distance === "number" ? raw.distance : 0,
        duration: typeof raw.duration === "number" ? raw.duration : 0,
        elevation: typeof raw.elevation === "number" ? raw.elevation : 0,
        hikeDate: toDate(raw.hikeDate),
        startTime: raw.startTime ? toDate(raw.startTime) : undefined,
        endTime: raw.endTime ? toDate(raw.endTime) : undefined,
        createdAt: toDate(raw.createdAt),
        updatedAt: toDate(raw.updatedAt),
    };
}

/**
 * Safely normalizes raw review data from Firestore or local cache.
 * Normalizes all date fields and provides safe fallbacks for missing properties.
 */
export function normalizeReview(raw: any): Review {
    if (!raw) {
        return {
            id: "",
            createdAt: new Date(),
            updatedAt: new Date(),
            hikeDate: new Date(),
            user: { id: "", username: "", firstname: "", lastname: "", email: "" },
            likes: [],
            trail: { id: "", name: "", location: "" },
            overallRating: 0,
            trailMaintenance: "Easy",
            difficultyFactors: [],
            favoredFactors: [],
            review: "",
            image: [],
            predictedDifficulty: "Easy",
            perceivedDifficulty: "undefined",
            distance: 0,
            duration: 0,
            elevation: 0,
            status: "unhiked",
            mode: "direct",
        };
    }

    const trail = raw.trail || {};
    const user = raw.user || {};

    return {
        ...raw,
        id: raw.id || "",
        createdAt: toDate(raw.createdAt),
        updatedAt: toDate(raw.updatedAt),
        hikeDate: toDate(raw.hikeDate),
        startTime: raw.startTime ? toDate(raw.startTime) : undefined,
        endTime: raw.endTime ? toDate(raw.endTime) : undefined,
        user: {
            id: user.id || "",
            username: user.username || "",
            firstname: user.firstname || "",
            lastname: user.lastname || "",
            email: user.email || "",
        },
        likes: Array.isArray(raw.likes) ? raw.likes : [],
        trail: {
            id: trail.id || "",
            name: trail.name || "Unnamed Trail",
            location: trail.location || "",
        },
        overallRating: typeof raw.overallRating === "number" ? raw.overallRating : 0,
        trailMaintenance: raw.trailMaintenance || "Easy",
        difficultyFactors: Array.isArray(raw.difficultyFactors) ? raw.difficultyFactors : [],
        favoredFactors: Array.isArray(raw.favoredFactors) ? raw.favoredFactors : [],
        review: raw.review || "",
        image: Array.isArray(raw.image) ? raw.image : [],
        predictedDifficulty: raw.predictedDifficulty || "Easy",
        perceivedDifficulty: raw.perceivedDifficulty || "undefined",
        distance: typeof raw.distance === "number" ? raw.distance : 0,
        duration: typeof raw.duration === "number" ? raw.duration : 0,
        elevation: typeof raw.elevation === "number" ? raw.elevation : 0,
        status: raw.status || "unhiked",
        mode: raw.mode || "direct",
    };
}
