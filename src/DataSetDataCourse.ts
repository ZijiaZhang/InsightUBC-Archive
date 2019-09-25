import {InsightDataset, InsightDatasetKind} from "./controller/IInsightFacade";

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
    }

    /**
     *
     * @param data the data that add to the dataSet
     * Add data to DataSet.
     */
    public addData(data: IDataRowCourse) {
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
    }

    public getMetaData(): InsightDataset {
        return this.metaData;
    }
}
