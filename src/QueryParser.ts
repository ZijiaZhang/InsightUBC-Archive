import {DataSetDataCourse, IDataRowCourse} from "./DataSetDataCourse";
import {InsightError, ResultTooLargeError} from "./controller/IInsightFacade";
import {CompOperators, Query} from "./Query";
import InsightFacade from "./controller/InsightFacade";

export class QueryParser {
    private static queryResult: object[] = [];
    private static candidate: IDataRowCourse[] = [];
    private static DatasetID: string;
    private static insightFacade: InsightFacade = new InsightFacade();
    private static datasetCourse: DataSetDataCourse = new DataSetDataCourse("courses");
    private static GTKey: string = null;
    private static GTvalue: number = null;
    private static LTKey: string = null;
    private static LTvalue: number = null;
    private static EQKey: string = null;
    private static EQvalue: number = null;
    private static ISKey: string = null;
    private static ISvalue: string = null;
    private static columnKeys: string[] = [];
    private static orderKey: string = null;

    public static getQueryResult(query: any): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            let temp = Query.getDataSetFromQuery(query);
            if (typeof temp === "string") {
                this.DatasetID = temp;
            }
            this.insightFacade.switchDataSet(this.DatasetID).then((result) => {
                this.candidate = this.findCandidate(query["WHERE"]);
                this.queryResult = this.selectFieldandOrder(this.candidate, query["OPTIONS"]);
                if (this.queryResult.length > 5000) {
                    reject(new ResultTooLargeError("Result of this query exceeds maximum length"));
                } else {
                    resolve(this.queryResult);
                }
            });
            }
        );
    }

    private static findCandidate(queryBody: any): IDataRowCourse[] {
        let protoResult: IDataRowCourse[] = [];
        const whereKey: string = Object.keys(queryBody)[0];
        let indexOfKeyVal: number = 0;
        let numberOfNot: number = 0;
        if (whereKey === "LT" || whereKey === "GT" || whereKey === "EQ" || whereKey === "IS") {
            if (numberOfNot % 2 === 0) {
                let result: any = this.datasetCourse.getData(Query.getKey(whereKey, indexOfKeyVal),
                    CompOperators[whereKey], Query.getVal(whereKey, indexOfKeyVal), false);
                if (!(result instanceof InsightError)) {
                    protoResult.push(result);
                    this.candidate.push(result);
                }
            } else {
                let result: any = this.datasetCourse.getData(Query.getKey(whereKey, indexOfKeyVal),
                    CompOperators[whereKey], Query.getVal(whereKey, indexOfKeyVal), true);
                if (!(result instanceof InsightError)) {
                    protoResult.push(result);
                    this.candidate.push(result);
                }
            }
            indexOfKeyVal++;
        } else if (whereKey === "AND") {
            let andClause: object[] = Object.values(queryBody);
            for (let obj of andClause) {
                this.candidate = this.findIntersection(this.candidate, this.findCandidate(obj));
                protoResult = this.findIntersection(this.candidate, this.findCandidate(obj));
            }
        } else if (whereKey === "OR") {
            let andClause: object[] = Object.values(queryBody);
            for (let obj of andClause) {
                this.candidate = this.findUnion(this.candidate, this.findCandidate(obj));
                protoResult = this.findUnion(this.candidate, this.findCandidate(obj));
            }
        } else if (whereKey === "NOT") {
            numberOfNot++;
            let obj: object = Object.values(queryBody);
            protoResult = this.findCandidate(obj);
            this.candidate = this.findCandidate(obj);
        }
        return protoResult;
    }

    private static selectFieldandOrder(candidateResult: IDataRowCourse[], queryOptions: any): object[] {
        if (queryOptions.hasOwnProperty("COLUMNS")) {
            const column: string[] = queryOptions["COLUMNS"];
            for (let candidate of candidateResult) {
                for (let property of Object.keys(candidate)) {
                    if (! (column.includes(property))) {
                        delete candidate[property];
                    }
                }
            }
        }
        if (queryOptions.hasOwnProperty("ORDER")) {
            this.orderBy(candidateResult, queryOptions["ORDER"]);
        }
        return QueryParser.queryResult;
    }

    // reference: stackOverflow:
    // https://stackoverflow.com/questions/16227197/compute-intersection-of-two-arrays-in-javascript
    private static findIntersection(array1: IDataRowCourse[], array2: IDataRowCourse[]): IDataRowCourse[] {
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
    private static findUnion(array1: IDataRowCourse[], array2: IDataRowCourse[]): IDataRowCourse[] {
        let res = array2.concat(array1).filter(function (o) {
            return this[o.a] ? false : this[o.a] = true;
        }, {});
        return res;
    }

    // By default, will order in ascending order.
    private static orderBy(candidateResult: IDataRowCourse[], orderKey: string) {
//
    }
}
