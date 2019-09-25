import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
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
            if (!(InsightFacade.isIdValid(id)) || id in this.dataSetMap) {
                return reject(new InsightError("the given Parameter is not valid"));
            }
            // Create Database with name
            let dataType: InsightDatasetKind = kind;
            if (dataType != null) {
                this.dataSetMap[id] = new DataSetDataCourse(id, dataType);
            }
            JSZip.loadAsync(content, {base64: true}).then(
                (zipFile: JSZip) => {
                    let validSectionCount = 0;
                    if (!("courses/" in zipFile.files)) {return reject(new InsightError("No Courses found in Zip")); }
                    let totalNumberofDataSet = Object.keys(zipFile.files).length;
                    if (totalNumberofDataSet <= 0) {
                        return reject( new InsightError(" No File found in 'courses/'"));
                    }
                    zipFile.forEach( (relativePath, file) => {
                        let names = relativePath.split("/");
                        if (names[0] !== "courses") {totalNumberofDataSet--; return; }
                        if (file.dir) {
                            totalNumberofDataSet--;
                            this.checkFinish(id, totalNumberofDataSet, validSectionCount, resolve, reject);
                        } else {
                            file.async("text").then( (data) => {
                                totalNumberofDataSet--;
                                let dataInFile = JsonParser.parseData(data, InsightDatasetKind.Courses);
                                if (dataInFile != null) {
                                    for (let dataRow of dataInFile) {
                                        if (!this.dataSetMap[id].addData(dataRow)) {
                                            return reject( new InsightError("Dataset not Loaded"));
                                        }
                                        validSectionCount++;
                                    }
                                }
                                this.checkFinish(id, totalNumberofDataSet, validSectionCount, resolve, reject);
                            }).catch( (reason) => {
                                totalNumberofDataSet--;
                                return reject(new InsightError("Error Processing File"));
                            });
                        }
                    });
                }
            ).catch((reason: any) => {
                delete this.dataSetMap[id];
                return reject(new InsightError(reason));
            });
        });
    }

    /**
     *
     * @param id the id of the dataset
     * @param totalNumberofDataSet the remaining of files of the dataset
     * @param validFileCount number of valid section in the dataset
     * @param resolve resolve Fonction
     * @param reject reject fonction
     *
     * Will do nothing if not all files are processed. Otherwise:
     * Will resolve if the valid number of sections is greater than 0;
     * WIll reject if the valid number of section is 0
     */
    private checkFinish(id: string, totalNumberofDataSet: number, validFileCount: number,
                        resolve: (x: string[]) => any, reject: (x: InsightError) => any) {
        if (totalNumberofDataSet <= 0) {
            if (validFileCount > 0) {
                this.dataSetMap[id].unloadDataSet().then(
                    (fileloc) => {
                        return resolve(Object.keys(this.dataSetMap)); }
                ).catch( (err) => {Log.error(err); });
            } else {
                delete this.dataSetMap[id];
                return reject(new InsightError("No data Added"));
            }
        }
    }

    public removeDataset(id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (!InsightFacade.isIdValid(id)) {
                return reject(new InsightError("Invalid ID"));
            }
            if (!(id in this.dataSetMap)) {
                return reject(new NotFoundError("Id Not found"));
            }

            delete this.dataSetMap[id];
            return resolve(id);
        });
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
     *
     * @return boolean
     * Return if the givenDataset is valid.
     */
    private static isIdValid(id: string): boolean {
        if (id == null || id.includes("_") || id ===  "" || id.match(/^\s*$/g)) {
            return false;
        }
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
