import {SchedRoom, SchedSection} from "./IScheduler";
import {CourseInfo} from "./CourseInfo";


export class RoomInfo {
    /**
     * Get the unique ID of the room.
     * @param room
     */
    public static getRoomid(room: SchedRoom) {
        return room.rooms_name;
    }

    /**
     * Get the Location ID
     * @param room
     */
    public static getRoomLocationId(room: SchedRoom) {
        return room.rooms_lon + "_" + room.rooms_lat;
    }

    /**
     * Determine if the Room is enough for the course.
     * @param room
     * @param course
     */
    public static enoughRoomForCourse(room: SchedRoom, course: SchedSection): boolean {
        return room.rooms_seats >= CourseInfo.getRegisterCount(course);
    }
}
