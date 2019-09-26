import {IDataRowCourse} from "./DataSetDataCourse";
import Log from "./Util";
import {InsightDataset, InsightDatasetKind} from "./controller/IInsightFacade";

export class QueryParser {
    private queryResult: object[] = [];

    public static getQueryResult(query: string): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            resolve(["test", "test2"]);
            }
        );
    }
}
