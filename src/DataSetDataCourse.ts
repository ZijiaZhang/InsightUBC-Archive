import {InsightDatasetKind, InsightError} from "./controller/IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs";
import Log from "./Util";
import {DataSet, IDataRow} from "./DataSet";
import {CompOperators} from "./Query";

export interface IDataRowCourse extends IDataRow {
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
    private fileLocation: string = "";
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

    public addData(data: IDataRow): boolean {
        let dataRowData = data as IDataRowCourse;
        if (!this.datasetLoaded) {
            return false;
        }
        this.dept.push(dataRowData.dept);
        this.id.push(dataRowData.id);
        this.instructor.push(dataRowData.instructor);
        this.title.push(dataRowData.title);
        this.uuid.push(dataRowData.uuid);
        this.avg.push(dataRowData.avg);
        this.pass.push(dataRowData.pass);
        this.fail.push(dataRowData.fail);
        this.audit.push(dataRowData.audit);
        this.year.push(dataRowData.year);
        this.metaData.numRows += 1;
        return true;
    }

    public loadDataSet(): Promise<string> {
        return new Promise<string>( (resolve, reject) => {
            if ( this.datasetLoaded) {
                return resolve("Dataset is Already Loaded");
            }
            try {
                let fileData: string = fs.readFileSync(this.fileLocation).toString();
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
        return new Promise<string>( (resolve, reject) => {
            let jsonFile: string = JSON.stringify(this); // Transform the JSON Object to string.
            try {
                fs.writeFileSync(this.fileLocation, jsonFile);
                resolve("File Saved");
            } catch (e) {
                reject("Error Saving File");
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

    public getData(column: string, comp: CompOperators,
                   value: string| number, not: boolean): IDataRowCourse[]|InsightError {
        if (!this.datasetLoaded) {return new InsightError("Dataset Not Loaded"); }
        if (!this.listEntries().includes(column)) {return new InsightError("Column not found"); }
        let indexes: number[] = [];
        let data = this.get(column);
        if (data == null) {return new InsightError("Error Getting Data"); }
        let compare;
        switch (comp) {
            case CompOperators.EQ: compare = (x: any, y: any) => x === y; break;
            case CompOperators.GT: compare = (x: any, y: any) => x > y; break;
            case CompOperators.LT: compare = (x: any, y: any) => x < y; break;
            case CompOperators.IS: compare = (x: any, y: any) => x === y; break;
        }
        for (let index = 0; index < data.length; index++) {
            if (not !== compare(data[index], value)) {
                indexes.push(index);
            }
        }
        return this.getAll(indexes);
    }

    public listEntries(): string[] {
        return [ "dept", "id", "instructor", "title", "uuid", "avg", "pass", "fail", "audit", "year"];
    }

    protected get(column: string): string[] | number[] | null {
        switch (column) {
            case "dept": return this.dept;
            case "id": return this.id;
            case "instructor": return this.instructor;
            case "title": return this.title;
            case "uuid": return this.uuid;
            case "avg": return this.avg;
            case "pass": return this.pass;
            case "fail": return this.fail;
            case "audit": return this.audit;
            case "year": return this.year;
            default: return null;
        }
    }

    protected getAll(indexes: number[]): IDataRowCourse[] {
        let results: IDataRowCourse[] = [];
        for (let index of indexes) {
            results.push( {
                dept: this.dept[index],
                id: this.id[index],
                instructor: this.instructor[index],
                title: this.title[index],
                uuid: this.uuid[index],
                avg: this.avg[index],
                pass: this.pass[index],
                fail: this.fail[index],
                audit: this.audit[index],
                year: this.year[index]
            });
        }
        return results;
    }

    public getAllData(): IDataRowCourse[] {
        let results: IDataRowCourse[] = [];
        for (let i = 0; i < this.dept.length; i++) {
            results.push( {
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
