import Log from "./Util";
import {IDataRowCourse} from "./DataSetDataCourse";
import {InsightDataset, InsightDatasetKind} from "./controller/IInsightFacade";

export enum CompOperators {
    GT ,
    LT ,
    EQ,
    IS
}

export enum LogicalOperators {
    AND, OR
}

export class Query {

    public static checkEBNF(inputquery: any): boolean {
        let isSyntaxValid: boolean = true;
        if (inputquery.hasOwnProperty("WHERE")) {
            const where: object = inputquery["WHERE"];
            // check that where clause can only have zero or one "FILTER", cannot have more than one
            if (Object.keys(where).length === 1) {
                return this.checkFilter(where);
            } else if (Object.keys(where).length > 1) {
                isSyntaxValid = false;
            }
        } else {
            isSyntaxValid = false;
        }
        if (inputquery.hasOwnProperty("OPTIONS")) {
            const options: any = inputquery["OPTIONS"];
            // check that option clause must have one "COLUMNS"
            // zero or one "ORDER", cannot have more than one "ORDER"
            if (Object.keys(options).length === 0 || Object.keys(options).length > 2) {
                isSyntaxValid = false;
            }
            if (options.hasOwnProperty("COLUMNS")) {
                const column: string[] = inputquery["COLUMNS"];
                if (column.length === 0) {
                    isSyntaxValid = false;
                } else {
                    for (const columnKey of column) {
                        if (!this.checkKeyExist(columnKey)) {
                            isSyntaxValid = false;
                        }
                    }
                    isSyntaxValid = true;
                }
            } else {
                isSyntaxValid = false;
            }
            if (options.hasOwnProperty("ORDER")) {
                const orderKey = options["ORDER"];
                return this.checkKeyExist(orderKey);
            }
        } else {
            isSyntaxValid = false;
        }
        return isSyntaxValid;
    }

    public static checkSemantic(inputquery: any): boolean {
        let isSemanticCorrect: boolean = true;
        if (inputquery.hasOwnProperty("OPTIONS")) {
            const options: any = inputquery["OPTIONS"];
            if (options.hasOwnProperty("COLUMNS")) {
                const column: string[] = options["COLUMNS"];
                if (options.hasOwnProperty("ORDER")) {
                    const orderKey = options["ORDER"];
                    if (!column.includes(orderKey)) {
                        isSemanticCorrect = false;
                    }
                }
            }
        }
        if (!this.checkReferenceDSValid(inputquery)) {
            isSemanticCorrect = false;
        }
        return isSemanticCorrect;
    }

    private static checkFilter(whereClause: any): boolean {
        const filterKeys: string[] = Object.keys(whereClause);
        const filterKey = filterKeys[0];
        let isFilterCorrect = true;
        if (filterKey === "OR" || filterKey === "AND") {
            const logicArray: object[] = whereClause[filterKey];
            if (logicArray.length === 0) {
                isFilterCorrect = false;
            } else {
                for (const logicObj of logicArray) {
                    if (!this.checkFilter(logicObj)) {
                        isFilterCorrect = false;
                    }
                }
                isFilterCorrect = true;
            }
        } else if (filterKey === "LT" || filterKey === "GT" || filterKey === "EQ") {
            const mComp: object = whereClause[filterKey];
            if (Object.keys(mComp).length !== 1) {
                isFilterCorrect = false;
            }
            if (!this.checkMKeyExist(Object.keys(mComp)[0])) {
                isFilterCorrect = false;
            }
            if (typeof Object.values(mComp)[0] !== "number") {
                isFilterCorrect = false;
            }
        } else if (filterKey === "IS") {
            const sComp: object = whereClause[filterKey];
            if (Object.keys(sComp).length !== 1) {
                isFilterCorrect = false;
            }
            if (!this.checkSKeyExist((Object.keys(sComp)[0]))) {
                isFilterCorrect = false;
            }
            if (!this.checkScompInputString(Object.values(sComp)[0])) {
                isFilterCorrect = false;
            }
        } else if (filterKey === "NOT") {
            const not: object = whereClause[filterKey];
            if (Object.keys(not).length !== 1) {
                isFilterCorrect = false;
            } else {
                isFilterCorrect = this.checkFilter(not);
            }
        } else {
            isFilterCorrect = false;                      // Filter Key is Not one of those listed in EBNF
        }
        return isFilterCorrect;
    }

// Check whether the input key is a key in the courses dataset
// The given key must be one of the key in the courses dataset, otherwise we don't have the key
    private static checkKeyExist(key: string): boolean {
        return key === "courses_dept" || key === "courses_id" || key === "courses_instructor" || key === "courses_title"
            || key === "courses_uuid" || key === "courses_avg" || key === "courses_pass" || key === "courses_fail"
            || key === "courses_audit" || key === "courses_year";
    }

