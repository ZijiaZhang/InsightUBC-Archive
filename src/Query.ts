import Log from "./Util";
import {IDataRowCourse} from "./Datasets/DataSetDataCourse";
import {InsightDataset, InsightDatasetKind} from "./controller/IInsightFacade";
import {BasicLogic, ComplexLogic, LogicElement, NotLogic} from "./Logic";
import {JsonParser} from "./Loaders/Parsers/JsonParser";
import {LogicParser} from "./LogicParser";
import InsightFacade from "./controller/InsightFacade";
import {CompOperator} from "./Operators";

export class Query {
    public queryObject: any;
    public Logic: LogicElement | null;
    public dataset: string | null = null;
    private insight: InsightFacade;
    public datasetKind: InsightDatasetKind;
    public columnKeys: string[] = [];
    public orderKeys: string[] = [];
    public groupByKeys: string[] = [];
    public applyRules: object[] = [];
    public applyKeyNewName: string[] = [];

    constructor(queryObject: any, insight: InsightFacade) {
        this.queryObject = queryObject;
        this.insight = insight;
    }

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
            if (!( this.checkKey(key) || this.checkApplyKey(key))) {
                return false;
            }
            this.columnKeys.push(key);
        }
        if (options.hasOwnProperty("ORDER")) {
            let order = options.ORDER;
            if (typeof order === "object") {
                return this.checkOrderObject(order);
            } else {
                return (this.checkKey(order) || this.checkApplyKey(order)) && columns.includes(order);
            }
        }
        return true;
    }

    private checkOrderObject(order: any): boolean {
        if (Object.keys(order).length !== 2) {
            return false;
        }
        if (!(order.hasOwnProperty("dir")) || !(order.hasOwnProperty("keys"))) {
            return false;
        }
        const dir = order["dir"];
        const keys = order["keys"];
        if (! (dir === "UP" || dir === "DOWN")) {
            return false;
        }
        if (!(keys instanceof Array) || keys.length === 0) {
            return false;
        }
        for (let key of keys) {
            if (!( this.checkKey(key) || this.checkApplyKey(key))) {
                return false;
            }
            this.orderKeys.push(key);
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
            this.groupByKeys.push(key);
        }
        let apply = trans.APPLY;
        if (!(apply instanceof Array) ) {
            return false;
        }
        for (let rule of apply) {
            if (!this.checkApplyRule(rule)) {
                return false;
            }
            this.applyRules.push(rule);
        }
        return true;
    }

    private checkApplyRule(rule: any): boolean {
        if (Object.keys(rule).length !== 1 || !(this.checkApplyKey(Object.keys(rule)[0]))) {
            return false;
        }
        this.applyKeyNewName.push(Object.keys(rule)[0]);
        const applyBody = rule[Object.keys(rule)[0]];
        if (Object.keys(applyBody).length !== 1 || Object.values(applyBody).length !== 1) {
            return false;
        }
        if (! this.checkKey(Object.values(applyBody)[0])) {
            return false;
        }
        return this.checkApplyToken(Object.keys(applyBody)[0], Object.values(applyBody)[0]);
    }

    private checkApplyKey(key: any): boolean {
        if (typeof key !== "string") {
            return false;
        }
        return !(key.includes("_") || key === "" || key.match(/^\s*$/g));
    }

    private checkApplyToken(token: string, field: any): boolean {
        const validToken: string[] = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
        const numericToken: string[] = ["MAX", "MIN", "AVG", "SUM"];
        const syntax = validToken.includes(token);
        let semantic = true;
        if (numericToken.includes(token)) {
            semantic  = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"].includes(field.split("_")[1]);
        }
        return syntax && semantic;
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
        let fields: string[];
        if (this.datasetKind === InsightDatasetKind.Courses) {
            fields = Object.values(JsonParser.getRequiredFieldCourses());
        } else {
            fields = ["fullname", "shortname", "number", "name", "address",
                "lat", "lon", "seats", "type", "furniture", "href"];
        }
        return this.dataset === dataset && this.datasetKind != null
            && fields.includes(field);
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
                return typeof value === type
                    && ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"].includes(key.split("_")[1]);
            case "string":
                return (typeof value === "string") && !!value.match(/^[*]?[^*]*[*]?$/g)
                    && ["instructor", "uuid", "dept", "title", "id", "fullname", "shortname", "number", "name",
                        "address", "type", "furniture", "href"].includes(key.split("_")[1]);
        }
        return false;
    }

    public checkSemantic(): boolean {
        let constraint1 = true;
        let constraint2 = true;
        let constraint3 = true;
        if (this.applyKeyNewName.length !== 0) {
            constraint1 = new Set(this.applyKeyNewName).size === this.applyKeyNewName.length;
        }
        if (this.queryObject.hasOwnProperty("TRANSFORMATIONS")) {
            constraint2 = this.columnKeyInGroupOrApply();
        }
        if (this.queryObject.OPTIONS.hasOwnProperty("ORDER")) {
            let order = this.queryObject.OPTIONS.ORDER;
            if (typeof order === "object") {
                constraint3 = this.sortKeyInColumn();
            }
        }
        return constraint1 && constraint2 && constraint3;
    }

    private columnKeyInGroupOrApply(): boolean {
        for (let key of this.columnKeys) {
            if (!(this.groupByKeys.includes(key) || this.applyKeyNewName.includes(key))) {
                return false;
            }
        }
        return true;
    }

    private sortKeyInColumn(): boolean {
        for (let key of this.orderKeys) {
            if (!(this.columnKeys.includes(key))) {
                return false;
            }
        }
        return true;
    }

    public parseLogic() {
        let logicStatements = this.queryObject["WHERE"];
        let parsedLogic = LogicParser.generateLogic(logicStatements);
        if (parsedLogic instanceof LogicElement) {
            this.Logic = parsedLogic;
        }
    }
}
