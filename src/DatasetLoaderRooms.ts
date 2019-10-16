import {DataSetDataCourse} from "./DataSetDataCourse";
import {DataSetDataRoom} from "./DataSetDataRoom";
import Log from "./Util";
const parse5 = require("parse5");

export class DatasetLoaderRooms {
    public static loadData(content: string, id: string): Promise<DataSetDataRoom> {
        return new Promise<DataSetDataRoom> ( (resolve, reject) => {
            const document = parse5.parse(content);
            Log.trace(document);
            reject("ERROR Not implemented");
        });
    }
}
