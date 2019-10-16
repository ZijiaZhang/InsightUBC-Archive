import {DataSetDataCourse, IDataRowCourse} from "./DataSetDataCourse";
import {InsightError, ResultTooLargeError} from "./controller/IInsightFacade";
import {DataSet} from "./DataSet";
import {BasicLogic, ComplexLogic, LogicElement, NotLogic} from "./Logic";
import {Query} from "./Query";
import {CompOperator, LogicalOperators} from "./Operators";

export class QueryParser {
    private queryResult: object[] = [];
    private candidate: IDataRowCourse[] = [];
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
     * @param Locgic A the logic that is used to find the candidates or null.
     * Will return a List of result that satisfies the Logic.
     * Will return a ResultTooLargeError if the result is too large.
     * Will return All result if Logic is null.
     */
    private findCandidate(Locgic: LogicElement): any[]| ResultTooLargeError {
        let allResult = this.database.getAllData();
        if (Locgic == null) {
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
        let result = [];
        let size = 0;
        let queryOptions: any = this.query.queryObject.OPTIONS;
        const column: string[] = queryOptions.COLUMNS;
        const databaseID = column[0].split("_")[0];
        for (let i = 0; i < column.length; i++) {
            column[i] = column[i].split("_")[1];
        }
        for (let course of allResult) {
            if (this.determineCandidate(Locgic, course)) {
                let obj = this.refactorCourse(course, column, databaseID);
                result.push(obj);
                size++;
                if (size > 5000) {
                    return new ResultTooLargeError("Result of this query exceeds maximum length");
                }
            }
        }
        if (queryOptions.hasOwnProperty("ORDER")) {
            this.orderBy(result, queryOptions["ORDER"]);
        }
        return result;
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
     * Order the queryResult by the orderKey..
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
}
