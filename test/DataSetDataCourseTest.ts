import Log from "../src/Util";
import * as fs from "fs-extra";
import {InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";
import {DataSetDataCourse} from "../src/DataSetDataCourse";
import * as JSZip from "jszip";
import {JsonParser} from "../src/JsonParser";
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
                                let dataInFile = JsonParser.parseData(data, InsightDatasetKind.Courses);
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

    it("should Query Dataset", function () {
        return dataset.loadDataSet().then(
            () => {
                let result = dataset.getData("avg", CompOperators.GT, -5, false);
                if (result instanceof Array) {
                    expect(dataset.getMetaData().numRows).equal(64612);
                    return expect(result.length).equal(64612);
                } else {
                    return expect.fail("Wrong Value");
                }
            }
        );
    });

    it("should Query Dataset avg GT", function () {
        return dataset.loadDataSet().then(
            () => {
                let result = dataset.getData("avg", CompOperators.GT, 97, false);
                if (result instanceof Array) {
                    return expect(result.length).equal(49);
                } else {
                    return expect.fail("Wrong Value");
                }
            }
        );
    });

    it("should unload Dataset", function () {
        return dataset.unloadDataSet().then(
            () => {
                let result = dataset.getData("avg", CompOperators.GT, 97, false);
                if (result instanceof Array) {
                    return expect.fail("Should be Null");
                } else {
                    if (result instanceof InsightError) {
                        return expect(result.message).equal("Dataset Not Loaded");
                    } else {
                        expect.fail("Wrong Error Type");
                    }
                }
            }
        );
    });

    it("should unload Dataset and then load Dataset", function () {
        return dataset.unloadDataSet().then(
            () => {
                dataset.loadDataSet().then(
                    () => {
                        let result = dataset.getData("avg", CompOperators.GT, 97, false);
                        if (result instanceof Array) {
                            return expect(result.length).equal(49);
                        } else {
                            return expect.fail("Wrong Value");
                        }
                    }
                );
            }
        );
    });

    it("should Query Dataset pass GT", function () {
        return dataset.loadDataSet().then(
            () => {
                let result = dataset.getData("pass", CompOperators.GT, 300, false);
                if (result instanceof Array) {
                    return expect(result.length).equal(1210);
                } else {
                    return expect.fail("Wrong Value");
                }
            }
        );
    });

    it("should Query Dataset fail GT", function () {
        return dataset.loadDataSet().then(
            () => {
                let result = dataset.getData("fail", CompOperators.GT, 100, false);
                if (result instanceof Array) {
                    return expect(result.length).equal(119);
                } else {
                    return expect.fail("Wrong Value");
                }
            }
        );
    });

    it("should Query Dataset audit GT", function () {
        return dataset.loadDataSet().then(
            () => {
                let result = dataset.getData("audit", CompOperators.GT, 10, false);
                if (result instanceof Array) {
                    return expect(result.length).equal(30);
                } else {
                    return expect.fail("Wrong Value");
                }
            }
        );
    });

    it("should Query Dataset pass EQ", function () {
        return dataset.loadDataSet().then(
            () => {
                let result = dataset.getData("pass", CompOperators.EQ, 0, false);
                if (result instanceof Array) {
                    return expect(result.length).equal(7);
                } else {
                    return expect.fail("Wrong Value");
                }
            }
        );
    });

    it("should Query Dataset year EQ", function () {
        return dataset.loadDataSet().then(
            () => {
                let result = dataset.getData("year", CompOperators.EQ, 2007, false);
                if (result instanceof Array) {
                    return expect(result.length).equal(2682);
                } else {
                    return expect.fail("Wrong Value");
                }
            }
        );
    });

    it("should Query Dataset avg LT", function () {
        return dataset.loadDataSet().then(
            () => {
                let result = dataset.getData("avg", CompOperators.LT, 20, false);
                if (result instanceof Array) {
                    expect(result.length).equal(7);
                } else {
                    expect.fail("Wrong Value");
                }
            }
        ).catch((err) => expect.fail("Should not catch"));
    });

    it("should Query Dataset avg NOT LT", function () {
        return dataset.loadDataSet().then(
            () => {
                let result = dataset.getData("avg", CompOperators.LT, 97, true);
                if (result instanceof Array) {
                    expect(result.length).equal(52);
                } else {
                    expect.fail("Wrong Value");
                }
            }
        ).catch((err) => expect.fail("Should not catch"));
    });
});
