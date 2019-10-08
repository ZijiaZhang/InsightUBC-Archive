import Log from "./Util";
import {IDataRowCourse} from "./DataSetDataCourse";
import {InsightDataset, InsightDatasetKind} from "./controller/IInsightFacade";
import {BasicLogic, ComplexLogic, LogicElement, NotLogic} from "./Logic";
import {JsonParser} from "./JsonParser";
import {setInterval} from "timers";
import InsightFacade from "./controller/InsightFacade";

export enum CompOperators {
    GT,
    LT,
    EQ,
    IS
}

export enum LogicalOperators {
    AND, OR
}

export class Query {
    public queryObject: any;
    public Locgic: LogicElement | null;
    public dataset: string | null = null;
    private insight: InsightFacade;
    public datasetKind: InsightDatasetKind;
    public columnKeys: string[] = [];
    private orderKey: string = null;

    constructor(queryObject: any, insight: InsightFacade) {
        this.queryObject = queryObject;
        this.insight = insight;
    }

    public static CompareNumberOperators() {
        return ["GT", "LT", "EQ"];
    }

    public static CompareStringOperators() {
        return ["IS"];
    }

    public static CompareLogicKey() {
        return ["AND", "OR"];
    }

    public static CompareNotKey() {
        return ["NOT"];
    }

    // check that where clause can only have zero or one "FILTER", cannot have more than one
    // check that option clause must have one "COLUMNS"
    // zero or one "ORDER", cannot have more than one "ORDER"

    /**
     * Check that if the query object isValid.
     * @return boolean
     * return true if the queryObject follows definition of EBNF,
     * return false otherwise.
     */
    public chackValidQuery(): boolean {
        if (this.queryObject == null) {
            return false;
        }
        if (Object.keys(this.queryObject).length !== 2) {
            return false;
        }
        if (!this.queryObject.hasOwnProperty("WHERE") || !this.queryObject.hasOwnProperty("OPTIONS")) {
            return false;
        }
        let whereClause: any = this.queryObject.WHERE;
        let options: any = this.queryObject.OPTIONS;
        return this.checkWhere(whereClause) && this.checkOptions(options);
    }

    /**
     * Check if options is valid
     * @param options The object of option section
     * Return true if it is valid.
     */
    private checkOptions(options: any): boolean {
        if (Object.keys(options).length > 2) {return false; }
        if (!options.hasOwnProperty("COLUMNS")) {return false; }
        if (Object.keys(options).length === 2 && !options.hasOwnProperty("ORDER")) {return false; }
        let columns = options.COLUMNS;
        if (!(columns instanceof Array) || columns.length === 0) {return false; }
        for (let key of columns) {
            if (!this.checkKey(key)) {
                return false;
            }
        }
        if (options.hasOwnProperty("ORDER")) {
            let order = options.ORDER;
            return this.checkKey(order) && columns.includes(order);
        }
        return true;
    }

    private checkWhere(whereClause: any): boolean {
        return Object.keys(whereClause).length === 0 || this.checkLogic(whereClause);
    }
    /**
     * Check if Where Clause is valid
     * @param whereClause The where clause of the query. REQUIRES none EMPTY where.
     * Return true if the where is valid.
     */
    private checkLogic(whereClause: any): boolean {
        if (Object.keys(whereClause).length !== 1) {
            return false;
        }
        let logicKey = Object.keys(whereClause)[0];
        if (Query.CompareNumberOperators().includes(logicKey)) {
            return this.checkLeaf( whereClause[logicKey], "number");
        }
        if (Query.CompareStringOperators().includes(logicKey)) {
            return this.checkLeaf(whereClause[logicKey], "string");
        }
        if (Query.CompareLogicKey().includes(logicKey)) {
            if (!(whereClause[logicKey] instanceof Array) || whereClause[logicKey].length === 0 ) {return false; }
            for (let item of whereClause[logicKey]) {
                if (!this.checkLogic(item)) {return false; }
            }
            return true;
        }
        if (Query.CompareNotKey().includes(logicKey)) {
            return this.checkLogic(whereClause[logicKey]);
        }
        return false;
    }

    private checkKey(key: string): boolean {
        if (typeof key !== "string") {return false; }
        if (!key.match(/^[^_]+_[^_]+$/g)) {return false; }
        let keyArr = key.split("_");
        let dataset = keyArr[0];
        let field = keyArr[1];
        if (this.dataset == null) {this.dataset = dataset; }
        if (this.datasetKind == null) {this.datasetKind = this.insight.getDataKind(dataset); }
        return this.dataset === dataset && this.datasetKind != null
            && Object.values(JsonParser.getRequiredFieldCourses()).includes(field);
    }
    private checkLeaf(object: any, type: string): boolean {
        if (Object.keys(object).length !== 1) {return false; }
        let key = Object.keys(object)[0];
        let value = Object.values(object)[0];
        if (!this.checkKey(key)) {return false; }
        switch (type) {
            case "number":
                return typeof value === type && ["avg", "pass", "audit", "year", "fail"].includes(key.split("_")[1]);
            case "string":
                return (typeof value === "string") && !!value.match(/^[*]?[^*]*[*]?$/g)
                    && ["instructor", "uuid", "dept", "title", "id"].includes(key.split("_")[1]);
        }
        return false;
    }

    public parseLogic() {
        let logicStatements = this.queryObject["WHERE"];
        let parsedLogic = Query.statementToLogic(logicStatements);
        if (parsedLogic instanceof LogicElement) {
            this.Locgic = parsedLogic;
        }
    }

    public static statementToLogic(statement: any): LogicElement | LogicElement[] {
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
            if (Object.keys(statement).length === 0) {
                return null;
            }
            let filterKey = Object.keys(statement)[0];
            if (filterKey === "NOT") {
                return new NotLogic(this.statementToLogic(statement[filterKey]) as LogicElement);
            }
            if (statement[filterKey] instanceof Array) {
                let childResult = this.statementToLogic(statement[filterKey]) as LogicElement[];
                switch (filterKey) {
                    case "AND":
                        return new ComplexLogic(LogicalOperators.AND, childResult);
                    case "OR" :
                        return new ComplexLogic(LogicalOperators.OR, childResult);
                    default:
                        return new ComplexLogic(LogicalOperators.AND, childResult);
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
                let val = Object.values(statement[filterKey])[0] as string | number;
                return new BasicLogic(comp, key, val);

            }
        }
    }
}
