import {SchedSection} from "./IScheduler";

export class CourseInfo {
    /**
     * Get the registration of a section
     * @param course The section to query.
     */
    public static getRegisterCount(course: SchedSection): number {
        return course.courses_pass + course.courses_fail + course.courses_audit;
    }

    /**
     * Get the Course ID of a section.
     * @param course
     */
    public static getSectionNumber(course: SchedSection): string {
        return course.courses_dept + course.courses_id;
    }
}
