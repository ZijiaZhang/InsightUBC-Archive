import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs";
import Log from "../Util";
import {DataSet, IDataRow} from "./DataSet";

export interface IDataRowCourse extends IDataRow {
    [key: string]: string | number;

    dept: string;
    id: string;
    instructor: string;
    title: string;
    uuid: string;
    avg: number;
    pass: number;
    fail: number;
    audit: number;
    year: number;
}

export class DataSetDataCourse extends DataSet {

    private dept: string[] = [];
    private id: string[] = [];
    private instructor: string[] = [];
    private title: string[] = [];
    private uuid: string[] = [];
    private avg: number[] = [];
    private pass: number[] = [];
    private fail: number[] = [];
    private audit: number[] = [];
    private year: number[] = [];

    /**
     *
     * @param name
     * Initialize Insight Dataset using name.
     */
    constructor(name: string) {
        super();
        this.metaData = {
            id: name,
            kind: InsightDatasetKind.Courses,
            numRows: 0
        };
        this.fileLocation = "data/" + name + ".json";
    }

    public addData(data: IDataRowCourse): boolean {
        if (!this.datasetLoaded) {
            return false;
        }
        this.dept.push(data.dept);
        this.id.push(data.id);
        this.instructor.push(data.instructor);
        this.title.push(data.title);
        this.uuid.push(data.uuid);
        this.avg.push(data.avg);
        this.pass.push(data.pass);
        this.fail.push(data.fail);
        this.audit.push(data.audit);
        this.year.push(data.year);
        this.metaData.numRows += 1;
        return true;
    }

    public loadDataSet(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (this.datasetLoaded) {
                return resolve("Dataset is Already Loaded");
            }
            let fileData: string = fs.readFileSync(this.fileLocation).toString();
            try {
                let parsedJson = JSON.parse(fileData);
                this.audit = parsedJson.audit;
                this.avg = parsedJson.avg;
                this.dept = parsedJson.dept;
                this.fail = parsedJson.fail;
                this.id = parsedJson.id;
                this.instructor = parsedJson.instructor;
                this.pass = parsedJson.pass;
                this.title = parsedJson.title;
                this.uuid = parsedJson.uuid;
                this.year = parsedJson.year;
                this.datasetLoaded = true;
                resolve("Data loaded");
            } catch (e) {
                reject("Error Reading File");
            }
        });
    }

    public saveDataSet(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let jsonFile: string = JSON.stringify(this); // Transform the JSON Object to string.
            try {
                fs.writeFileSync(this.fileLocation, jsonFile);
                // Hint from
                // https://stackoverflow.com/questions/15543235/checking-if-writefilesync-successfully-wrote-the-file
                // Use try catch block to get error.
                return resolve("Save Successfully");
            } catch (e) {
                return reject("Error Saving file");
            }
        });
    }

    public unloadDataSet(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
                return this.saveDataSet().then((result: string) => {
                        if (!this.datasetLoaded) {
                            return resolve("Dataset Already Unloaded");
                        }
                        this.audit = [];
                        this.avg = [];
                        this.dept = [];
                        this.fail = [];
                        this.id = [];
                        this.instructor = [];
                        this.pass = [];
                        this.title = [];
                        this.uuid = [];
                        this.year = [];
                        this.datasetLoaded = false;
                        resolve("Dataset unloaded");
                    }
                ).catch((err: any) => {
                    Log.error("Error unload Dataset");
                    reject();
                });
            }
        );
    }

    // public listEntries(): string[] {
    //     return ["dept", "id", "instructor", "title", "uuid", "avg", "pass", "fail", "audit", "year"];
    // }
    //
    // protected get(column: string): string[] | number[] | null {
    //     switch (column) {
    //         case "dept":
    //             return this.dept;
    //         case "id":
    //             return this.id;
    //         case "instructor":
    //             return this.instructor;
    //         case "title":
    //             return this.title;
    //         case "uuid":
    //             return this.uuid;
    //         case "avg":
    //             return this.avg;
    //         case "pass":
    //             return this.pass;
    //         case "fail":
    //             return this.fail;
    //         case "audit":
    //             return this.audit;
    //         case "year":
    //             return this.year;
    //         default:
    //             return null;
    //     }
    // }
    //
    // protected getAll(indexes: number[]): IDataRowCourse[] {
    //     let results: IDataRowCourse[] = [];
    //     for (let index of indexes) {
    //         results.push({
    //             dept: this.dept[index],
    //             id: this.id[index],
    //             instructor: this.instructor[index],
    //             title: this.title[index],
    //             uuid: this.uuid[index],
    //             avg: this.avg[index],
    //             pass: this.pass[index],
    //             fail: this.fail[index],
    //             audit: this.audit[index],
    //             year: this.year[index]
    //         });
    //     }
    //     return results;
    // }

    public getAllData(): IDataRowCourse[] {
        let results: IDataRowCourse[] = [];
        for (let i = 0; i < this.dept.length; i++) {
            results.push({
                dept: this.dept[i],
                id: this.id[i],
                instructor: this.instructor[i],
                title: this.title[i],
                uuid: this.uuid[i],
                avg: this.avg[i],
                pass: this.pass[i],
                fail: this.fail[i],
                audit: this.audit[i],
                year: this.year[i]
            });
        }
        return results;
    }

}
