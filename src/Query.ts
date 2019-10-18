import Log from "./Util";
import {IDataRowCourse} from "./DataSetDataCourse";
import {InsightDataset, InsightDatasetKind} from "./controller/IInsightFacade";
import {BasicLogic, ComplexLogic, LogicElement, NotLogic} from "./Logic";
import {JsonParser} from "./JsonParser";
import {LogicParser} from "./LogicParser";
import InsightFacade from "./controller/InsightFacade";
import {CompOperator} from "./Operators";

export class Query {
    public queryObject: any;
    public Logic: LogicElement | null;
    public dataset: string | null = null;
    private insight: InsightFacade;
    public datasetKind: InsightDatasetKind;

    constructor(queryObject: any, insight: InsightFacade) {
        this.queryObject = queryObject;
        this.insight = insight;
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
    public checkValidQuery(): boolean {
        let isTransCorrect: boolean = true;
        if (this.queryObject == null) {
            return false;
        }
        if (!(Object.keys(this.queryObject).length === 2 || Object.keys(this.queryObject).length === 3)) {
            return false;
        }
        if (!this.queryObject.hasOwnProperty("WHERE") || !this.queryObject.hasOwnProperty("OPTIONS")) {
            return false;
        }
        if (Object.keys(this.queryObject).length === 3) {
            if (!this.queryObject.hasOwnProperty("TRANSFORMATIONS")) {
                return false;
            }
            isTransCorrect = this.checkTrans(this.queryObject.TRANSFORMATIONS);
        }
        return this.checkWhere(this.queryObject.WHERE) && this.checkOptions(this.queryObject.OPTIONS) && isTransCorrect;
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
        if (CompOperator.compareNumberOperators().includes(logicKey)) {
            return this.checkLeaf(whereClause[logicKey], "number");
        }
        if (CompOperator.compareStringOperators().includes(logicKey)) {
            return this.checkLeaf(whereClause[logicKey], "string");
        }
        if (CompOperator.compareLogicKey().includes(logicKey)) {
            if (!(whereClause[logicKey] instanceof Array) || whereClause[logicKey].length === 0) {
                return false;
            }
            for (let item of whereClause[logicKey]) {
                if (!this.checkLogic(item)) {
                    return false;
                }
            }
            return true;
        }
        if (CompOperator.compareNotKey().includes(logicKey)) {
            return this.checkLogic(whereClause[logicKey]);
        }
        return false;
    }

    /**
     * Check if options is valid
     * @param options The object of option section
     * Return true if it is valid.
     */
    private checkOptions(options: any): boolean {
        if (Object.keys(options).length > 2) {
            return false;
        }
        if (!options.hasOwnProperty("COLUMNS")) {
            return false;
        }
        if (Object.keys(options).length === 2 && !options.hasOwnProperty("ORDER")) {
            return false;
        }
        let columns = options.COLUMNS;
        if (!(columns instanceof Array) || columns.length === 0) {
            return false;
        }
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

    private checkTrans(trans: any ): boolean {
        if (Object.keys(trans).length !== 2) {
            return false;
        }
        if (!trans.hasOwnProperty("GROUP") || !trans.hasOwnProperty("APPLY") ) {
            return false;
        }
        let groups = trans.GROUP;
        if (!(groups instanceof Array) || groups.length === 0) {
            return false;
        }
        for (let key of groups) {
            if (!this.checkKey(key)) {
                return false;
            }
        }
        let apply = trans.APPLY;
        if (!(apply instanceof Array) ) {
            return false;
        }
        for (let rule of apply) {
            if (!this.checkApplyRule(rule)) {
                return false;
            }
        }
    }

    private checkApplyRule(rule: any): boolean {
        if (Object.keys(rule).length !== 1 || !(this.checkApplyKey(Object.keys(rule)[0]))) {
            return false;
        }
        const applyBody = rule[Object.keys(rule)[0]];
        if (Object.keys(applyBody).length !== 1 || Object.values(applyBody).length !== 1) {
            return false;
        }
        return this.checkApplyToken(Object.keys(applyBody)[0]) && this.checkKey(Object.values(applyBody)[0]);
    }

    private checkApplyKey(key: string): boolean {
        return !(key == null || key.includes("_") || key === "" || key.match(/^\s*$/g));
    }

    private checkApplyToken(token: string): boolean {
        const validToken: string[] = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
        return validToken.includes(token);
    }


    private checkKey(key: any): boolean {
        if (typeof key !== "string") {
            return false;
        }
        if (!key.match(/^[^_]+_[^_]+$/g)) {
            return false;
        }
        let keyArr = key.split("_");
        let dataset = keyArr[0];
        let field = keyArr[1];
        if (this.dataset == null) {
            this.dataset = dataset;
        }
        if (this.datasetKind == null) {
            this.datasetKind = this.insight.getDataKind(dataset);
        }
        return this.dataset === dataset && this.datasetKind != null
            && Object.values(JsonParser.getRequiredFieldCourses()).includes(field);
    }

    private checkLeaf(object: any, type: string): boolean {
        if (Object.keys(object).length !== 1) {
            return false;
        }
        let key = Object.keys(object)[0];
        let value = Object.values(object)[0];
        if (!this.checkKey(key)) {
            return false;
        }
        switch (type) {
            case "number":
                return typeof value === type && ["avg", "pass", "audit", "year", "fail"].includes(key.split("_")[1]);
            case "string":
                return (typeof value === "string") && !!value.match(/^[*]?[^*]*[*]?$/g)
                    && ["instructor", "uuid", "dept", "title", "id"].includes(key.split("_")[1]);
        }
        return false;
    }

    /**
     * Parse the logic of the Query.
     */
    public parseLogic() {
        let logicStatements = this.queryObject["WHERE"];
        let parsedLogic = LogicParser.generateLogic(logicStatements);
        if (parsedLogic instanceof LogicElement) {
            this.Logic = parsedLogic;
        }
    }
}
