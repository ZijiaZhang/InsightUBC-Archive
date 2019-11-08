import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import {Sorter} from "./Sorter";
import {Evaluator} from "./Evaluator";
import {RoomInfo} from "./RoomInfo";
import {CourseInfo} from "./CourseInfo";
import Log from "../Util";

export default class Scheduler implements IScheduler {
    private readonly timeSlots: TimeSlot[] = [
        "MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
        "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
        "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
        "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
        "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        // TODO Implement this
        let ret: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        let sortedSextions = Sorter.RadixSortSection(sections);
        let RoomScores = Evaluator.generateRoomScores(rooms);
        let sortedRooms = Sorter.RadixSortRoombyScore(rooms, RoomScores);
        let RoomTime: { [key: string]: TimeSlot[] } = {};
        let sectionTime: { [key: string]: TimeSlot[] } = {};
        let total = 0;
        for (let r of sortedSextions) {
            total += CourseInfo.getRegisterCount(r);
        }
        for (let section of sortedSextions) {
            let placed = false;
            for (let room of sortedRooms) {
                if (placed) {
                    break;
                }
                if (!RoomTime[RoomInfo.getRoomid(room)]) {
                    RoomTime[RoomInfo.getRoomid(room)] = [];
                }
                if (!sectionTime[CourseInfo.getSectionNumber(section)]) {
                    sectionTime[CourseInfo.getSectionNumber(section)] = [];
                }
                if (!RoomInfo.enoughRoomForCourse(room, section)) {
                    continue;
                }
                for (let slot of this.timeSlots) {
                    if (placed) {
                        break;
                    }
                    if (!RoomTime[RoomInfo.getRoomid(room)].includes(slot) &&
                        !sectionTime[CourseInfo.getSectionNumber(section)].includes(slot)) {
                        ret.push([room, section, slot]);
                        RoomTime[RoomInfo.getRoomid(room)].push(slot);
                        sectionTime[CourseInfo.getSectionNumber(section)].push(slot);
                        placed = true;
                        break;
                    }
                }
            }
        }
        Log.trace(Evaluator.tempMeasure(ret, total));
        return ret;
    }
}
