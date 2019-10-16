import {DataSetDataCourse} from "./DataSetDataCourse";
import {DataSetDataRoom} from "./DataSetDataRoom";
import Log from "./Util";
import * as JSZip from "jszip";
import {InsightError} from "./controller/IInsightFacade";
const parse5 = require("parse5");

export class DatasetLoaderRooms {
    public static loadData(content: string, id: string): Promise<DataSetDataRoom> {
        return new Promise<DataSetDataRoom> ( (resolve, reject) => {
            JSZip.loadAsync(content, {base64: true})
                .then((data: JSZip) => {
                    if (!("rooms/index.htm" in data.files)) {
                        return reject(new InsightError("No index.htm found in Zip"));
                    }
                    const html = data.files["rooms/index.htm"].async( "text").then((file) => {
                        const document = parse5.parse(file);
                        let subNode: any = null;
                        for (let i of document.childNodes) {
                            if (i.nodeName === "html") {
                                subNode = i;
                            }
                        }
                        Log.trace(subNode.childNodes); // Reaches the <html Line 42
                    });
                })
                .catch((e) => reject(new InsightError("Error Reading files")));
            // reject("ERROR Not implemented");
        });
    }
}
