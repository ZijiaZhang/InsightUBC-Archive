import {IDataRowCourse} from "../../Datasets/DataSetDataCourse";
import Log from "../../Util";
import {InsightDatasetKind} from "../../controller/IInsightFacade";
import {IDataRow} from "../../Datasets/DataSet";

export class JsonParser {
    /**
     * returns the required fields in a course with {KeysInJson: KeysInDataRow}.
     */
    public static getRequiredFieldCourses(): {[FIELD: string]: string; } {
        return {
            Subject: "dept", // dept
            Course: "id",   // id
            Professor: "instructor", // instructor
            Title : "title",      // title
            id : "uuid",         // uuid
            Avg : "avg",        // avg
            Pass: "pass",       // pass
            Fail : "fail",       // fail
            Audit: "audit",      // audit
            Year : "year"      // year
        };
    }

    /**
     * returns the fields withType.
     */
    public static getFieldTypeCourse(): {[FIELD: string]: string; } {
        return {
            Subject: "string", // dept
            Course: "string",   // id
            Professor: "string", // instructor
            Title: "string",      // title
            id: "string",         // uuid
            Avg: "number",        // avg
            Pass: "number",       // pass
            Fail: "number",       // fail
            Audit: "number",      // audit
            Year: "number"      // year
        };
    }

    /**
     *
     * @param data a Json String that contains information of the courses.
     * @param dataType The dataType of the Data
     * Parse a Json object to a DataRow;
     * @return A list of DataRow
     */
    public static parseData(data: string, dataType: InsightDatasetKind): IDataRow[]|null {
        try {
            let rawData = JSON.parse(data);
            return this.jsonToDataRow(rawData, dataType);
        } catch (e) {
            Log.error(e);
            return null;
        }
    }

    /**
     *
     * @param jsonData an object contains JSON value
     *
     * @param dataType the Kind od the Database.
     * @return a list of DataRows. Data from the Json File
     *
     * returns null if there is no valid rows.
     */

    private static jsonToDataRow(jsonData: any, dataType: InsightDatasetKind): IDataRow[] {
        let resultArray: IDataRowCourse[] = [];
        if ("result" in jsonData) {
            for (let oneRow of jsonData.result) {
                let result = null;
                switch (dataType) {
                    case InsightDatasetKind.Courses:
                        result = this.jsonToOneRowCourse(oneRow);
                        break;
                }
                if (result != null) {
                    resultArray.push(result);
                }
            }
        } else {
            return null;
        }
        if (resultArray.length > 0) {
            return resultArray;
        } else {
            return null;
        }
    }

    /**
     *
     * @param jsonData an object contains JSON value
     *
     * @return a DataRow. Data from the Json File
     *
     * returns null if the row is invalid
     */

    private static jsonToOneRowCourse(jsonData: any): IDataRowCourse| null {
        let dataRow: IDataRowCourse = {dept: "",
        id: "",
        instructor: "",
        title: "",
        uuid: "",
        avg: 0,
        pass: 0,
        fail: 0,
        audit: 0,
        year: 0};
        if (!(this.jsonContainsAllField(jsonData, Object.keys(this.getFieldTypeCourse())))) {
            return null;
        }
        const typeMap = this.getFieldTypeCourse();
        for (let field in this.getRequiredFieldCourses()) {
            if (typeof(jsonData[field]) === typeMap[field]) {
                dataRow[this.getRequiredFieldCourses()[field]] = jsonData[field];
            } else if ( typeMap[field] === "number") {
                dataRow[this.getRequiredFieldCourses()[field]] = parseFloat(jsonData[field]);
            } else if ( typeMap[field] === "string") {
                dataRow[this.getRequiredFieldCourses()[field]] = "" + jsonData[field];
            }
        }

        if (jsonData.hasOwnProperty("Section") && jsonData["Section"] === "overall") {
            dataRow.year = 1900;
        }
        return dataRow;
    }

    /**
     *
     * @param jsonData the json data file.
     * @param fields the fields that if the json data contains.
     *
     * @return boolean
     * return True if all the field in the fields contains in jsonData, False otherwise.
     */
    private static jsonContainsAllField(jsonData: any, fields: string[]): boolean {
        for (let field of fields) {
            if (!(jsonData.hasOwnProperty(field))) {
                return false;
            }
        }
        return true;
    }

}
