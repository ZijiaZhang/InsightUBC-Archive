import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs";
import Log from "../Util";
import {DataSet, IDataRow} from "./DataSet";
import {CompOperators} from "../Operators";

export interface IDataRowRoom extends IDataRow {
    [key: string]: string | number;

    fullname: string;
    shortname: string;
    number: string;
    name: string;
    address: string;
    lat: number;
    lon: number;
    seats: number;
    type: string;
    furniture: string;
    href: string;
}

export class DataSetDataRoom extends DataSet {

    private fullname: string[] = [];
    private shortname: string[] = [];
    private number: string[] = [];
    private name: string[] = [];
    private address: string[] = [];
    private lat: number[] = [];
    private lon: number[] = [];
    private seats: number[] = [];
    private type: string[] = [];
    private furniture: string[] = [];
    private href: string[] = [];

    /**
     *
     * @param name
     * Initialize Insight Dataset using name.
     */
    constructor(name: string) {
        super();
        this.metaData = {
            id: name,
            kind: InsightDatasetKind.Rooms,
            numRows: 0
        };
        this.fileLocation = "data/" + name + ".json";
    }

    public addData(data: IDataRowRoom): boolean {
        if (!this.datasetLoaded) {
            return false;
        }
        this.fullname.push(data.fullname);
        this.shortname.push(data.shortname);
        this.number.push(data.number);
        this.name.push(data.name);
        this.address.push(data.address);
        this.lat.push(data.lat);
        this.lon.push(data.lon);
        this.seats.push(data.seats);
        this.type.push(data.type);
        this.furniture.push(data.furniture);
        this.href.push(data.href);
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
                this.fullname = parsedJson.fullname;
                this.shortname = parsedJson.shortname;
                this.number = parsedJson.number;
                this.name = parsedJson.name;
                this.address = parsedJson.address;
                this.lat = parsedJson.lat;
                this.lon = parsedJson.lon;
                this.seats = parsedJson.seats;
                this.type = parsedJson.type;
                this.furniture = parsedJson.furniture;
                this.href = parsedJson.href;
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
                        this.fullname = [];
                        this.shortname = [];
                        this.number = [];
                        this.name = [];
                        this.address = [];
                        this.lat = [];
                        this.lon = [];
                        this.seats = [];
                        this.type = [];
                        this.furniture = [];
                        this.href = [];
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

    public getAllData(): IDataRowRoom[] {
        let results: IDataRowRoom[] = [];
        for (let i = 0; i < this.fullname.length; i++) {
            results.push({
                fullname: this.fullname[i],
                shortname: this.shortname[i],
                number: this.number[i],
                name: this.name[i],
                address: this.address[i],
                lat: this.lat[i],
                lon: this.lon[i],
                seats: this.seats[i],
                type: this.type[i],
                furniture: this.furniture[i],
                href: this.href[i]
            });
        }
        return results;
    }

}
