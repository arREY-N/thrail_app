import { User } from "@/src/core/models/User/User";

export const superadminUser = new User({
	id: "u7OWc0dsV7oVXYxiYCMpOWraioVS",
	username: "superadmin",
	firstname: "Super",
	lastname: "Admin",
	email: "superadmin@thrail.com",
	role: "superadmin",
	createdAt: new Date("2026-01-01T00:00:00.000Z"),
	updatedAt: new Date("2026-03-10T00:00:00.000Z"),
	birthday: new Date("1990-01-01T00:00:00.000Z"),
	phoneNumber: "+639171110000",
	address: "Baguio City",
	onBoardingComplete: true,
});

export const reviewUsers: User[] = [
	new User({
		id: "user_review_001",
		username: "hiker_ella",
		firstname: "Ella",
		lastname: "Martinez",
		email: "ella.martinez@example.com",
	}),
	new User({
		id: "user_review_002",
		username: "summit_jay",
		firstname: "Jay",
		lastname: "Ramos",
		email: "jay.ramos@example.com",
	}),
	new User({
		id: "user_review_003",
		username: "trail_ina",
		firstname: "Ina",
		lastname: "Villanueva",
		email: "ina.villanueva@example.com",
	}),
	new User({
		id: "user_review_004",
		username: "ridge_noel",
		firstname: "Noel",
		lastname: "Garcia",
		email: "noel.garcia@example.com",
	}),
	new User({
		id: "user_review_005",
		username: "peak_mika",
		firstname: "Mika",
		lastname: "Reyes",
		email: "mika.reyes@example.com",
	}),
	new User({
		id: "user_review_006",
		username: "wander_tj",
		firstname: "TJ",
		lastname: "Delos Santos",
		email: "tj.delossantos@example.com",
	}),
	new User({
		id: "user_review_007",
		username: "camp_zoe",
		firstname: "Zoe",
		lastname: "Navarro",
		email: "zoe.navarro@example.com",
	}),
	new User({
		id: "user_review_008",
		username: "climb_ian",
		firstname: "Ian",
		lastname: "Soriano",
		email: "ian.soriano@example.com",
	}),
	new User({
		id: "user_review_009",
		username: "forest_lia",
		firstname: "Lia",
		lastname: "Fernandez",
		email: "lia.fernandez@example.com",
	}),
	new User({
		id: "user_review_010",
		username: "altitude_pat",
		firstname: "Pat",
		lastname: "Aquino",
		email: "pat.aquino@example.com",
	}),
];

export const dummyUsers: User[] = [superadminUser, ...reviewUsers];
