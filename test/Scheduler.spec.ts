import Log from "../src/Util";
import * as fs from "fs-extra";
import {InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";
import {DataSetDataCourse, IDataRowCourse} from "../src/Datasets/DataSetDataCourse";
import * as JSZip from "jszip";
import {JsonParser} from "../src/Loaders/Parsers/JsonParser";
import {expect} from "chai";
import {CompOperators} from "../src/Operators";
import Scheduler from "../src/scheduler/Scheduler";
import {ITestQuery} from "./InsightFacade.spec";
import TestUtil, {ISchedulerProblem} from "./TestUtil";
import {Evaluator} from "../src/scheduler/Evaluator";

describe("Scheduler Test", function () {
    let tests: ISchedulerProblem[] = [];
    let scheduler: Scheduler = new Scheduler();
    before(() => {
        tests = TestUtil.readAllSchesuleProblem();
    });

    it("Should run test problems", function () {
            for (const test of tests) {
                    let result = scheduler.schedule(test.sections, test.rooms);
                    expect(Evaluator.tempMeasure(result, Evaluator.getTotalPossibleEnrollment(test.sections)))
                        .greaterThan(0.8);
            }
    });
});
