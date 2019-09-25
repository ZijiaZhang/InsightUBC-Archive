import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {DataSetDataCourse} from "../DataSetDataCourse";
import {JsonParser} from "../JsonParser";
import {queryParser} from "restify";
import {QueryParser} from "../QueryParser";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private dataSetMap: { [name: string]: DataSetDataCourse } = {};

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
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
                        reject(new InsightError(" No File found in courses/"));
                    }
                    zipFile.forEach((relativePath, file) => {
                        let names = relativePath.split("/");
                        if (names[0] !== "courses") {
                            return;
                        }
                        if (file.dir) {
                            totalNumberofDataSet--;
                            this.checkFinish(totalNumberofDataSet, validSectionCount, resolve, reject);
                        } else {
                            file.async("text").then((data) => {
                                totalNumberofDataSet--;
                                let dataInFile = JsonParser.parseData(data, InsightDatasetKind.Courses);
                                if (dataInFile != null) {
                                    for (let dataRow of dataInFile) {
                                        this.dataSetMap[id].addData(dataRow);
                                        validSectionCount++;
                                    }
                                }
                                this.checkFinish(totalNumberofDataSet, validSectionCount, resolve, reject);
                            }).catch((reason) => {
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

    public performQuery(query: any): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            if (query === null || query === undefined) {
                reject(new InsightError("Query is null or undefined"));
            } else if (InsightFacade.checkEBNF(query)) {
                if (InsightFacade.checkSemantic(query)) {
                    resolve(QueryParser.getQueryResult(query));
                } else {
                    reject(new InsightError("Query has semantic error"));
                }
            } else {
                reject(new InsightError("Query Syntax Not Valid"));
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
     * @param content  The base64 content of the dataset. This content should be in the form of a serialized zip file.
     * @param kind  The kind of the dataset
     *
     * @return boolean
     * Return if the givenDataset is valid.
     */
    private static isDatasetValid(id: string, content: string, kind: InsightDatasetKind): boolean {
        return !(id == null || id.includes("_") || id.match(/^\s*$/g));
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
    private static checkEBNF(inputquery: any): boolean {
        let isSyntaxValid: boolean = true;
        if (inputquery.hasOwnProperty("WHERE")) {
            const where: object = inputquery["WHERE"];
            // check that where clause can only have zero or one "FILTER", cannot have more than one
            if (Object.keys(where).length === 1) {
                return this.checkFilter(where);
            } else if (Object.keys(where).length > 1) {
                isSyntaxValid = false;
            }
        } else {
            isSyntaxValid = false;
        }
        if (inputquery.hasOwnProperty("OPTIONS")) {
            const options: any = inputquery["OPTIONS"];
            // check that option clause must have one "COLUMNS"
            // zero or one "ORDER", cannot have more than one "ORDER"
            if (Object.keys(options).length === 0 || Object.keys(options).length > 2) {
                isSyntaxValid = false;
            }
            if (options.hasOwnProperty("COLUMNS")) {
                const column: string[] = inputquery["COLUMNS"];
                if (column.length === 0) {
                    isSyntaxValid = false;
                } else {
                    for (const columnKey of column) {
                        if (!this.checkKeyExist(columnKey)) {
                            isSyntaxValid = false;
                        }
                    }
                    isSyntaxValid = true;
                }
            } else {
                isSyntaxValid = false;
            }
            if (options.hasOwnProperty("ORDER")) {
                const orderKey = options["ORDER"];
                return this.checkKeyExist(orderKey);
            }
        } else {
            isSyntaxValid = false;
        }
        return isSyntaxValid;
    }

    private static checkSemantic(inputquery: any): boolean {
        let isSemanticCorrect: boolean = true;
        if (inputquery.hasOwnProperty("OPTIONS")) {
            const options: any = inputquery["OPTIONS"];
            if (options.hasOwnProperty("COLUMNS")) {
                const column: string[] = inputquery["COLUMNS"];
                if (options.hasOwnProperty("ORDER")) {
                    const orderKey = options["ORDER"];
                    if (!column.includes(orderKey)) {
                        isSemanticCorrect = false;
                    }
                }
            }
        }
        return isSemanticCorrect;
    }

    private static checkFilter(whereClause: any): boolean {
        const filterKeys: string[] = Object.keys(whereClause);
        const filterKey = filterKeys[0];
        let isFilterCorrect = true;
        if (filterKey === "OR" || filterKey === "AND") {
            const logicArray: object[] = whereClause[filterKey];
            if (logicArray.length === 0) {
                isFilterCorrect = false;
            } else {
                for (const logicObj of logicArray) {
                    if (!this.checkFilter(logicObj)) {
                        isFilterCorrect = false;
                    }
                }
                isFilterCorrect = true;
            }
        } else if (filterKey === "LT" || filterKey === "GT" || filterKey === "EQ") {
            const mComp: object = whereClause[filterKey];
            if (Object.keys(mComp).length !== 1) {
                isFilterCorrect = false;
            }
            if (!this.checkMKeyExist(Object.keys(mComp)[0])) {
                isFilterCorrect = false;
            }
            if (typeof Object.values(mComp)[0] !== "number") {
                isFilterCorrect = false;
            }
        } else if (filterKey === "IS") {
            const sComp: object = whereClause[filterKey];
            if (Object.keys(sComp).length !== 1) {
                isFilterCorrect = false;
            }
            if (!this.checkSKeyExist((Object.keys(sComp)[0]))) {
                isFilterCorrect = false;
            }
            if (!this.checkScompInputString(Object.values(sComp)[0])) {
                isFilterCorrect = false;
            }
        } else if (filterKey === "NOT") {
            const not: object = whereClause[filterKey];
            if (Object.keys(not).length !== 1) {
                isFilterCorrect = false;
            } else {
                isFilterCorrect = this.checkFilter(not);
            }
        } else {
            isFilterCorrect = false;                      // Filter Key is Not one of those listed in EBNF
        }
        return isFilterCorrect;
}

    // Check whether the input key is a key in the courses dataset
    // The given key must be one of the key in the courses dataset, otherwise we don't have the key
    private static checkKeyExist(key: string): boolean {
        return key === "courses_dept" || key === "courses_id" || key === "courses_instructor" || key === "courses_title"
            || key === "courses_uuid" || key === "courses_avg" || key === "courses_pass" || key === "courses_fail"
            || key === "courses_audit" || key === "courses_year";
    }

    private static checkMKeyExist(key: string): boolean {
        return key === "courses_avg" || key === "courses_pass" || key === "courses_fail"
            || key === "courses_audit" || key === "courses_year";
    }

    private static checkSKeyExist(key: string): boolean {
        return key === "courses_dept" || key === "courses_id" || key === "courses_instructor" || key === "courses_title"
            || key === "courses_uuid" ;
    }

    private static checkScompInputString(inputString: string): boolean {
        if (inputString.length === 0) {
            return true;
        } else if (inputString.length === 1) {
            return true;
        } else if (inputString.length === 2) {
            return true;
        } else {
            const inputStringArray: string[] = inputString.split("");
            const inputStringLength: number = inputString.length;
            for (let i = 1; i < inputStringLength - 1; i++) {
                if (inputStringArray[i] === "*") {
                    return false;
                }
            }
            return true;
        }
    }
}
