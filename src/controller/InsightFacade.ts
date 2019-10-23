import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import {DataSetDataCourse} from "../Datasets/DataSetDataCourse";
import {QueryParser} from "../QueryParser";
import {DataSet} from "../Datasets/DataSet";
import {Query} from "../Query";
import {DatasetLoaderCourse} from "../Loaders/DatasetLoaderCourse";
import {DatasetLoaderRooms} from "../Loaders/DatasetLoaderRooms";
import {DatasetLoader} from "../Loaders/DatasetLoader";

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
        let loader: DatasetLoader = null;
        switch (kind) {
            case InsightDatasetKind.Courses:
                loader = new DatasetLoaderCourse(content, id);
                break;
            case InsightDatasetKind.Rooms:
                loader = new DatasetLoaderRooms(content, id);
                break;
            default:
                return Promise.reject(new InsightError("No such Type"));
        }
        return loader.getDataset().then(
            (dataset) => {
                this.dataSetMap[id] = dataset;
                return dataset.unloadDataSet()
                    .then(() =>  Promise.resolve(Object.keys(this.dataSetMap)))
                    .catch(() => Promise.reject(new InsightError("Error saving Dataset")));
            }
        ).catch((e) => Promise.reject(new InsightError(e)));
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

            if (!thisQuery.checkValidQuery()) {
                reject(new InsightError("Query Syntax Not Valid"));
            } else if (!thisQuery.checkSemantic()) {
                reject(new InsightError("Query Semantic Not Valid"));
            } else {
                let datasetID = thisQuery.dataset;
                thisQuery.parseLogic();
                let queryParser: QueryParser =
                    new QueryParser(thisQuery, this.dataSetMap[datasetID] as DataSetDataCourse);
                return this.switchDataSet(datasetID).then(() => {
                    queryParser.query = thisQuery;
                    return queryParser.getQueryResult(query).then((result2) => {
                        resolve(result2);
                    }).catch((err) => {
                        reject(err);
                    });
                }).catch((err) => {
                    reject(new InsightError(err));
                });
            }
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise<InsightDataset[]>((resolve) => {
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
                    () => {
                        this.currentActiveDataset = null;
                        return this.activeDataSet(name).then(
                            () => resolve("Dataset Switched Successfully.")
                        ).catch((err) => reject(new InsightError(err)));
                    }).catch((err) => reject(new InsightError(err)));
            } else {
                return this.activeDataSet(name).then(
                    () => resolve("Dataset Switched Successfully.")
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
                return resolve(result);
            })
                .catch((err) => {
                    this.currentActiveDataset = null;
                    return reject(new InsightError(err));
                });
        });
    }
}
