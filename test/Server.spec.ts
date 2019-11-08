import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import * as fs from "fs";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import {ITestQuery} from "./InsightFacade.spec";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        server.start().catch((e) => {
            expect.fail(e);
        });
    });

    after(function () {
        // TODO: stop server here once!
        server.stop();
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // TODO: read your courses and rooms datasets here once!
    let courseDataset = fs.readFileSync("./test/data/courses.zip");
    let roomDataset = fs.readFileSync("./test/data/rooms.zip");
    let smallDataset = fs.readFileSync("./test/data/coursesWithOneInvalidFile.zip");

    // Sample on how to format PUT requests

    it("PUT test for courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .send(courseDataset)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(res.body);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("Add Invalid Dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courseasdadadsadass")
                .send(courseDataset)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(res.body);
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("Add Invalid Dataset ID", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/aa_aaaa/courses")
                .send(courseDataset)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(res.body);
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("PUT test for room dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/rooms/rooms")
                .send(roomDataset)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(res.body);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("Remove dataset for courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/courses")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(res.body);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("Remove dataset again for courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/courses")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(res.body);
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err.response.body);
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("Remove dataset for invalid Query", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/my_courses")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(res.body);
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err.response.body);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("PUT test for courses dataset again", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .send(courseDataset)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(res.body);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("PUT test for small courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/coursesSmall/courses")
                .send(smallDataset)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(res.body);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });


    it("Get List Dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/datasets")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(res.body);
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.deep.equal([{id: "rooms", kind: "rooms", numRows: 364},
                        {id: "courses", kind: "courses", numRows: 64612},
                        {id: "coursesSmall", kind: "courses", numRows: 2}]);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    let tests: ITestQuery[];
    try {
        tests = TestUtil.readTestQueries();
    } catch (e) {
        expect.fail(e);
    }

    // let t = tests[72];

    it("Query dataset", function () {
        let promises: Array<Promise<any>> = [];
        for (let t of tests) {
            let p = new Promise((resolve, reject) => {
                try {
                    return chai.request("http://localhost:4321")
                        .post("/query")
                        .send(t.query)
                        .then(function (res: Response) {
                            // some logging here please!
                            // Log.trace(res.body);
                            if (!t.isQueryValid) {
                                expect.fail();
                            } else {
                                expect(res.body.result).to.deep.members(t.result);
                            }
                            resolve();
                        })
                        .catch(function (err) {
                            // some logging here please!
                            if (t.isQueryValid) {
                                Log.trace(t.filename);
                                Log.trace(err);
                                expect.fail();
                            } else {
                                Log.trace(t.filename, err.response.body);
                                expect(err.status).to.be.equal(400);
                            }
                            resolve();
                        });
                } catch (err) {
                    reject("Error");
                }
            });
            promises.push(p);
        }
        return Promise.all(promises).then(() => Log.trace("Good")).catch((e) => Log.trace(e));
    });
    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation

    it("echo", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/echo/aaa")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(res.body);
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.deep.equal("aaa...aaa");
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("getStatic", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/loading.gif")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(res.body);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("getStatic", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/loading.giffffff")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(res.body);
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect(err.status).to.be.equal(500);
                });
        } catch (err) {
            // and some more logging here!
        }
    });
});
