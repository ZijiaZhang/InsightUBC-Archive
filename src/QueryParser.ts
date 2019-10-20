import {DataSetDataCourse, IDataRowCourse} from "./Datasets/DataSetDataCourse";
import {InsightError, ResultTooLargeError} from "./controller/IInsightFacade";
import {DataSet} from "./Datasets/DataSet";
import {BasicLogic, ComplexLogic, LogicElement, NotLogic} from "./Logic";
import {Query} from "./Query";
import {CompOperator, LogicalOperators} from "./Operators";

export class QueryParser {
    private grouped: object[] = [];
    public query: Query;
    public database: DataSetDataCourse;

    constructor(query: Query, database: DataSetDataCourse) {
        this.query = query;
        this.database = database;
    }

    /**
     * Get the Query result with a given valid query.
     * @param query The valid query that is used to get the result.
     * Will resolve if the query is successful.
     * Will reject if the Result is too Large.
     */
    public getQueryResult(query: any): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
               let result = this.findCandidate(this.query.Logic);
               if (result instanceof Array) {
                    // this.queryResult = this.selectFieldandOrder(result, query["OPTIONS"]);
                    resolve(result);
                } else {
                   reject(result);
               }
            }
        );
    }

    /**
     * Ger result from a valid Logic.
     * @param Logic A the logic that is used to find the candidates or null.
     * Will return a List of result that satisfies the Logic.
     * Will return a ResultTooLargeError if the result is too large.
     * Will return All result if Logic is null.
     */
    private findCandidate(Logic: LogicElement): any[]| ResultTooLargeError {
        let allResult = this.database.getAllData();
        if (Logic == null) {
            if (allResult.length > 5000) {
                return new ResultTooLargeError("Result of this query exceeds maximum length");
            }
            let r = [];
            let columns = this.query.queryObject.OPTIONS.COLUMNS;
            let id = columns[0].split("_")[0];
            for (let i = 0; i < columns.length; i++) {
                columns[i] = columns[i].split("_")[1];
            }
            for (let course of allResult) {
                let obj = this.refactorCourse(course, columns, id);
                r.push(obj);
            }
            return r;
        }
        let result: object[] = [];
        let size = 0;
        let queryOptions: any = this.query.queryObject.OPTIONS;
        const column: string[] = queryOptions.COLUMNS;
        const databaseID = column[0].split("_")[0];
        for (let i = 0; i < column.length; i++) {
            column[i] = column[i].split("_")[1];
        }
        for (let course of allResult) {
            if (this.determineCandidate(Logic, course)) {
                if (!(this.query.queryObject.hasOwnProperty("TRANSFORMATION"))) {
                    this.formResult(result, course, column, databaseID, size);
                } else {
                    this.grouped.push(course);
                    this.transformCourse();
                    for (let groupedCourse of this.grouped) {
                        this.formResult(result, groupedCourse, column, databaseID, size);
                    }
                }
            }
        }
        if (queryOptions.hasOwnProperty("ORDER")) {
            if (typeof this.query.queryObject.OPTIONS.ORDER !== "object") {
                this.orderBy(result, queryOptions["ORDER"]);
            } else {
                this.complexOrderBy(result, queryOptions["ORDER"]);
            }
        }
        return result;
    }

    // 一定要直接改this.grouped这个field
    private transformCourse() {
        return;
    }

    private formResult(result: object[], course: any, column: string[], databaseID: string, size: number) {
        let obj = this.refactorCourse(course, column, databaseID);
        result.push(obj);
        size++;
        if (size > 5000) {
            return new ResultTooLargeError("Result of this query exceeds maximum length");
        }
    }

    /**
     * Will refactor Course to the add the Database Name at the front and remove unnecessary fields.
     * @param course  The course that need to be modified.
     * @param column  The colums that need to be preserved.
     * @param databaseID  The Name of the database that is being queried.
     */
    private refactorCourse(course: any, column: string[], databaseID: string) {
        for (let property of Object.keys(course)) {
            if (!(column.includes(property))) {
                delete course[property];
            }
        }
        let obj: any = {};
        for (let i of Object.keys(course)) {
            obj[databaseID + "_" + i] = course[i];
        }
        return obj;
    }

    /**
     * Determine if a coutse should be valid.
     * @param logic The Valid Logic.
     * @param course The course that is being validated.
     * Return true if the course is valid.
     * Return false otherwise.
     */
    private determineCandidate(logic: LogicElement, course: IDataRowCourse): boolean {
        let operator: string = null;
        if (logic instanceof BasicLogic) {
            let compare = CompOperator.getCompareFunction(logic.comp);
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

    /**
     * Order the queryResult by the orderKey, default direction is "UP"/ascending.
     * @param queryResult the query result.
     * @param orderKey the orderKey.
     */
    private orderBy(queryResult: object[], orderKey: string) {
        queryResult.sort(function (a: any, b: any) {
                if (a[orderKey] < b[orderKey]) {
                    return -1;
                } else if (a[orderKey] > b[orderKey]) {
                    return 1;
                } else {
                    return 0;
                }
            });
    }

    private complexOrderBy(queryResult: object[], orderObj: object) {
        const direction = Object.values(orderObj)[0];
        const orderKeys = Object.values(orderObj)[1];
        if (direction === "UP") {
            for (let orderKey of orderKeys) {
                queryResult.sort(function (a: any, b: any) {
                    if (a[orderKey] < b[orderKey]) {
                        return -1;
                    } else if (a[orderKey] > b[orderKey]) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
            }
        } else {
            for (let orderKey of orderKeys) {
                queryResult.sort(function (a: any, b: any) {
                    if (a[orderKey] < b[orderKey]) {
                        return 1;
                    } else if (a[orderKey] > b[orderKey]) {
                        return -1;
                    } else {
                        return 0;
                    }
                });
            }
        }
    }
}
