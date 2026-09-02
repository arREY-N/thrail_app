import { logger } from "@/src/core/utility/errorFormatter";
import * as Location from "expo-location";

export const getReverseGeocode = async (lat: number, lng: number) => {
    logger('getReverseGeoCode', 'coordinates: ', { lat, lng });
    const [address] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
    });

    if (address) {
        const nameParts = [
            address.street || address.name,
        ].filter(Boolean);

        const locationParts = [
            address.city || address.subregion,
            address.region
        ].filter(Boolean);

        const name = nameParts.length > 0 ? nameParts.join(', ') : 'Location Unknown';
        const location = locationParts.length > 0 ? locationParts.join(', ') : 'Location Unknown';

        return { name, location };
    }

    throw new Error('Geocoding failed');

};