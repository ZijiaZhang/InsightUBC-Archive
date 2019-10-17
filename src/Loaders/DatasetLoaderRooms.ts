import {DataSetDataRoom} from "../Datasets/DataSetDataRoom";
import * as JSZip from "jszip";
import {InsightError} from "../controller/IInsightFacade";
import chaiHttp = require("chai-http");
import {HTMLParser} from "./Parsers/HTMLParser";
import {DatasetLoader} from "./DatasetLoader";

const chai = require("chai");
const parse5 = require("parse5");

chai.use(chaiHttp);

export class DatasetLoaderRooms extends DatasetLoader {
    private data: JSZip;
    private dataset: DataSetDataRoom;

    constructor(content: string, id: string) {
        super(content, id);
        this.dataset = new DataSetDataRoom(id);
    }

    public getDataset(): Promise<DataSetDataRoom> {
        return new Promise<DataSetDataRoom>((resolve, reject) => {
            JSZip.loadAsync(this.content, {base64: true})
                .then((data: JSZip) => {
                    if (!("rooms/index.htm" in data.files)) {
                        return reject(new InsightError("No index.htm found in Zip"));
                    }
                    this.data = data;
                    data.file("rooms/index.htm").async("text").then((file) => {
                        const document = parse5.parse(file);
                        return this.parseHTML5(document).then(
                            () => resolve(this.dataset)
                        ).catch(() => reject(new InsightError("Error Loading data set")));
                    });
                })
                .catch(() => reject(new InsightError("Error Reading files")));
            // reject("ERROR Not implemented");
        });
    }

    /**
     * Add rows to dataset, will fulfill on finish.
     * @param doc the index.htm file
     * Will reject if no rooms are added.
     * Will fulfilled if at least one room is added.
     */
    private parseHTML5(doc: any): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let tables = HTMLParser.findAllChildNodeWithTag(doc, "table");
            // Table is the only table in the HTML.
            let promises: Array<Promise<any>> = [];
            for (let table of tables) {
                promises.push(this.handleBuildingTable(table));
            }
            Promise.all(promises).then(
                () => {
                    if (this.dataset.getMetaData().numRows === 0) {
                        return reject(this.dataset);
                    }
                    return resolve("Dataset Added");
                }
            );
        });
    }

    /**
     * Handles tables in the index.htm
     * @param table the table in index.htm
     * Will always resolve.
     * Will resolve with string "Error" if error occurs.
     */
    private handleBuildingTable(table: any): Promise<string[]> {
        let rows = HTMLParser.getRowsInTable(table);
        let promises: Array<Promise<string>> = [];
        for (let row of rows) {
            let promise = new Promise<string>((resolve1) => {
                let tableCells = HTMLParser.findAllChildNodeWithTag(row, "td");
                if (tableCells.length !== 5) {
                    return resolve1("Error Length of Building Data");
                }
                let texts = tableCells.map((x) => (HTMLParser.extractTextFromNode(x)));
                let shortname = texts[1];
                let fullname = texts[2];
                let address = texts[3];
                let filepath = "rooms" + HTMLParser.getLinkofChild(tableCells[4]).substr(1);
                let serverText = "http://cs310.students.cs.ubc.ca:11316";
                let locText = "/api/v1/project_team212/" + encodeURIComponent(address);
// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
                chai.request(serverText).get(locText).end((err: any, res: any) => {
                    let result = res.body;
                    let buildingInfo = {
                        shortname: shortname,
                        fullname: fullname,
                        address: address,
                        lon: result.lon,
                        lat: result.lat
                    };
                    this.loadAllRooms(filepath, buildingInfo).then(
                        () => resolve1("Succefully add a building")
                    ).catch(
                        () => (resolve1("Error"))
                    );
                });
            });
            promises.push(promise);
        }
        return Promise.all(promises);
    }

    /**
     * Load all rooms from the html file of the building.
     * @param path The path to the building file.
     * @param buildinginfo The info of the building that optained previously
     * Will fulfill if no error.
     * Will reject if having error reading the file.
     */
    private loadAllRooms(path: string, buildinginfo: any): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.data.file(path).async("text").then((text) => {
                let doc = parse5.parse(text);
                let tables = HTMLParser.findAllChildNodeWithTag(doc, "table");
                for (let table of tables) {
                    let rows = HTMLParser.getRowsInTable(table);
                    for (let row of rows) {
                        try {
                            this.handleRoomRow(row, buildinginfo);
                        } catch (e) {
                            // Log.error(e);
                        }
                    }
                }
                resolve("Add All Rooms");
            }).catch( () => reject("Error reading Building file"));
        });
    }

    /**
     * Get info about a room and add it to dataset.
     * @param row The row of a room
     * @param buildinginfo the building info.
     */
    private handleRoomRow(row: any, buildinginfo: any) {
        let tableCells = HTMLParser.findAllChildNodeWithTag(row, "td");
        let texts = tableCells.map((x) => (HTMLParser.extractTextFromNode(x)));
        let roomNum = texts[0];
        let roomCap = texts[1] === "" ? 0 : parseInt(texts[1], 10);
        let roomFur = texts[2];
        let roomType = texts[3];
        let roomHref = HTMLParser.getLinkofChild(tableCells[4]);
        this.dataset.addData({
            address: buildinginfo.address,
            fullname: buildinginfo.fullName,
            furniture: roomFur,
            href: roomHref,
            lat: buildinginfo.lat,
            lon: buildinginfo.lon,
            name: buildinginfo.shortName + roomNum,
            number: roomNum,
            seats: roomCap,
            shortname: buildinginfo.shortName,
            type: roomType
        });
    }

}
