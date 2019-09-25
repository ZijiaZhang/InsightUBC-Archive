import {InsightDataset, InsightDatasetKind} from "./controller/IInsightFacade";
import * as JSZip from "jszip";
import {stringify} from "querystring";
import * as fs from "fs";
import Log from "./Util";

export interface IDataRowCourse {
    [key: string]: string|number;
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

export class DataSetDataCourse {
    private metaData: InsightDataset;
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
    private fileLocation: string = "";
    private datasetLoaded = true;
    /**
     *
     * @param name
     * @param kind
     * Initialize Insight Dataset using name, kind.
     */
    constructor(name: string, kind: InsightDatasetKind) {
        this.metaData = {
            id: name,
        kind: kind,
        numRows: 0
    };
        this.fileLocation = name + ".zip";
    }

    /**
     *
     * @param data the data that add to the dataSet
     *
     * @return boolean
     *
     * return True if the success, False other wise.
     * Add data to DataSet. If dataset is not loaded, return false.
     */
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

    /**
     * Get the metaData
     */
    public getMetaData(): InsightDataset {
        return this.metaData;
    }

    /**
     * @return Promise<string>
     * Will load the dataset from disk
     * Will reject if error occurs.
     */
    public loadDataSet(): Promise<string> {
        return new Promise<string>( (resolve, reject) => {
            if ( this.datasetLoaded) {
                return resolve("Dataset is Already Loaded");
            }
            let fileData: string = fs.readFileSync(this.fileLocation).toString("base64");
            JSZip.loadAsync(fileData, {base64: true}).then(
                (zipFile: JSZip) => {
                    zipFile.files["data.json"]
                        .async("text").then(
                        (data) => {
                            try {
                            let parsedJson = JSON.parse(data);
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
                        }
                    ); });
        });
    }

    /**
     * @return Promise<string>
     * Will save the dataset to disk loaction of <dataset name>.zip
     * Will reject if error occurs.
     */
    public saveDataSet(): Promise<string> {
        return new Promise<string>( (resolve, reject) => {
            let jsonFile: string = JSON.stringify(this);
            let zip = new JSZip();
            zip.file("data.json", jsonFile);
            zip.generateNodeStream()
                .pipe(fs.createWriteStream(this.fileLocation))
                .on("finish", function () {
                    // tslint:disable-next-line:no-console
                    console.log("Saved");
                    resolve("File Saved");
                }).on("error", function () {
                    reject("Cannot Save File");
            });
        });
    }

    /**
     * Will save the data set and Unload the dataset.
     * @return Promise<string>
     *     Will reject if error occurs.
     *     If dataset is already unloaded, resolve promise.
     */
    public unloadDataSet(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.saveDataSet().then((result: string) => {
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

}
