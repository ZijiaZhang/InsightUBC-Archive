import {DataSetDataCourse, IDataRowCourse} from "./DataSetDataCourse";
import {ResultTooLargeError} from "./controller/IInsightFacade";
import {CompOperators, Query} from "./Query";
import InsightFacade from "./controller/InsightFacade";

export class QueryParser {
    private static queryResult: object[] = [];
    private static protoResult: IDataRowCourse[] = [];
    private static DatasetID: string;
    private static insightFacade: InsightFacade = new InsightFacade();
    private static datasetCourse: DataSetDataCourse = new DataSetDataCourse("courses");

    public static getQueryResult(query: any): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            let temp = Query.getDataSetFromQuery(query);
            if (typeof temp === "string") {
                this.DatasetID = temp;
            }
            this.insightFacade.switchDataSet(this.DatasetID).then((result) => {
                this.parseQuery(query);
                if (this.queryResult.length > 5000) {
                    reject(new ResultTooLargeError("Result of this query exceeds maximum length"));
                } else {
                    resolve(this.queryResult);
                }
            });
            }
        );
    }

    private static parseQuery(query: any) {
        const where = query["WHERE"];
        const whereKey: string = Object.keys(query["WHERE"])[0];
        if (whereKey === "LT" || whereKey === "GT" || whereKey === "EQ" || whereKey === "IS") {
            const compBody = where[whereKey];
            // this.protoResult.push(this.datasetCourse.getData(Object.keys(compBody)[0], CompOperators[whereKey],
            //     Object.values(compBody),not));
        }
    }

    private selectField(protoReulst: IDataRowCourse[]): object[] {
        return QueryParser.queryResult;
    }
}
