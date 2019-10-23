import {HTMLParser} from "../src/Loaders/Parsers/HTMLParser";
import {expect} from "chai";
import Log from "../src/Util";

const parse5 = require("parse5");
describe("HTMLParser", function () {
   it("Should extract empty string", function () {
       let parser = parse5.parse("<html></html>");
       expect(HTMLParser.extractTextFromNode(parser)).equals("");
   });

   it("Should getRows in table", function () {
        let parser = parse5.parse("<html></html>");
        expect(HTMLParser.getRowsInTable(parser)).to.deep.equals([]);
   });

   it("Should Links", function () {
        let parser = parse5.parse("<html></html>");
        Log.info(parser);
        expect(HTMLParser.getLinkofChild(parser)).equals(null);
   });
});
