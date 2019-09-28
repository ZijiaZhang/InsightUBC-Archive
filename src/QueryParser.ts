import {DataSetDataCourse, IDataRowCourse} from "./DataSetDataCourse";
import {InsightError, ResultTooLargeError} from "./controller/IInsightFacade";
import {CompOperators, Query} from "./Query";

export class QueryParser {
    private queryResult: object[] = [];
    private candidate: IDataRowCourse[] = [];
 //   private static DatasetID: string;

    public getQueryResult(query: any): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            this.candidate = this.findCandidate(query["WHERE"], 0, 0);
            if (this.candidate.length > 5000) {
                reject(new ResultTooLargeError("Result of this query exceeds maximum length"));
            } else {
                this.queryResult = this.selectFieldandOrder(this.candidate, query["OPTIONS"]);
                resolve(this.queryResult);
                }
            }
        );
    }

    private findCandidate(queryBody: any, indexOfKeyVal: number, numberOfNot: number): IDataRowCourse[] {
        let query: Query = new Query();
        let protoResult: IDataRowCourse[] = [];
        let operator: string = null;
        if (Object.keys(queryBody).length !== 0) {
            operator = Object.keys(queryBody)[0];
        }
        // let indexOfKeyVal: number = 0;
        // let numberOfNot: number = 0;
        let datasetCourse: DataSetDataCourse = new DataSetDataCourse("courses");
        if (operator === null) {
            protoResult = protoResult.concat(datasetCourse.getAllCourses());
            this.candidate = this.candidate.concat(datasetCourse.getAllCourses());
        } else if (operator === "LT" || operator === "GT" || operator === "EQ" || operator === "IS") {
            if (numberOfNot % 2 === 0) {
                let result: any = datasetCourse.getData(query.getKey(operator, indexOfKeyVal),
                    CompOperators[operator], query.getVal(operator, indexOfKeyVal), false);
                if (!(result instanceof InsightError)) {
                    protoResult = protoResult.concat(result);
                    this.candidate = this.candidate.concat(result);
                }
            } else {
                let result: any = datasetCourse.getData(query.getKey(operator, indexOfKeyVal),
                    CompOperators[operator], query.getVal(operator, indexOfKeyVal), true);
                if (!(result instanceof InsightError)) {
                    protoResult = protoResult.concat(result);
                    this.candidate = this.candidate.concat(result);
                }
            }
            indexOfKeyVal++;
        } else if (operator === "AND") {
            let andClause: object[] = Object.values(queryBody);
            for (let obj of andClause) {
                this.candidate = this.findIntersection(this.candidate,
                    this.findCandidate(obj, indexOfKeyVal, numberOfNot));
                protoResult = this.findIntersection(this.candidate,
                    this.findCandidate(obj, indexOfKeyVal, numberOfNot));
            }
        } else if (operator === "OR") {
            let andClause: object[] = Object.values(queryBody);
            for (let obj of andClause) {
                this.candidate = this.findUnion(this.candidate, this.findCandidate(obj, indexOfKeyVal, numberOfNot));
                protoResult = this.findUnion(this.candidate, this.findCandidate(obj, indexOfKeyVal, numberOfNot));
            }
        } else if (operator === "NOT") {
            numberOfNot++;
            let obj: object = Object.values(queryBody);
            protoResult = this.findCandidate(obj, indexOfKeyVal, numberOfNot);
            this.candidate = this.findCandidate(obj, indexOfKeyVal, numberOfNot);
        }
        return protoResult;
    }

    private selectFieldandOrder(candidateResult: IDataRowCourse[], queryOptions: any): object[] {
        if (queryOptions.hasOwnProperty("COLUMNS")) {
            const column: string[] = queryOptions["COLUMNS"];
            for (let candidate of candidateResult) {
                for (let property of Object.keys(candidate)) {
                    if (! (column.includes(property))) {
                        delete candidate[property];
                        this.queryResult.push(candidate);
                    }
                }
            }
        }
        if (queryOptions.hasOwnProperty("ORDER")) {
            this.orderBy(this.queryResult, queryOptions["ORDER"]);
        }
        return this.queryResult;
    }

    // reference: stackOverflow:
    // https://stackoverflow.com/questions/16227197/compute-intersection-of-two-arrays-in-javascript
    private findIntersection(array1: IDataRowCourse[], array2: IDataRowCourse[]): IDataRowCourse[] {
        let tempArr;
        if (array2.length > array1.length) {
            tempArr = array2;
            array2 = array1;
            array1 = tempArr;
        }
        return array1.filter(function (e) {
            return array2.indexOf(e) > -1;
        }).filter(function (e, i, c) { // extra step to remove duplicates
                return c.indexOf(e) === i;
        });
    }

    // reference: stackOverflow:https:
    // stackoverflow.com/questions/48370587/how-can-i-uniquely-union-two-array-of-objects
    private findUnion(array1: IDataRowCourse[], array2: IDataRowCourse[]): IDataRowCourse[] {
        return array2.concat(array1).filter(function (o) {
            return this[o.a] ? false : this[o.a] = true;
        }, {});
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
