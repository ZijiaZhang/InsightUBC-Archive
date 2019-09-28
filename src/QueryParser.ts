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
               let result = this.findCandidate(this.query.Locgic);
               if (result instanceof Array) {
                    this.queryResult = this.selectFieldandOrder(result, query["OPTIONS"]);
                    resolve(this.queryResult);
                } else {
                   reject(result);
               }
            }
        );
    }

    private findCandidate(Locgic: LogicElement): IDataRowCourse[]| ResultTooLargeError {
        let allResult = this.database.getAllData();
        if (Locgic == null) {
            if (allResult.length > 5000) {
                return new ResultTooLargeError("Result of this query exceeds maximum length");
            }
            return allResult;
        }
        let result = [];
        let size = 0;
        for (let course of allResult) {
            if (this.determineCandidate(Locgic, course)) {
                result.push(course);
                size++;
                if (size > 5000) {
                    return new ResultTooLargeError("Result of this query exceeds maximum length");
                }
            }
        }
        return result;
    }

    private determineCandidate(logic: LogicElement, course: IDataRowCourse): boolean {
        let operator: string = null;
        if (logic instanceof BasicLogic) {
            let compare;
            switch (logic.comp) {
                case CompOperators.EQ: compare = (x: any, y: any) => x === y; break;
                case CompOperators.GT: compare = (x: any, y: any) => x > y; break;
                case CompOperators.LT: compare = (x: any, y: any) => x < y; break;
                case CompOperators.IS:
                    compare = (x: any, y: any) => {
                        let value: string = x as string;
                        let match: string = y as string;
                        if (match === "*") {return true; }
                        if (match.startsWith("*") && match.endsWith("*")) {
                            let matchStr = match.substring(1, match.length - 1);
                            return value.indexOf(matchStr) !== -1;
                        } else if (match.startsWith("*")) {
                            return value.endsWith(match.substring(1));
                        } else if (match.endsWith("*")) {
                            return value.startsWith(match.substring(0, match.length - 1 ));
                        } else {
                            return value === match;
                        }
                    };
                    break;
            }
            return compare(course[logic.key], logic.value);
        } else if (logic instanceof ComplexLogic) {
            let result: boolean = false;
            switch (logic.logicalOperator) {
                case LogicalOperators.AND:
                    result = true;
                    for (let obj of logic.elements) {
                        result = result && this.determineCandidate(obj, course);
                    }
                    return result;
                case LogicalOperators.OR:
                    for (let obj of logic.elements) {
                        result = result || this.determineCandidate(obj, course);
                    }
                    return result;
            }
        } else if (logic instanceof NotLogic) {
            return !this.determineCandidate(logic.element, course);
        }
    }

    private selectFieldandOrder(candidateResult: IDataRowCourse[], queryOptions: any): object[] {
        let result = [];
        if (queryOptions.hasOwnProperty("COLUMNS")) {
            const column: string[] = queryOptions["COLUMNS"];
            const databaseID = column[0].split("_")[0];
            for (let i = 0; i < column.length; i++) {
                column[i] = column[i].split("_")[1];
            }
            for (let candidate of candidateResult) {
                for (let property of Object.keys(candidate)) {
                    if (!(column.includes(property))) {
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
