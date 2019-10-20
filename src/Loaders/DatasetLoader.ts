import {DataSet} from "../Datasets/DataSet";

export abstract class DatasetLoader {
    private id: string;
    protected content: string;

    constructor(content: string, id: string) {
        this.content = content;
        this.id = id;
    }

    /**
     * Load the data from dataset.
     * Will reject if the error occurs, or the dataset is not Valid.
     * Will fulfilled if the dataset is successfully added.
     */
    public abstract getDataset(): Promise<DataSet>;
}
