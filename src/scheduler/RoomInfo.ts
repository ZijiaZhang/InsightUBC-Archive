import {SchedRoom, SchedSection} from "./IScheduler";
import {CourseInfo} from "./CourseInfo";


export class RoomInfo {
    public static getRoomid(room: SchedRoom) {
        return room.rooms_fullname;
    }

    public static getRoomLocationId(room: SchedRoom) {
        return room.rooms_lon + "_" + room.rooms_lat;
    }

    public static enoughRoomForCourse(room: SchedRoom, course: SchedSection): boolean {
        return room.rooms_seats >= CourseInfo.getRegisterCount(course);
    }
}
