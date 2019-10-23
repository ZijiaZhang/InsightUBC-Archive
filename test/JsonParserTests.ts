import {JsonParser} from "../src/Loaders/Parsers/JsonParser";
import {InsightDatasetKind} from "../src/controller/IInsightFacade";
import {expect} from "chai";

describe("JSONParser", function () {
    it("should be able to handle invalid json file", function () {
        expect(JsonParser.parseData("{}", InsightDatasetKind.Courses)).equals(null);
    });
    it("should be return empty set", function () {
        expect(JsonParser.parseData("{\"result\":[{}]}", InsightDatasetKind.Courses)).equals(null);
    });
});
