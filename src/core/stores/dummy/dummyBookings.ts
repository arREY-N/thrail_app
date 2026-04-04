import { Booking } from "@/src/core/models/Booking/Booking";
import { dummyTrails, toTrailSummary } from "@/src/core/stores/dummy/dummyTrails";
import { superadminUser } from "@/src/core/stores/dummy/dummyUsers";

const superadminSummary = {
	id: superadminUser.id,
	username: superadminUser.username,
	firstname: superadminUser.firstname,
	lastname: superadminUser.lastname,
	email: superadminUser.email,
};

export const dummyBookings: Booking[] = [
	new Booking({
		id: "booking_sample_001",
		createdAt: new Date("2026-03-15T08:12:00.000Z"),
		updatedAt: new Date("2026-03-15T08:20:00.000Z"),
		status: "for-payment",
		offer: {
			date: new Date("2026-04-10T01:30:00.000Z"),
			price: 1899,
		},
		user: superadminSummary,
		business: {
			id: "biz_412",
			name: "Peakline Outdoor Co.",
		},
		trail: toTrailSummary(dummyTrails[0]),
		payment: [
			{
				id: "pay_001_a",
				date: new Date("2026-03-16T09:45:00.000Z"),
				amount: 900,
			},
		],
		emergencyContact: {
			name: "Alex Santos",
			contactNumber: "+639171110001",
		},
	}),
	new Booking({
		id: "booking_sample_002",
		createdAt: new Date("2026-03-09T04:05:00.000Z"),
		updatedAt: new Date("2026-03-10T14:36:00.000Z"),
		status: "paid",
		offer: {
			date: new Date("2026-04-21T23:00:00.000Z"),
			price: 2750,
		},
		user: superadminSummary,
		business: {
			id: "biz_297",
			name: "Northwind Trek Services",
		},
		trail: toTrailSummary(dummyTrails[1]),
		payment: [
			{
				id: "pay_002_a",
				date: new Date("2026-03-09T05:10:00.000Z"),
				amount: 1250,
			},
			{
				id: "pay_002_b",
				date: new Date("2026-03-10T14:30:00.000Z"),
				amount: 1500,
			},
		],
		emergencyContact: {
			name: "Jamie Cruz",
			contactNumber: "+639171110002",
		},
	}),
	new Booking({
		id: "booking_sample_003",
		createdAt: new Date("2026-02-27T11:50:00.000Z"),
		updatedAt: new Date("2026-03-01T06:40:00.000Z"),
		offer: {
			date: new Date("2026-04-03T00:15:00.000Z"),
			price: 2100,
		},
		user: superadminSummary,
		business: {
			id: "biz_533",
			name: "Cloudstep Adventures",
		},
		trail: toTrailSummary(dummyTrails[2]),
		payment: [
			{
				id: "pay_003_a",
				date: new Date("2026-02-28T03:05:00.000Z"),
				amount: 2100,
			},
		],
		emergencyContact: {
			name: "Morgan Lee",
			contactNumber: "+639171110003",
		},
	}),
];
