import Log from "../src/Util";
import * as fs from "fs-extra";
import {InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";
import * as JSZip from "jszip";
import {JsonParser} from "../src/Loaders/Parsers/JsonParser";
import {expect} from "chai";
import {CompOperators} from "../src/Operators";
import {DataSetDataRoom} from "../src/Datasets/DataSetDataRoom";
import {DatasetLoaderRooms} from "../src/Loaders/DatasetLoaderRooms";

describe("Dataset Test", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        room: "./test/data/rooms.zip",
        roomMiss: "./test/data/rooms_MissingFiles.zip",
        roomTwoTable: "./test/data/rooms_twoTable.zip",
        roomNoBuilding: "./test/data/rooms_NoBuilding.zip"
    };
    let datasets: { [id: string]: string } = {};
    let dataset: DataSetDataRoom;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        return new Promise((resolve) => {
            Log.test(`BeforeTest: ${this.currentTest.title}`);
            try {
                let id = "room";
                fs.removeSync(cacheDir);
                fs.mkdirSync(cacheDir);
                const ds = datasetsToLoad[id];
                const data = fs.readFileSync(ds).toString("base64");
                let loader = new DatasetLoaderRooms(data, id);
                loader.getDataset().then(
                        (datas) => {
                            dataset = datas;
                            resolve();
                        }
                    );
            } catch (err) {
                Log.error(err);
            }
        });
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("should have correct amount of data", () => {
        expect(dataset.getMetaData().numRows).equal(364);
    });

    it("should unload correctly", () => {
        return dataset.unloadDataSet().then(
            () => expect(dataset.getAllData().length === 0)
        ).catch(() => expect.fail("Should not be rejected"));
    });

    it("should unload correctly and then load correctly", () => {
        return dataset.unloadDataSet().then(
            () => {
                dataset.loadDataSet().then( () => {
                    expect(dataset.getAllData().length).equal(364);
                });
            }
        ).catch(() => expect.fail("Should not be rejected"));
    });
});