    private static checkMKeyExist(key: string): boolean {
        return key === "courses_avg" || key === "courses_pass" || key === "courses_fail"
            || key === "courses_audit" || key === "courses_year";
    }

    private static checkSKeyExist(key: string): boolean {
        return key === "courses_dept" || key === "courses_id" || key === "courses_instructor" || key === "courses_title"
            || key === "courses_uuid";
    }

    private static checkScompInputString(inputString: string): boolean {
        if (inputString.length === 0) {
            return true;
        } else if (inputString.length === 1) {
            return true;
        } else if (inputString.length === 2) {
            return true;
        } else {
            const inputStringArray: string[] = inputString.split("");
            const inputStringLength: number = inputString.length;
            for (let i = 1; i < inputStringLength - 1; i++) {
                if (inputStringArray[i] === "*") {
                    return false;
                }
            }
            return true;
        }
    }

    private static checkReferenceDSValid(inputquery: any): boolean {
        return typeof this.getDataSetFromQuery(inputquery) === "string";
    }

    public static getDataSetFromQuery(inputquery: any): string | boolean {
        let allDSinQuery: string[] = [];
        const allKeyInQuery: string[] = this.findAllKeyInQuery(inputquery);
        for (let i = 0; i < allKeyInQuery.length - 1; i++) {
            allDSinQuery.push(allKeyInQuery[i].split("_")[0]);
        }
        const DS = allDSinQuery[0];
        for (let i = 0; i < allDSinQuery.length - 1; i++) {
            if (allDSinQuery[i] !== DS) {
                return false;
            }
        }
        return DS;
    }

    private static findAllKeyInQuery(input: any): string[] {
        let allKeyInQuery: string[];
        let allKeyInFilter: string[] = [];
        let allKeyInOption: string[] = [];
        if (input.hasOwnProperty("WHERE")) {
            const where: object = input["WHERE"];
            if (Object.keys(where).length === 1) {
                allKeyInFilter = this.findAllKeyInFilter(where);
            }
        }
        if (input.hasOwnProperty("OPTIONS")) {
            const options: any = input["OPTIONS"];
            allKeyInOption = this.findAllKeyInOption(options);
        }
        return allKeyInQuery = allKeyInFilter.concat(allKeyInOption);
    }

    private static findAllKeyInFilter(input: any): string[] {
        let allKeyInFilter: string[] = [];
        const filterKeys: string[] = Object.keys(input);
        const filterKey = filterKeys[0];
        if (filterKey === "LT" || filterKey === "GT" || filterKey === "EQ" || filterKey === "IS") {
            const Comp: object = input[filterKey];
            const key: string[] = Object.keys(Comp);
            for (let i = 0; i < key.length - 1; i++) {
                allKeyInFilter.push(key[i]);
            }
        } else if (filterKey === "OR" || filterKey === "AND") {
            const logicArray: object[] = input[filterKey];
            for (let i = 0; i < logicArray.length - 1; i++) {
                this.findAllKeyInFilter(logicArray[i]);
            }
        } else if (filterKey === "NOT") {
            const not: object = input[filterKey];
            this.findAllKeyInFilter(not);
        }
        return allKeyInFilter;
    }

    private static findAllKeyInOption(input: any): string[] {
        let allKeyInOption: string[] = [];
        if (input.hasOwnProperty("COLUMNS")) {
            const column: string[] = input["COLUMNS"];
            for (let i = 0; i < column.length - 1; i++) {
                allKeyInOption.push(column[i]);
            }
        }
        if (input.hasOwnProperty("ORDER")) {
            allKeyInOption.push(input["ORDER"]);
        }
        return allKeyInOption;
    }
}
// private static getDataSetFromQuery(inputquery: any): string | boolean {
//     let allDSinQuery: string[] = [];
//     let allKeyInFilter: string[] = [];
//     let allKeyInOption: string[] = [];
//     if (inputquery.hasOwnProperty("WHERE")) {
//         const where: object = inputquery["WHERE"];
//         if (Object.keys(where).length === 1) {
//             allKeyInFilter = this.findAllKeyInFilter(where);
//         }
//     }
//     if (inputquery.hasOwnProperty("OPTIONS")) {
//         const options: any = inputquery["OPTIONS"];
//         allKeyInOption = this.findAllKeyInOption(options);
//     }
//     for (let i = 0; i < allKeyInFilter.length - 1; i++) {
//         allDSinQuery.push(allKeyInFilter[i].split("_")[0]);
//     }
//     for (let i = 0; i < allKeyInOption.length - 1; i++) {
//         allDSinQuery.push(allKeyInOption[i].split("_")[0]);
//     }
//     const DS = allDSinQuery[0];
//     for (let i = 0; i < allDSinQuery.length - 1; i++) {
//         if (allDSinQuery[i] !== DS) {
//             return false;
//         }
//     }
//     return DS;
// }
