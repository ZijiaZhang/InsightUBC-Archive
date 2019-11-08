import {SchedRoom} from "./IScheduler";

export interface GeoLocation {
    lon: number;
    lat: number;
}

export class GeoLocationInfo {
    /**
     * Calculate the Distance between 2 geo-locations.
     * @param l1 Location1
     * @param l2 Location2
     */
    // Copied from https://www.movable-type.co.uk/scripts/latlong.html
    public static lonLatToMetere(l1: GeoLocation, l2: GeoLocation): number {
        let R = 6371e3; // metres
        let φ1 = l1.lat * Math.PI / 180;
        let φ2 = l2.lat * Math.PI / 180;
        let Δφ = (l2.lat - l1.lat) * Math.PI / 180;
        let Δλ = (l2.lon - l1.lon) * Math.PI / 180;

        let a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        let d = R * c;
        return d;
    }

    /**
     * Translate the GeoLocation ID to GeoLocation
     * @param id
     */
    public static getGeoLocationFromId(id: string): GeoLocation {
        return {lon: parseFloat(id.split("_")[0]), lat: parseFloat(id.split("_")[1])};
    }
}
