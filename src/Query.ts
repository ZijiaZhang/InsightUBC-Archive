import Log from "./Util";
import {IDataRowCourse} from "./DataSetDataCourse";
import {InsightDataset, InsightDatasetKind} from "./controller/IInsightFacade";
import {BasicLogic, ComplexLogic, LogicElement, NotLogic} from "./Logic";

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
    private GTKey: string[] = [];
    private GTvalue: number[] = [];
    private LTKey: string[] = [];
    private LTvalue: number[] = [];
    private EQKey: string[] = [];
    private EQvalue: number[] = [];
    private ISKey: string[] = [];
    private ISvalue: string[] = [];
    private queryObject: any;
    public Locgic: LogicElement| null;
    private columnKeys: string[] = [];
    private orderKey: string = null;

    constructor(queryObject: any) {
        this.queryObject = queryObject;
    }

    public getKey(column: string, index: number): string| null {
        switch (column) {
            case "GT":
                return this.GTKey[index];
            case "LT":
                return this.LTKey[index];
            case "EQ":
                return this.EQKey[index];
            case "IS":
                return this.ISKey[index];
            // case "ORDER":
            //     return this.orderKey[index];
            default:
                return null;
        }
    }

    public getVal(column: string, index: number): string | number| null {
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
    // check that where clause can only have zero or one "FILTER", cannot have more than one
    // check that option clause must have one "COLUMNS"
    // zero or one "ORDER", cannot have more than one "ORDER"
    public checkEBNF(): boolean {
        let isSyntaxValid: boolean = true;
        if (!this.queryObject.hasOwnProperty("WHERE")) {
            return false;
        }
        if (!this.queryObject.hasOwnProperty("OPTIONS")) {
            return false;
        }
        const where: object = this.queryObject["WHERE"];
        if (Object.keys(where).length > 1) {
            return false;
        }
        if (Object.keys(where).length === 1) {
            isSyntaxValid = isSyntaxValid && this.checkFilter(where);
        }
        const options: any = this.queryObject["OPTIONS"];
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

    public checkSemantic(): boolean {
        let isSemanticCorrect: boolean = true;
        if (this.queryObject.hasOwnProperty("OPTIONS")) {
            const options: any = this.queryObject["OPTIONS"];
            if (options.hasOwnProperty("COLUMNS") && options.hasOwnProperty("ORDER")) {
                if (!(options["COLUMNS"].includes(options["ORDER"]))) {
                    return false;
                }
            }
        }
        if (!this.checkReferenceDSValid(this.queryObject)) {
            return false;
        }
        return isSemanticCorrect;
    }

    private checkFilter(whereClause: any): boolean {
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

    private helpAddKeyandVal(filterKey: string, mCompKey: string, mCompVal: number) {
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

    private helpAddIsKeyAndVal(iskey: string, isval: string) {
        this.ISKey.push(iskey);
        this.ISvalue.push(isval);
    }

// Check whether the input key is a key in the courses dataset
// The given key must be one of the key in the courses dataset, otherwise we don't have the key
    private checkKeyExist(key: string): boolean {
        return key === "courses_dept" || key === "courses_id" || key === "courses_instructor" || key === "courses_title"
            || key === "courses_uuid" || key === "courses_avg" || key === "courses_pass" || key === "courses_fail"
            || key === "courses_audit" || key === "courses_year";
    }

    private checkMKeyExist(key: string): boolean {
        return key === "courses_avg" || key === "courses_pass" || key === "courses_fail"
            || key === "courses_audit" || key === "courses_year";
    }

    private checkSKeyExist(key: string): boolean {
        return key === "courses_dept" || key === "courses_id" || key === "courses_instructor" || key === "courses_title"
            || key === "courses_uuid";
    }

    private checkScompInputString(inputString: string): boolean {
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

    private checkReferenceDSValid(inputquery: any): boolean {
        return typeof this.getDataSetFromQuery(inputquery) === "string";
    }

    public getDataSetFromQuery(inputquery: any): string | boolean {
        let allDSinQuery: string[] = [];
        let allKeyInQuery: string[] = [];
        allKeyInQuery = allKeyInQuery.concat(this.LTKey);
        allKeyInQuery = allKeyInQuery.concat(this.GTKey);
        allKeyInQuery = allKeyInQuery.concat(this.EQKey);
        allKeyInQuery = allKeyInQuery.concat(this.ISKey);
        if (this.orderKey != null) { allKeyInQuery.push(this.orderKey); }
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

    public parseLogic() {
        let logicStatements = this.queryObject["WHERE"];
        let parsedLogic = Query.statementToLogic(logicStatements);
        if ( parsedLogic instanceof LogicElement) {
            this.Locgic = parsedLogic;
        }
    }

    public static statementToLogic(statement: any): LogicElement| LogicElement[] {
        if (statement instanceof Array) {
            let result: LogicElement[] = [];
            for (let e of statement) {
                let elem = this.statementToLogic(e);
                if (elem instanceof LogicElement) {
                    result.push(elem);
                }
            }
            return result;
        } else {
            let filterKey = Object.keys(statement)[0];
            if (filterKey === "NOT") {
                return new NotLogic(this.statementToLogic(statement[filterKey]) as LogicElement);
            }
            if (statement[filterKey] instanceof Array) {
                let childResult = this.statementToLogic(statement[filterKey]) as LogicElement[];
                switch (filterKey) {
                    case "AND": return new ComplexLogic(LogicalOperators.AND, childResult);
                    case "OR" : return new ComplexLogic(LogicalOperators.OR, childResult);
                }
            } else {
                let comp = CompOperators.GT;
                switch (filterKey) {
                    case "GT": comp = CompOperators.GT; break;
                    case "LT": comp = CompOperators.LT; break;
                    case "EQ": comp = CompOperators.EQ; break;
                    case "IS": comp = CompOperators.IS; break;
                }
                let key = Object.keys(statement[filterKey])[0].split("_")[1];
                let val = Object.values(statement[filterKey])[0] as string|number;
                return new BasicLogic(comp, key, val);

            }
        }
    }
}
