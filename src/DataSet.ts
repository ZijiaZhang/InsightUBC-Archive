import {InsightDataset} from "./controller/IInsightFacade";
import {IDataRowCourse} from "./DataSetDataCourse";

export interface IDataRow {
    rowNumber?: number;
}

export abstract class DataSet {
    protected metaData: InsightDataset;

    public abstract getData(): Promise<IDataRow[]>;

    /**
     *
     * @param data the data that add to the dataSet
     *
     * @return boolean
     *
     * return True if the success, False other wise.
     * Add data to DataSet. If dataset is not loaded, return false.
     */

    public abstract addData(data: IDataRowCourse): boolean;

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

    public abstract unloadDataSet(): Promise<string>
}
