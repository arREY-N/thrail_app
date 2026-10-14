// eslint-disable-next-line no-restricted-imports
import {
    locationConverter,
    newLocation,
} from "@/src/core/models/Location/Location";
import { GeoPoint, Timestamp } from "firebase/firestore";

describe("Location Model", () => {
    describe("newLocation Factory", () => {
        it("should initialize default location object", () => {
            const loc = newLocation();
            expect(loc.id).toBeUndefined();
            expect(loc.latitude).toBe(0);
            expect(loc.longitude).toBe(0);
            expect(loc.altitude).toBe(0);
            expect(loc.status).toBe("ACTIVE");
            expect(loc.timestamp).toBeInstanceOf(Date);
            expect(loc.hikerName).toBeUndefined();
        });

        it("should initialize custom partial location", () => {
            const customDate = new Date("2026-01-01T12:00:00Z");
            const loc = newLocation({
                id: "loc_123",
                latitude: 14.5995,
                longitude: 120.9842,
                altitude: 150,
                status: "GPS_SIGNAL_RESTORED",
                timestamp: customDate,
                hikerName: "John Doe",
            });

            expect(loc.id).toBe("loc_123");
            expect(loc.latitude).toBe(14.5995);
            expect(loc.longitude).toBe(120.9842);
            expect(loc.altitude).toBe(150);
            expect(loc.status).toBe("GPS_SIGNAL_RESTORED");
            expect(loc.timestamp).toEqual(customDate);
            expect(loc.hikerName).toBe("John Doe");
        });
    });

    describe("locationConverter", () => {
        it("should convert location model to Firestore DB structure", () => {
            const loc = newLocation({
                id: "loc_456",
                latitude: 14.1234,
                longitude: 121.5678,
                altitude: 320,
                status: "ACTIVE",
                timestamp: new Date("2026-05-10T08:00:00Z"),
                hikerName: "Jane Doe",
            });

            const dbData = locationConverter.toFirestore(loc) as any;

            expect(dbData.id).toBe("loc_456");
            expect(dbData.point).toBeInstanceOf(GeoPoint);
            expect(dbData.point.latitude).toBe(14.1234);
            expect(dbData.point.longitude).toBe(121.5678);
            expect(dbData.altitude).toBe(320);
            expect(dbData.status).toBe("ACTIVE");
            expect(dbData.hikerName).toBe("Jane Doe");
            expect(dbData.timestamp).toBeInstanceOf(Timestamp);
        });

        it("should convert Firestore snapshot to location model", () => {
            const mockSnapshot: any = {
                id: "loc_789",
                data: () => ({
                    point: new GeoPoint(15.1111, 120.2222),
                    altitude: 500,
                    status: "APP_BACKGROUNDED",
                    timestamp: Timestamp.fromDate(new Date("2026-06-01T10:00:00Z")),
                    hikerName: "Alex",
                }),
            };

            const loc = locationConverter.fromFirestore(mockSnapshot);

            expect(loc.id).toBe("loc_789");
            expect(loc.latitude).toBe(15.1111);
            expect(loc.longitude).toBe(120.2222);
            expect(loc.altitude).toBe(500);
            expect(loc.status).toBe("APP_BACKGROUNDED");
            expect(loc.hikerName).toBe("Alex");
            expect(loc.timestamp).toEqual(new Date("2026-06-01T10:00:00Z"));
        });
    });
});
