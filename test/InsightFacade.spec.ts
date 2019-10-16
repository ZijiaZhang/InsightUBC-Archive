import {expect} from "chai";
import * as fs from "fs-extra";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        coursesEmpty: "./test/data/coursesEmpty.zip",
        coursesNoCourseFolder: "./test/data/coursesNoCourseFolder.zip",
        coursesOneInvalidFile: "./test/data/coursesWithOneInvalidFile.zip",
        coursesWithNoValidFile: "./test/data/coursesWithNoValidFile.zip",
        coursesWithOneFileNoSection: "./test/data/coursesWithOneFileNoSection.zip",
        room: "./test/data/rooms.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
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
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        let testResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return testResult.then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    it("Should not add a Empty dataset", function () {
        const id: string = "coursesEmpty";
        const expected: string[] = [id];
        let testResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return testResult.then((result: string[]) => {
            expect.fail(result, expected, "Should not have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should add a dataset with one invalid File", function () {
        const id: string = "coursesOneInvalidFile";
        const expected: string[] = [id];
        let testResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return testResult.then((result: string[]) => {
            expect(result).to.deep.equal(expected);
            return insightFacade.listDatasets().then((results: InsightDataset[]) => {
                expect(results[0].numRows).equal(2);
            });
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should not add a dataset with no Course Folder", function () {
        const id: string = "coursesNoCourseFolder";
        const expected: string[] = [id];
        let testResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return testResult.then((result: string[]) => {
            expect.fail(result, expected, "Should be rejected");
        }).catch((err: any) => {
            if (!(err instanceof InsightError)) {
                expect.fail(err, InsightError, "Wrong Return Type");
            }
        });
    });

    it("Should not add a dataset with no Valid Course", function () {
        const id: string = "coursesWithNoValidFile";
        const expected: string[] = [id];
        let testResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return testResult.then((result: string[]) => {
            expect.fail(result, expected, "Should be rejected");
        }).catch((err: any) => {
            if (!(err instanceof InsightError)) {
                expect.fail(err, InsightError, "Wrong Return Type");
            }
        });
    });

    it("Should be rejected as empty id", function () {
        const id: string = "";
        const expected: string[] = [];
        const course = "courses";
        return insightFacade.addDataset(id, datasets[course],
        InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should be rejected.");
        }).catch((err: InsightError | any) => {
            if (err instanceof InsightError) {
                const id2 = "courses";
                const expected2: string[] = ["courses"];
                return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses)
                    .then((result: string[]) => {
                    expect(result).to.deep.equal(expected2);
                }).catch((err2: any) => {
                    expect.fail(err2, expected, "Should not be rejected");
                });
            } else {
                expect.fail(err, expected, "Incorrect Error Type");
            }
        });
    });

    it("Should be rejected as id null", function () {
        const id: string | null = null;
        const expected: string[] = [];
        const course = "courses";
        return insightFacade.addDataset(id,
        datasets[course], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should be rejected.");
        }).catch((err: InsightError | any) => {
            if (err instanceof InsightError) {
                const id2 = "courses";
                const expected2: string[] = ["courses"];
                return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses)
                    .then((result: string[]) => {
                    expect(result).to.deep.equal(expected2);
                }).catch((err2: any) => {
                    expect.fail(err2, expected, "Should not be rejected");
                });
            } else {
                expect.fail(err, expected, "Incorrect Error Type");
            }
        });
    });

    it("Should be rejected as invalid id", function () {
        const id: string = "   ";
        const expected: string[] = [];
        const course = "courses";
        return insightFacade.addDataset(id, datasets[course],
        InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should be rejected.");
        }).catch((err: InsightError | any) => {
            if (err instanceof InsightError) {
                const id2 = "courses";
                const expected2: string[] = ["courses"];
                return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses)
                    .then((result: string[]) => {
                        expect(result).to.deep.equal(expected2);
                    }).catch((err2: any) => {
                    expect.fail(err2, expected, "Should not be rejected");
                });
            } else {
                expect.fail(err, expected, "Incorrect Error Type");
            }
        });
    });

    it("Should be rejected as invalid content", function () {
        const id: string = "courses";
        const expected: string[] = [];
        return insightFacade.addDataset(id, "pppppp", InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should be rejected.");
        }).catch((err: InsightError | any) => {
            if (err instanceof InsightError) {
                const id2 = "courses";
                const expected2: string[] = ["courses"];
                return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses)
                    .then((result: string[]) => {
                        expect(result).to.deep.equal(expected2);
                    }).catch((err2: any) => {
                    expect.fail(err2, expected, "Should not be rejected");
                });
            } else {
                expect.fail(err, expected, "Incorrect Error Type");
            }
        });
    });

    it("Should be rejected as invalid id with underscore", function () {
        const id: string = "___";
        const expected: string[] = [];
        const course = "courses";
        return insightFacade.addDataset(id,
        datasets[course], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should be rejected.");
        }).catch((err: InsightError | any) => {
            if (err instanceof InsightError) {
                const id2 = "courses";
                const expected2: string[] = ["courses"];
                return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses)
                    .then((result: string[]) => {
                        expect(result).to.deep.equal(expected2);
                    }).catch((err2: any) => {
                    expect.fail(err2, expected, "Should not be rejected");
                });
            } else {
                expect.fail(err, expected, "Incorrect Error Type");
            }
        });
    });

    it("Should be rejected as duplicated id", function () {
        const id1: string = "courses";
        const expected1: string[] = ["courses"];
        const id2: string = "courses";
        const expected2: string[] = ["courses"];
        return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected1);
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses)
                .then((result2: string[]) => {
                    expect.fail(result2, expected2, "Should be rejected.");
                })
                .catch((err: InsightError | any) => {
                    if (err instanceof InsightError) {
                        const id3 = "ppp";
                        const expected3: string[] = ["courses", "ppp"];
                        return insightFacade.addDataset(id3, datasets[id2], InsightDatasetKind.Courses)
                            .then((result3: string[]) => {
                                expect(result3).to.deep.equal(expected3);
                            })
                            .catch((err2: any) => {
                                expect.fail(err2, expected3, "Should not be rejected");
                            });
                    } else {
                        expect.fail(err, expected2, "Incorrect Error Type");
                    }
                });
        }).catch((err: any) => {
            expect.fail(err, expected1, "Should not be rejected.");
        });
    });

    it("Should remove data", function () {
        const id: string = "courses";
        const expected: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .catch((err: InsightError | any) => {
                expect.fail(err, expected, "Should not be rejected.");
            })
            .then((r: string[]) => {
                return insightFacade.removeDataset(id)
                    .then((result: string) => {
                        expect(result).equal(expected);
                    })
                    .catch((err: NotFoundError | InsightError | any) => {
                        expect.fail(err, expected, "Should not be rejected.");
                    });
            });

    });

    it("Should not remove data in empty dataset.", function () {
        const id: string = "courses";
        const expected: string = "courses";
        const expectedIds: string[] = ["courses"];
        return insightFacade.removeDataset(id)
            .then((result: string) => {
                expect.fail(result, expected, "Should  be rejected.");
            })
            .catch((err: NotFoundError | InsightError | any) => {
                if (err instanceof NotFoundError) {
                    return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
                        .then((result: string[]) => {
                            expect(result).to.deep.equal(expectedIds);
                        })
                        .catch((result: string[]) => {
                            expect.fail(result, expected, "Should not be rejected.");
                        });
                } else {
                    expect.fail(err, expected, "Wrong Error type.");
                }
            });

    });

    it("Should not remove data as id is null.", function () {
        const id: string | null = null;
        const expected: string = "courses";
        const expectedIds: string[] = ["courses"];
        return insightFacade.removeDataset(id)
            .then((result: string) => {
                expect.fail(result, expected, "Should  be rejected.");
            })
            .catch((err: NotFoundError | InsightError | any) => {
                if (err instanceof InsightError) {
                    return insightFacade.addDataset(expected, datasets[expected], InsightDatasetKind.Courses)
                        .then((result: string[]) => {
                            expect(result).to.deep.equal(expectedIds);
                        })
                        .catch((result: string[]) => {
                            expect.fail(result, expected, "Should not be rejected.");
                        });
                } else {
                    expect.fail(err, expected, "Wrong Error type.");
                }
            });

    });

    it("Should not remove data with non-empty DataSet because the id Does not Exist", function () {
        const id: string = "courses";
        const expected: string[] = ["courses", "id"];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .catch((err: InsightError | any) => {
                expect.fail(err, expected, "Should not be rejected.");
            })
            .then((r: string[]) => {
                return insightFacade.removeDataset("id")
                    .then((result: string) => {
                        expect.fail(result, expected, "Should be rejected.");
                    })
                    .catch((err: NotFoundError | InsightError | any) => {
                        if (err instanceof NotFoundError) {
                            return insightFacade.addDataset("id", datasets[id], InsightDatasetKind.Courses)
                                .then((result: string[]) => {
                                    expect(result).to.deep.equal(expected);
                                });
                        } else {
                            expect.fail(err, expected, "Wrong Type");
                        }
                    });
            });
    });

    it("Should not remove data because invalid id", function () {
        const id: string = "courses";
        const expected: string[] = ["courses", "id"];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .catch((err: InsightError | any) => {
                expect.fail(err, expected, "Should not be rejected.");
            })
            .then((r: string[]) => {
                return insightFacade.removeDataset("__")
                    .then((result: string) => {
                        expect(result).to.deep.equal(expected);
                    })
                    .catch((err: NotFoundError | InsightError | any) => {
                        if (err instanceof InsightError) {
                            return insightFacade.addDataset("id", datasets[id], InsightDatasetKind.Courses)
                                .then((result: string[]) => {
                                    expect(result).to.deep.equal(expected);
                                });
                        }
                    });
            });
    });
    it("Should list When There is no data", function () {
        const id: string = "courses";
        const expected: string = "courses";
        return insightFacade.listDatasets().then((value: InsightDataset[]) => {
            expect(value.length).equal(0);
        }).catch((err: any) => expect.fail(err, expected, "Should not be rejected"));
    });

    it("Should list When There is some data", function () {
        const id: string = "courses";
        const expected: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((values: string[]) => {
            return insightFacade.listDatasets().then((value: InsightDataset[]) => {
                expect(value.length).equal(1);
            }).catch((err: any) => expect.fail(err, expected, "Should not be rejected"));
        });
    });

    it(" Should Perform Simple Query", function () {
        return insightFacade.addDataset("courses", datasets["courses"], InsightDatasetKind.Courses).then( () => {
            return insightFacade.performQuery(JSON.parse("{\n" +
                "        \"WHERE\": {\n" +
                "            \"GT\": {\n" +
                "                \"courses_avg\":97\n" +
                "            }\n" +
                "        },\n" +
                "        \"OPTIONS\": {\n" +
                "            \"COLUMNS\": [\n" +
                "               \"courses_dept\",\n" +
                "                \"courses_avg\"\n" +
                "            ],\n" +
                "            \"ORDER\": \"courses_avg\"\n" +
                "        }\n" +
                "    }")).then( (result) => {
                    expect(result.length).equal(49);
            }).catch((err) => {
                expect.fail("Should not be rejected.");
            });
        });
    });

    it("Should load Room Dataset", function () {
        return insightFacade.addDataset("room", datasets["room"], InsightDatasetKind.Rooms).then(
            (result) => {
                expect(result.length).equal(364);
            }
        ).catch((e) => expect.fail("Shoud not be rejected"));
    });
});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: any } = {
        courses: {id: "courses", path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
        coursesSmall: {id: "coursesSmall",
            path: "./test/data/coursesWithOneInvalidFile.zip", kind: InsightDatasetKind.Courses}
    };
    let insightFacade: InsightFacade = new InsightFacade();
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        for (const key of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[key];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(ds.id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * For D1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    insightFacade.performQuery(test.query).then((result) => {
                        TestUtil.checkQueryResult(test, result, done);
                    }).catch((err) => {
                        TestUtil.checkQueryResult(test, err, done);
                    });
                });
            }
        });
    });
});
