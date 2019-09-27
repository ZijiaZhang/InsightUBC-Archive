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
    private static GTKey: string[] = null;
    private static GTvalue: number[] = null;
    private static LTKey: string[] = null;
    private static LTvalue: number[] = null;
    private static EQKey: string[] = null;
    private static EQvalue: number[] = null;
    private static ISKey: string[] = null;
    private static ISvalue: string[] = null;
    private static columnKeys: string[] = [];
    private static orderKey: string = null;

    public static getKey(column: string, index: number): string| null {
        switch (column) {
            case "GT":
                return this.GTKey[index];
            case "LT":
                return this.LTKey[index];
            case "EQ":
                return this.EQKey[index];
            case "IS":
                return this.ISKey[index];
            case "ORDER":
                return this.orderKey[index];
            default:
                return null;
        }
    }

    public static getVal(column: string, index: number): string | number| null {
        switch (column) {
            case "GT":
                return this.GTvalue[index];
            case "LT":
                return this.LTvalue[index];
            case "EQ":
                return this.EQvalue[index];
            case "IS":
                return this.ISvalue[index];
            default:
                return null;
        }
    }

    public static getColumnKey(column: string): string[] | null {
        switch (column) {
            case "COLUMNS":
                return this.columnKeys;
            default:
                return null;
        }
    }

    // check that where clause can only have zero or one "FILTER", cannot have more than one
    // check that option clause must have one "COLUMNS"
    // zero or one "ORDER", cannot have more than one "ORDER"
    public static checkEBNF(inputquery: any): boolean {
        let isSyntaxValid: boolean = true;
        if (!inputquery.hasOwnProperty("WHERE")) {
            return false;
        }
        if (!inputquery.hasOwnProperty("OPTIONS")) {
            return false;
        }
        const where: object = inputquery["WHERE"];
        if (Object.keys(where).length > 1) {
            return false;
        }
        if (Object.keys(where).length === 1) {
            isSyntaxValid = isSyntaxValid && this.checkFilter(where);
        }
        const options: any = inputquery["OPTIONS"];
        if (Object.keys(options).length === 0 || Object.keys(options).length > 2) {
            return false;
        }
        if (!options.hasOwnProperty("COLUMNS")) {
            return false;
        }
        const column: string[] = options["COLUMNS"];
        if (column.length === 0) {
            return false;
        }
        for (let columnKey of column) {
            this.columnKeys.push(columnKey);
            if (!this.checkKeyExist(columnKey)) {
                return false;
            }
        }
        if (options.hasOwnProperty("ORDER")) {
            this.orderKey = options["ORDER"];
            isSyntaxValid = isSyntaxValid && this.checkKeyExist(this.orderKey);
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
                return false;
            } else {
                for (let logicObj of logicArray) {
                    if (!(isFilterCorrect && this.checkFilter(logicObj))) {
                        return false;
                    }
                }
            }
        } else if (filterKey === "LT" || filterKey === "GT" || filterKey === "EQ") {
            const mCompBody: object = whereClause[filterKey];
            if (Object.keys(mCompBody).length !== 1) {return false; }
            if (!this.checkMKeyExist(Object.keys(mCompBody)[0])) {return false; }
            if (typeof Object.values(mCompBody)[0] !== "number") {return false; }
            this.helpAddKeyandVal(filterKey, Object.keys(mCompBody)[0], Object.values(mCompBody)[0]);
        } else if (filterKey === "IS") {
            const sCompBody: object = whereClause[filterKey];
            if (Object.keys(sCompBody).length !== 1) {return false; }
            if (!this.checkSKeyExist((Object.keys(sCompBody)[0]))) {return false; }
            if (!this.checkScompInputString(Object.values(sCompBody)[0])) {return false; }
            this.helpAddIsKeyAndVal(Object.keys(sCompBody)[0], Object.values(sCompBody)[0]);
        } else if (filterKey === "NOT") {
            const not: object = whereClause[filterKey];
            if (Object.keys(not).length !== 1) {
                return false;
            } else {
                isFilterCorrect = isFilterCorrect && this.checkFilter(not);
            }
        } else {
            return false;                      // Filter Key is Not one of those listed in EBNF
        }
        return isFilterCorrect;
    }

    private static helpAddKeyandVal(filterKey: string, mCompKey: string, mCompVal: number) {
        switch (filterKey) {
            case "LT":
                this.LTKey.push(mCompKey);
                this.LTvalue.push(mCompVal);
                break;
            case "GT":
                this.GTKey.push(mCompKey);
                this.GTvalue.push(mCompVal);
                break;
            case "EQ":
                this.EQKey.push(mCompKey);
                this.EQvalue.push(mCompVal);
                break;
        }
    }

    private static helpAddIsKeyAndVal(iskey: string, isval: string) {
        this.ISKey.push(iskey);
        this.ISvalue.push(isval);
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
        let allKeyInQuery: string[] = [];
        allKeyInQuery.concat(this.LTKey);
        allKeyInQuery.concat(this.GTKey);
        allKeyInQuery.concat(this.EQKey);
        allKeyInQuery.concat(this.ISKey);
        allKeyInQuery.push(this.orderKey);
        allKeyInQuery = allKeyInQuery.concat(this.columnKeys);
        for (let key of allKeyInQuery) {
            allDSinQuery.push(key.split("_")[0]);
        }
        const DS = allDSinQuery[0];
        for (let DSid of allDSinQuery) {
            if (DSid !== DS) {
                return false;
            }
        }
        return DS;
    }
}
