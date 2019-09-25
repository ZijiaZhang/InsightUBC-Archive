import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {DataSetDataCourse} from "../DataSetDataCourse";
import {JsonParser} from "../JsonParser";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private dataSetMap: {[name: string]: DataSetDataCourse } = {};
    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise<string[]>( (resolve, reject) => {
            if (!(InsightFacade.isDatasetValid(id, content, kind))) {
                reject(new InsightError("the given Parameter is not valid"));
            }
            // Create Database with name
            let dataType: InsightDatasetKind = InsightDatasetKind.Courses;
            if (dataType != null) {
                this.dataSetMap[id] = new DataSetDataCourse(id, dataType);
            }
            JSZip.loadAsync(content, {base64: true}).then(
                (zipFile: JSZip) => {
                    let validSectionCount = 0;
                    if (!("courses/" in zipFile.files)) {
                        reject(new InsightError("No Courses found in Zip"));
                    }
                    let totalNumberofDataSet = Object.keys(zipFile.files).length;
                    if (totalNumberofDataSet <= 0) {
                        reject( new InsightError(" No File found in courses/"));
                    }
                    zipFile.forEach( (relativePath, file) => {
                        let names = relativePath.split("/");
                        if (names[0] !== "courses") {
                            return;
                        }
                        if (file.dir) {
                            totalNumberofDataSet--;
                            this.checkFinish(totalNumberofDataSet, validSectionCount, resolve, reject);
                        } else {
                            file.async("text").then( (data) => {
                                totalNumberofDataSet--;
                                let dataInFile = JsonParser.parseData(data, InsightDatasetKind.Courses);
                                if (dataInFile != null) {
                                    for (let dataRow of dataInFile) {
                                        this.dataSetMap[id].addData(dataRow);
                                        validSectionCount++;
                                    }
                                }
                                this.checkFinish(totalNumberofDataSet, validSectionCount, resolve, reject);
                            }).catch( (reason) => {
                                reject(new InsightError("Error Processing File"));
                            });
                        }
                    });
                }
            ).catch((reason: any) => {
                reject(new InsightError(reason));
            });
        });
    }

    private checkFinish(totalNumberofDataSet: number, validFileCount: number,
                        resolve: (x: string[]) => any, reject: (x: InsightError) => any) {
        if (totalNumberofDataSet <= 0) {
            if (validFileCount > 0) {
                resolve(Object.keys(this.dataSetMap));
            } else {
                reject(new InsightError("No data Added"));
            }
        }
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise <any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise<InsightDataset[]>( (resolve, reject) => {
                let result: InsightDataset[] = [];
                for (let data of Object.values(this.dataSetMap)) {
                    result.push(data.getMetaData());
                }
                resolve(result);
            }
        );
    }

    /**
     *
     * @param id  The id of the dataset being added. Follows the format /^[^_]+$/
     * @param content  The base64 content of the dataset. This content should be in the form of a serialized zip file.
     * @param kind  The kind of the dataset
     *
     * @return boolean
     * Return if the givenDataset is valid.
     */
    private static isDatasetValid(id: string, content: string , kind: InsightDatasetKind): boolean {
        // TODO
        return true;
    }

    /**
     *
     * @param name the name of the dataKind
     * Get the kind of data from the name
     * @return InsightDatasetKind the Kind of the data.
     * If there is no this kind of data reuturn null instead.
     */
    private static getDataKind(name: string): InsightDatasetKind {
        switch (name) {
            case "courses":
                return InsightDatasetKind.Courses;
            default:
                return null;
        }
    }

}
