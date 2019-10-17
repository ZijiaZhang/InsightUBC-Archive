import Log from "../src/Util";
import * as fs from "fs-extra";
import {InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";
import {DataSetDataCourse, IDataRowCourse} from "../src/Datasets/DataSetDataCourse";
import * as JSZip from "jszip";
import {JsonParser} from "../src/Loaders/Parsers/JsonParser";
import {expect} from "chai";
import {CompOperators} from "../src/Operators";

describe("Dataset Test", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        coursesEmpty: "./test/data/coursesEmpty.zip",
        coursesNoCourseFolder: "./test/data/coursesNoCourseFolder.zip",
        coursesOneInvalidFile: "./test/data/coursesWithOneInvalidFile.zip",
        coursesWithNoValidFile: "./test/data/coursesWithNoValidFile.zip",
        coursesWithOneFileNoSection: "./test/data/coursesWithOneFileNoSection.zip",
    };
    let datasets: { [id: string]: string } = {};
    let dataset: DataSetDataCourse;
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
                let id = "courses";
                fs.removeSync(cacheDir);
                fs.mkdirSync(cacheDir);
                dataset = new DataSetDataCourse("courses");
                return JSZip.loadAsync(datasets["courses"], {base64: true}).then(
                    (zipFile: JSZip) => {
                        let allPromise: Array<Promise<string>> = [];
                        zipFile.forEach((relativePath, file) => {
                            let names = relativePath.split("/");
                            if (names[0] !== "courses") {
                                return;
                            }
                            if (!file.dir) {
                                allPromise.push(file.async("text"));
                            }
                        });
                        return Promise.all(allPromise).then((datas) => {
                            for (let data of datas) {
                                let dataInFile =
                                    JsonParser.parseData(data, InsightDatasetKind.Courses) as IDataRowCourse[];
                                if (dataInFile != null) {
                                    for (let dataRow of dataInFile) {
                                        dataset.addData(dataRow);
                                    }
                                }
                            }
                            resolve();
                        });
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
});
