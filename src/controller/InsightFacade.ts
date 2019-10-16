import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {DataSetDataCourse} from "../DataSetDataCourse";
import {JsonParser} from "../JsonParser";
import {QueryParser} from "../QueryParser";
import {DataSet} from "../DataSet";
import {Query} from "../Query";
import {DatasetLoader} from "../DatasetLoader";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private dataSetMap: { [name: string]: DataSet } = {};
    private currentActiveDataset: string | null = null;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
            if (!(InsightFacade.isIdValid(id)) || id in this.dataSetMap) {
                return Promise.reject(new InsightError("the given Parameter is not valid"));
            }
            // Create Database with name
            switch (kind) {
                case InsightDatasetKind.Courses:
                    return DatasetLoader.loadCourseData(content, id).then(
                        (dataset) => {
                            this.dataSetMap[id] = dataset;
                            return Promise.resolve(Object.keys(this.dataSetMap));
                        }
                    ).catch(() => Promise.reject(new InsightError("Error Loading Files")));
                case InsightDatasetKind.Rooms:
                    return Promise.reject(new InsightError("Room not Implemented yet"));
                default:
                    return Promise.reject(new InsightError("No such Type"));
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

    public performQuery(query: any): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            let thisQuery: Query = new Query(query, this);

            if (query === null || query === undefined) {
                reject(new InsightError("Query is null or undefined"));
            } else if (!thisQuery.checkValidQuery()) {
                reject(new InsightError("Query Syntax Not Valid"));
            } else {
                let datasetID = thisQuery.dataset;
                if (typeof datasetID !== "string") {
                    reject(new InsightError("Reference non-exist dataset"));
                }
                thisQuery.parseLogic();
                let queryParser: QueryParser =
                    new QueryParser(thisQuery, this.dataSetMap[datasetID] as DataSetDataCourse);
                return this.switchDataSet(datasetID).then((result) => {
                    queryParser.query = thisQuery;
                    return queryParser.getQueryResult(query).then((result2) => {
                        resolve(result2);
                    }).catch((err) => {
                        reject(err);
                    });
                }).catch((err) => {
                    reject(new InsightError("Reference non-exist dataset"));
                });
            }
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise<InsightDataset[]>((resolve, reject) => {
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
     * Return if the given Dataset id is valid.
     */
    private static isIdValid(id: string): boolean {
        return !(id == null || id.includes("_") || id === "" || id.match(/^\s*$/g));
    }

    /**
     *
     * @param name the name of the dataKind
     * Get the kind of data from the name
     * @return InsightDatasetKind the Kind of the data.
     * If there is no this kind of data reuturn null instead.
     */
    public getDataKind(name: string): InsightDatasetKind {
        if (Object.keys(this.dataSetMap).includes(name)) {
            return this.dataSetMap[name].getMetaData().kind;
        }
        return null;
    }

    /**
     * Switch the active dataset
     * @param name The name of the target dataset.
     * @return Promise<string>
     *     resolve on successful switch.
     *     Reject otherwise.
     */
    public switchDataSet(name: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (this.currentActiveDataset === name) {
                return resolve("Dataset Already Loaded");
            }
            if (!(name in this.dataSetMap)) {
                return reject("Dataset Not Found");
            }
            if (this.currentActiveDataset != null) {
                this.dataSetMap[this.currentActiveDataset].unloadDataSet().then(
                    (result) => {
                        this.currentActiveDataset = null;
                        return this.activeDataSet(name).then(
                            (result2) => resolve("Dataset Switched Successfully.")
                        ).catch((err) => reject(new InsightError(err)));
                    }).catch((err) => reject(new InsightError(err)));
            } else {
                return this.activeDataSet(name).then(
                    (result2) => resolve("Dataset Switched Successfully.")
                ).catch((err) => reject(new InsightError(err)));
            }
        });
    }

    /**
     * Active a dataset and set it to current.
     * @param name The name of the target dataset.
     * @return Promise<string>
     *     resolve if activated Successfully.
     *     Reject otherwise.
     */

    private activeDataSet(name: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (this.currentActiveDataset === name) {
                resolve("Dataset Already Loaded");
            }
            if (!(name in this.dataSetMap)) {
                reject("Dataset Not Found");
            }
            this.dataSetMap[name].loadDataSet().then((result) => {
                this.currentActiveDataset = name;
                return resolve("Dataset Loaded");
            })
                .catch((err) => {
                    this.currentActiveDataset = null;
                    return reject(new InsightError("Error When Loading Dataset"));
                });
        });
    }
}
