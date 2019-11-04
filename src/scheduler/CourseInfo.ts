import {SchedSection} from "./IScheduler";

export class CourseInfo {
    public static getRegisterCount(course: SchedSection): number {
        return course.courses_pass + course.courses_fail + course.courses_audit;
    }

    public static getSectionNumber(course: SchedSection): string {
        return course.courses_dept + course.courses_id;
    }
}
