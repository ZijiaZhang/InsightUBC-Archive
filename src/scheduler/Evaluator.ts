import {SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import {RoomInfo} from "./RoomInfo";
import {GeoLocation, GeoLocationInfo} from "./GeoLocation";
import {CourseInfo} from "./CourseInfo";
import Log from "../Util";

export class Evaluator {
    /**
     * Generate the score for each room, Higher the better
     * @param rooms All Rooms.
     */
    public static generateRoomScores(rooms: SchedRoom[]): { [key: string]: number } {
        let Geos: { [key: string]: number } = {};
        let Geos2: { [key: string]: number } = {};
        let Geos3: { [key: string]: number } = {};
        let ret: { [key: string]: number } = {};
        for (let room of rooms) {
            Geos[RoomInfo.getRoomLocationId(room)] =
                Geos[RoomInfo.getRoomLocationId(room)] ?
                    Geos[RoomInfo.getRoomLocationId(room)] + room.rooms_seats : room.rooms_seats;
            Geos2[RoomInfo.getRoomLocationId(room)] =
                Geos2[RoomInfo.getRoomLocationId(room)] ?
                    Math.max(Geos2[RoomInfo.getRoomLocationId(room)], room.rooms_seats) : room.rooms_seats;
            Geos3[RoomInfo.getRoomLocationId(room)] =
                Geos3[RoomInfo.getRoomLocationId(room)] ?
                    Geos3[RoomInfo.getRoomLocationId(room)] + 1 : 1;
        }

        for (let room of rooms) {
            let score = 0;
            let location = {lon: room.rooms_lon, lat: room.rooms_lat};
            for (let loc of Object.keys(Geos)) {
                score += (Math.log(room.rooms_seats) * Geos3[loc] + (Geos[loc])) *
                    2000 / (1 + GeoLocationInfo.lonLatToMetere(location, GeoLocationInfo.getGeoLocationFromId(loc)));
            }
            ret[RoomInfo.getRoomid(room)] = score;
        }
        return ret;
    }


    /**
     * Measure the score of a result.
     * @param result The result of a plan
     * @param total The total number of registration possible.
     */
    public static tempMeasure(result: Array<[SchedRoom, SchedSection, TimeSlot]>, total: number): number {
        let ret = 0;
        let Rooms: Set<SchedRoom> = new Set();
        let Geos: any = {};
        let roomTimeConflict = this.CountRoomTimeConfilct(result);
        let courseTimeConflict = this.CountCourseTimeConflict(result);
        let courseRoomConflict = this.CountRoomCourseConfilict(result);
        let invalidCount = roomTimeConflict + courseTimeConflict + courseRoomConflict;
        for (let elem of result) {
            let room: SchedRoom = elem[0];
            let section: SchedSection = elem[1];
            let time: TimeSlot = elem[2];
            Geos[room.rooms_lon + "_" + room.rooms_lat] =
                Geos[room.rooms_lon + "_" + room.rooms_lat] ?
                    Geos[room.rooms_lon + "_" + room.rooms_lat] + 1 : 1;
            Rooms.add(room);
            ret += CourseInfo.getRegisterCount(section);
        }
        let maxDistance = 0;
        for (let Geo1 of Object.keys(Geos)) {
            for (let Geo2 of Object.keys(Geos)) {
                let distance = GeoLocationInfo.lonLatToMetere(GeoLocationInfo.getGeoLocationFromId(Geo1),
                    GeoLocationInfo.getGeoLocationFromId(Geo2));
                if (distance > maxDistance) {
                    maxDistance = distance;
                }
            }
        }
        // Log.trace(invalidCount);
        return 0.7 * (ret / total) + 0.3 * (1 - maxDistance / 2000);
    }

    /**
     * Count number of Room-Time conflict.
     * @param result
     * @constructor
     */
    public static CountRoomTimeConfilct(result: Array<[SchedRoom, SchedSection, TimeSlot]>): number {
        let RoomTime = new Set();
        let invalidCount = 0;
        for (let elem of result) {
            let room: SchedRoom = elem[0];
            let section: SchedSection = elem[1];
            let time: TimeSlot = elem[2];
            if (RoomTime.has({room, time})) {
                invalidCount++;
            }
            RoomTime.add({room, time});
        }
        return invalidCount;
    }

    /**
     * Count number of Room-Course Conflict
     * @param result
     * @constructor
     */
    public static CountRoomCourseConfilict(result: Array<[SchedRoom, SchedSection, TimeSlot]>): number {
        let invalidCount = 0;
        for (let elem of result) {
            let room: SchedRoom = elem[0];
            let section: SchedSection = elem[1];
            let time: TimeSlot = elem[2];
            if (room.rooms_seats < CourseInfo.getRegisterCount(section)) {
                invalidCount++;
            }
        }
        return invalidCount;
    }

    /**
     * Count number of course time conflict.
     * @param result
     * @constructor
     */
    public static CountCourseTimeConflict(result: Array<[SchedRoom, SchedSection, TimeSlot]>): number {
        let invalidCount = 0;
        let courseTime: { [key: string]: TimeSlot[] } = {};
        for (let elem of result) {
            let room: SchedRoom = elem[0];
            let section: SchedSection = elem[1];
            let time: TimeSlot = elem[2];
            if (courseTime[section.courses_dept + section.courses_id] &&
                courseTime[section.courses_dept + section.courses_id].includes(time)) {
                invalidCount++;
            } else {
                if (!(courseTime[section.courses_dept + section.courses_id])) {
                    courseTime[section.courses_dept + section.courses_id] = [];
                }
                courseTime[section.courses_dept + section.courses_id].push(time);
            }
        }
        return invalidCount;
    }

    /**
     * Get total number of Enrollment Possible
     * @param scetions All sections.
     */
    public static getTotalPossibleEnrollment(scetions: SchedSection[]): number {
        let ret = 0;
        for (let section of scetions) {
            ret += CourseInfo.getRegisterCount(section);
        }
        return ret;
    }
}
