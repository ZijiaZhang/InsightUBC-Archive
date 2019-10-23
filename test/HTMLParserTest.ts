import {HTMLParser} from "../src/Loaders/Parsers/HTMLParser";
import {expect} from "chai";

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
        expect(HTMLParser.getLinkofChild(parser)).equals(null);
   });
});
