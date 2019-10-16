import {BasicLogic, ComplexLogic, LogicElement, NotLogic} from "./Logic";
import {CompOperator, LogicalOperators} from "./Operators";

export class LogicParser {
    /**
     * Generate the Logic from the Query Statement (Where Clause).
     * @param statement The where Clause of the Query Satement.
     */
    public static generateLogic(statement: any): LogicElement {
        if (Object.keys(statement).length === 0) {
            return null;
        }
        let filterKey = Object.keys(statement)[0];
        if (filterKey === "NOT") {
            return new NotLogic(this.generateLogic(statement[filterKey]));
        }
        if (statement[filterKey] instanceof Array) {
            let childResult = this.generateClauseLogic(statement[filterKey]);
            switch (filterKey) {
                case "AND":
                    return new ComplexLogic(LogicalOperators.AND, childResult);
                case "OR" :
                    return new ComplexLogic(LogicalOperators.OR, childResult);
                default:
                    return new ComplexLogic(LogicalOperators.AND, childResult);
            }
        } else {
            let comp = CompOperator.getCompOperators(filterKey);
            let key = Object.keys(statement[filterKey])[0].split("_")[1];
            let val = Object.values(statement[filterKey])[0] as string | number;
            return new BasicLogic(comp, key, val);
        }
    }

    /**
     * Generate the Logic from many Query Statement.
     * @param statement A list of Query Statement.
     */
    public static generateClauseLogic(statement: any[]): LogicElement[] {
        let result: LogicElement[] = [];
        for (let e of statement) {
            let elem = this.generateLogic(e);
            if (elem instanceof LogicElement) {
                result.push(elem);
            }
        }
        return result;
    }
}
