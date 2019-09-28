import {DataSetDataCourse, IDataRowCourse} from "./DataSetDataCourse";
import {InsightError, ResultTooLargeError} from "./controller/IInsightFacade";
import {CompOperators, LogicalOperators, Query} from "./Query";
import {DataSet} from "./DataSet";
import {BasicLogic, ComplexLogic, LogicElement, NotLogic} from "./Logic";

export class QueryParser {
    private queryResult: object[] = [];
    private candidate: IDataRowCourse[] = [];
    public query: Query;
    public database: DataSetDataCourse;

    constructor(query: Query, database: DataSetDataCourse) {
        this.query = query;
        this.database = database;
    }
 //   private static DatasetID: string;

    public getQueryResult(query: any): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            this.candidate = this.findCandidate(this.query.Locgic);
            if (this.candidate.length > 5000) {
                reject(new ResultTooLargeError("Result of this query exceeds maximum length"));
            } else {
                this.queryResult = this.selectFieldandOrder(this.candidate, query["OPTIONS"]);
                resolve(this.queryResult);
                }
            }
        );
    }

    private findCandidate(logic: LogicElement): IDataRowCourse[] {
        let operator: string = null;
        if (logic instanceof BasicLogic) {
            let result: any = this.database.getData(logic.key,
                logic.comp, logic.value, false);
            return !(result instanceof InsightError) ? result : [];
        } else if (logic instanceof ComplexLogic) {
            let result: IDataRowCourse[] = [];
            switch (logic.logicalOperator) {
                case LogicalOperators.AND:
                    result = this.database.getAllData();
                    for (let obj of logic.elements) { result = this.findIntersection(result, this.findCandidate(obj)); }
                    return result;
                case LogicalOperators.OR:
                    for (let obj of logic.elements) { result = this.findUnion(result, this.findCandidate(obj)); }
                    return result;
            }
        } else if (logic instanceof NotLogic) {
            return this.findComplement(this.findCandidate(logic.element), this.database.getAllData());
        }
    }

    private selectFieldandOrder(candidateResult: IDataRowCourse[], queryOptions: any): object[] {
        let result = [];
        if (queryOptions.hasOwnProperty("COLUMNS")) {
            const column: string[] = queryOptions["COLUMNS"];
            const databaseID = column[0].split("_")[0];
            for ( let i = 0; i < column.length; i++) {
                column[i] = column[i].split("_")[1];
            }
            for (let candidate of candidateResult) {
                for (let property of Object.keys(candidate)) {
                    if (! (column.includes(property))) {
                        delete candidate[property];
                    }
                }
                let obj: any = {};
                for (let i of Object.keys(candidate)) {
                    obj[databaseID + "_" + i] = candidate[i];
                }
                this.queryResult.push(obj);
            }
        }
        if (queryOptions.hasOwnProperty("ORDER")) {
            this.orderBy(this.queryResult, queryOptions["ORDER"]);
        }
        return this.queryResult;
    }

    private findIntersection(array1: IDataRowCourse[], array2: IDataRowCourse[]): IDataRowCourse[] {
        let result: IDataRowCourse[] = [];
        for (let course of array1) {
            if (this.findCourse(array2, course)) { result.push(course); }
        }
        return result;
    }

    private findCourse( array2: IDataRowCourse[], course: IDataRowCourse): boolean {
        for (let course2 of array2) {
            if (course2.uuid === course.uuid) {
                return true;
            }
        }
        return false;
    }

    private findUnion(array1: IDataRowCourse[], array2: IDataRowCourse[]): IDataRowCourse[] {
        let result: IDataRowCourse[] = array1;
        for (let course of array2) {
            if (!this.findCourse(array1, course)) { result.push(course); }
        }
        return result;
    }

    private findComplement(array1: IDataRowCourse[], all: IDataRowCourse[]): IDataRowCourse[] {
        let result: IDataRowCourse[] = [];
        for (let course of all) {
            if (!this.findCourse(array1, course)) { result.push(course); }
        }
        return result;
    }

    // By default, will order in ascending order.
    private orderBy(queryResult: object[], orderKey: string) {
        if (orderKey === "courses_avg" || orderKey === "courses_pass" || orderKey === "courses_fail"
            || orderKey === "courses_audit" || orderKey === "courses_year") {
            queryResult.sort(function (a: any, b: any) {
                return a[orderKey] - b[orderKey];
            });
        } else if (orderKey === "courses_dept" || orderKey === "courses_instructor" || orderKey === "courses_title") {
            queryResult.sort(function (a: any, b: any) {
                if (a[orderKey].toLowerCase() < b[orderKey].toLowerCase()) {
                    return -1;
                } else if (a[orderKey].toLowerCase() > b[orderKey].toLowerCase()) {
                    return 1;
                } else {
                    return 0;
                }
            });
        } else if (orderKey === "courses_id" || orderKey === "courses_uuid") {
            queryResult.sort(function (a: any, b: any) {
                return Number(a[orderKey]) - Number(b[orderKey]);
            });
        }
    }
}

// public static getQueryResult(query: any): Promise<any[]> {
//     return new Promise<any[]>((resolve, reject) => {
            // let temp = Query.getDataSetFromQuery(query);
            // let insightFacade: InsightFacade;
            // if (typeof temp === "string") {
            //     this.DatasetID = temp;
            // }
            // return insightFacade.switchDataSet(this.DatasetID).then((result) => {
            // this.candidate = this.findCandidate(query["WHERE"]);
            // if (this.candidate.length > 5000) {
            //     reject(new ResultTooLargeError("Result of this query exceeds maximum length"));
            // } else {
            //     this.queryResult = this.selectFieldandOrder(this.candidate, query["OPTIONS"]);
            //     resolve(this.queryResult);
            // }
            // }).catch((err) => {
            //     reject(new InsightError("Reference non-exist dataset"));
//             });
//         }
//     );
// }
