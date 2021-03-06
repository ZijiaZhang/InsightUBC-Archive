import {DataSetDataCourse, IDataRowCourse} from "./Datasets/DataSetDataCourse";
import {InsightError, ResultTooLargeError} from "./controller/IInsightFacade";
import {DataSet, IDataRow} from "./Datasets/DataSet";
import {BasicLogic, ComplexLogic, LogicElement, NotLogic} from "./Logic";
import {Query} from "./Query";
import {CompOperator, CompOperators, LogicalOperators} from "./Operators";
import Decimal from "decimal.js";
export class QueryParser {
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
        let result: object[] = [];
        let queryOptions: any = this.query.queryObject.OPTIONS;
        const column: string[] = queryOptions.COLUMNS;
        const databaseID = column[0].split("_")[0];
        for (let i = 0; i < column.length; i++) {
            if (!this.query.applyKeyNewName.includes(column[i])) {
                column[i] = column[i].split("_")[1];
            }
        }
        for (let course of allResult) {
                if (this.determineCandidate(Logic, course)) {
                        result.push(course);
                }
        }
        result = this.transFormDataSet(result, column, databaseID);
        if (result.length > 5000) {
            return new ResultTooLargeError("Result of this query exceeds maximum length");
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

    /**
     * Rename the columns of the dataset and apply the transformations.
     * @param data the data from the database tht satisfy the query.
     * @param column The columns that we care about.
     * @param databaseID The id of the Database.
     */
    private transFormDataSet(data: IDataRow[], column: string[] , databaseID: string) {
        let result: any[] = [];
        if (this.query.queryObject.hasOwnProperty("TRANSFORMATIONS")) {
            data = this.doApply(this.doGroupBy(data));
        }
        for (let groupedObj of data) {
            result.push(this.refactorCourse(groupedObj, column, databaseID));
        }
        return result;
    }

    /**
     * group the result by the group key.
     * @param before The result before group by.
     * @return The result after the group by
     */
    // From https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-an-array-of-objects
    // Modified to work with multiple groups.
    private doGroupBy(before: object[]): any {
        let after: any = {r: before};
        const groupBy = function (array: any, property: any) {
            return array.reduce(function (returnVal: any, x: any) {
                const value = x[property];
                (returnVal[value] = returnVal[value] || []).push(x);
                return returnVal;
            }, {});
        };
        for (let property of this.query.groupByKeys) {
            property = property.split("_")[1];
            let t: any = {};
            for (let a in after) {
                let temp = groupBy( after[a], property);
                for (let k in temp) {
                    t[a + "_" + k] = temp[k];
                }
            }
            after = t;
        }
        return after;
    }

    /**
     * Apply the Apply for the query.
     * @param afterGroupByObj The query after GroupBy.
     */
    private doApply(afterGroupByObj: object): object[] {
        const afterGroupBy: Array<Array<{ [key: string]: number | string }>> = Object.values(afterGroupByObj);
        let afterApply: object[] = [];
        for (let group of afterGroupBy) {
            let aggregatedObJ: { [key: string]: number | string } = group[0];
            for (let rule of this.query.applyRules) {
                const newField = Object.keys(rule)[0];
                const func = Object.keys(Object.values(rule)[0])[0];
                const key = Object.values(Object.values(rule)[0])[0] as string;
                aggregatedObJ[newField] = this.doAggregation(func, key, group);
            }
            afterApply.push(aggregatedObJ);
        }
        return afterApply;
    }

    /**
     * return the result of aggragation on a group.
     * @param func One of "MAX","Min", "AVG", "COUNT", "SUM
     * @param key The key that is going to apply.
     * @param group All members in the group.
     */
    private doAggregation(func: string, key: string, group: Array<{ [key: string]: number | string}>): any {
        switch (func) {
            case "MAX":
                let max = Object.values(group)[0][key.split("_")[1]];
                for (let obj of group) {
                    if (obj[key.split("_")[1]] > max) {
                        max = obj[key.split("_")[1]];
                    }
                }
                return max;
            case "MIN":
                let min = Object.values(group)[0][key.split("_")[1]];
                for (let obj of group) {
                    if (obj[key.split("_")[1]] < min) {
                        min = obj[key.split("_")[1]];
                    }
                }
                return min;
            case "AVG":
                let total = new Decimal(0);
                for (let obj of group) {
                    const val = new Decimal(obj[key.split("_")[1]]);
                    total = Decimal.add(total, val);
                }
                const avg = total.toNumber() / (group.length);
                return Number(avg.toFixed(2));
            case "COUNT":
                let count = 0;
                let seen: any[] = [];
                for (let obj of group) {
                    if (!(seen.includes(obj[key.split("_")[1]]))) {
                        count++;
                        seen.push(obj[key.split("_")[1]]);
                    }
                }
                return count;
            case "SUM":
                let sum = 0;
                for (let obj of group) {
                    sum = sum + (obj[key.split("_")[1]] as number);
                }
                return Number(sum.toFixed(2));
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
            if (! this.query.applyKeyNewName.includes(i)) {
                obj[databaseID + "_" + i] = course[i];
            } else {
                obj[i] = course[i];
            }
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
        if (logic == null) {
            return true;
        }
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
