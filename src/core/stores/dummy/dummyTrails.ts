import { Trail } from "@/src/core/models/Trail/Trail";

export const dummyTrails: Trail[] = [
	new Trail({
		id: "trail_109",
		general: {
			name: "Mt. Luntian Ridge Loop",
			address: "Atok, Benguet",
			province: ["Benguet"],
			mountain: ["Mt. Luntian"],
			rating: 4.5,
			reviewCount: 124,
		},
	}),
	new Trail({
		id: "trail_244",
		general: {
			name: "Twin Falls Traverse",
			address: "Tanay, Rizal",
			province: ["Rizal"],
			mountain: ["Sierra Madre Section"],
			rating: 4.3,
			reviewCount: 96,
		},
	}),
	new Trail({
		id: "trail_078",
		general: {
			name: "Kalaw Cliffs Ascent",
			address: "Argao, Cebu",
			province: ["Cebu"],
			mountain: ["Kalaw Cliffs"],
			rating: 4.7,
			reviewCount: 88,
		},
	}),
];

export const toTrailSummary = (trail: Trail) => ({
	id: trail.id,
	name: trail.general.name,
});
