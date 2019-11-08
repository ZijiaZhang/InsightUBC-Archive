import {SchedRoom, SchedSection} from "./IScheduler";
import {CourseInfo} from "./CourseInfo";
import {RoomInfo} from "./RoomInfo";
import Log from "../Util";

export class Sorter {
    /**
     * Use radix sort for sections.
     * @param list The list of sections
     * Assume The number of regestration is small.
     */
    public static RadixSortSection(list: SchedSection[]): SchedSection[] {
        for (let i = 1; i < 5; i++) {
            let arr: SchedSection[][] = [[], [], [], [], [], [], [], [], [], []];
            for (let j of list) {
                arr[9 - (Math.floor(CourseInfo.getRegisterCount(j) % 10 ** i / 10 ** (i - 1)))].push(j);
            }
            list = [];
            for (let l of arr) {
                list = list.concat(l);
            }
        }
        return list;
    }

    // public static RadixSortRoom(list: SchedRoom[]): SchedRoom[] {
    //     for (let i = 1; i < 5; i++) {
    //         let arr: SchedRoom[][] = [[], [], [], [], [], [], [], [], [], []];
    //         for (let j of list) {
    //             arr[9 - (Math.floor(j.rooms_seats % 10 ** i / 10 ** (i - 1)))].push(j);
    //         }
    //         list = [];
    //         for (let l of arr) {
    //             list = list.concat(l);
    //         }
    //     }
    //     return list;
    // }

    /**
     * Sort the Room base on the score
     * @param list Rooms
     * @param roomScore The Score of each room
     */
    public static RadixSortRoombyScore(list: SchedRoom[], roomScore: {[key: string]: number}): SchedRoom[] {
        for (let i = 1; i < 8; i++) {
            let arr: SchedRoom[][] = [[], [], [], [], [], [], [], [], [], []];
            for (let j of list) {
                arr[9 - (Math.floor(roomScore[RoomInfo.getRoomid(j)] % 10 ** i / 10 ** (i - 1)))].push(j);
            }
            list = [];
            for (let l of arr) {
                list = list.concat(l);
            }
        }
        return list;
    }
}
