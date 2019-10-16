import {InsightDataset, InsightError} from "./controller/IInsightFacade";
import {IDataRowCourse} from "./DataSetDataCourse";
import {CompOperators} from "./Operators";

export interface IDataRow {
    rowNumber?: number;
}

export abstract class DataSet {
    protected metaData: InsightDataset;
    protected datasetLoaded = true;

    /**
     *
     * @param data the data that add to the dataSet
     *
     * @return boolean
     *
     * return True if the success, False other wise.
     * Add data to DataSet. If dataset is not loaded, return false.
     */

    public abstract addData(data: IDataRow): boolean;

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
    public abstract loadDataSet(): Promise<string>;

    /**
     * @return Promise<string>
     * Will save the dataset to disk loaction of <dataset name>.zip
     * Will reject if error occurs.
     */

    public abstract saveDataSet(): Promise<string>;

    /**
     * Will save the data set and Unload the dataset.
     * @return Promise<string>
     *     Will reject if error occurs.
     *     If dataset is already unloaded, resolve promise.
     */

    public abstract unloadDataSet(): Promise<string>;

    /**
     * Will return all entries of Dataset.
     */
    public abstract listEntries(): string[];

    /**
     * Return the data of given column.
     * @param column  the name of the column.
     *
     * @return string[]|number[] | null
     * Will retuen null if the column does not exist.
     */
    protected abstract get(column: string): string[]|number[] | null;

    /**
     * Returns all data with given indexes
     * @param indexes The required index
     */
    protected abstract getAll(indexes: number[]): IDataRowCourse[];

    public abstract getAllData(): IDataRow[];
}
