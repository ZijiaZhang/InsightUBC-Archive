import {IDataRow} from "./Datasets/DataSet";
import {InsightDatasetKind} from "./controller/IInsightFacade";
import {CompOperators, LogicalOperators} from "./Operators";

export class LogicElement {
    public data: IDataRow[];
    public type: InsightDatasetKind;
}

export class BasicLogic extends LogicElement {
    public comp: CompOperators;
    public key: string;
    public value: string| number;

    constructor(comp: CompOperators, key: string, value: string| number) {
        super();
        this.comp = comp;
        this.key = key;
        this.value = value;
    }
}

export class ComplexLogic extends LogicElement {
    public logicalOperator: LogicalOperators;
    public elements: LogicElement[];

    constructor(type: LogicalOperators, elements: LogicElement[]) {
        super();
        this.logicalOperator = type;
        this.elements = elements;
    }
}

export class NotLogic extends LogicElement {
    public element: LogicElement;
    constructor(element: LogicElement) {
        super();
        this.element = element;
    }

}
