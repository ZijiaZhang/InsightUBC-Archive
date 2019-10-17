import {DataSetDataRoom} from "./DataSetDataRoom";
import Log from "./Util";
import * as JSZip from "jszip";
import {InsightError} from "./controller/IInsightFacade";
import chaiHttp = require("chai-http");

const chai = require("chai");
const parse5 = require("parse5");

chai.use(chaiHttp);

export class DatasetLoaderRooms {
    /**
     * Load the data from dataset.
     * @param content the content of the file
     * @param id the datasetID
     * Will reject if the error occurs, or the dataset is not Valid.
     * Will fullfilled if the dataset is successfully added.
     */
    public static loadData(content: string, id: string): Promise<DataSetDataRoom> {
        return new Promise<DataSetDataRoom>((resolve, reject) => {
            JSZip.loadAsync(content, {base64: true})
                .then((data: JSZip) => {
                    if (!("rooms/index.htm" in data.files)) {
                        return reject(new InsightError("No index.htm found in Zip"));
                    }
                    data.file("rooms/index.htm").async("text").then((file) => {
                        let dataset = new DataSetDataRoom(id);
                        const document = parse5.parse(file);
                        return this.parseHTML5(data, document, dataset).then(
                            (result) => resolve(dataset)
                        ).catch((e) => reject(new InsightError("Error Loading data set")));
                    });
                })
                .catch((e) => reject(new InsightError("Error Reading files")));
            // reject("ERROR Not implemented");
        });
    }

    /**
     * Add rows to dataset, will fulfill on finish.
     * @param data the files in the zip file.
     * @param doc the index.htm file
     * @param dataset the dataset to be added.
     * Will reject if no rooms are added.
     * Will fulfilled if at least one room is added.
     */
    private static parseHTML5(data: JSZip, doc: any, dataset: DataSetDataRoom): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let tables = this.findAllChildNodeWithTag(doc, "table");
            // Table is the only table in the HTML.
            let promises: Array<Promise<any>> = [];
            for (let table of tables) {
                promises.push(this.handleBuildingTable(data, dataset, table));
            }
            Promise.all(promises).then(
                (s) => {
                    if (dataset.getMetaData().numRows === 0) {
                        return reject(dataset);
                    }
                    return resolve("Dataset Added");
                }
            );
        });
    }

    /**
     * Handles tables in the index.htm
     * @param data The content of the Zip file.
     * @param dataset the dataSet To Be Added to.
     * @param table the table in index.htm
     * Will always resolve.
     * Will resolve with string "Error" if error occurs.
     */
    private static handleBuildingTable(data: JSZip, dataset: DataSetDataRoom, table: any): Promise<string[]> {
        let rows = this.getRowsInTable(table);
        let promises: Array<Promise<string>> = [];
        for (let row of rows) {
            let promise = new Promise<string>((resolve1, reject1) => {
                let tableCells = this.findAllChildNodeWithTag(row, "td");
                if (tableCells.length !== 5) {
                    return resolve1("Error Length of Building Data");
                }
                let texts = tableCells.map((x) => (this.extractTextFromNode(x)));
                let shortname = texts[1];
                let fullname = texts[2];
                let address = texts[3];
                let filepath = "rooms" + this.getLinkofChild(tableCells[4]).substr(1);
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
                    this.loadAllRooms(data, dataset, filepath, buildingInfo).then(
                        (s) => resolve1("Succefully add a building")
                    ).catch(
                        (e) => (resolve1("Error"))
                    );
                });
            });
            promises.push(promise);
        }
        return Promise.all(promises);
    }

    /**
     * Get rows in a table
     * @param table
     */
    private static getRowsInTable(table: any) {
        try {
            // let tbody = this.findFirstNodeWithTag(table, "tbody");
            return this.findAllChildNodeWithTag(table, "tr");
        } catch (e) {
            return []; // Invalid Table
        }
    }

    /**
     * Get Links of a node
     * @param node The parent node of any link.
     */
    private static getLinkofChild(node: any): string| null {
        let a = this.findFirstNodeWithTag(node, "a");
        if (a != null) {
            if (a.hasOwnProperty("attrs")) {
                for (let att of a.attrs) {
                    if (att.hasOwnProperty("name") && att.name === "href") {
                        return att.value;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Load all rooms from the html file of the building.
     * @param data The content of the Zip file.
     * @param dataset The dataset that is added to.
     * @param path The path to the building file.
     * @param buildinginfo The info of the building that optained previously
     * Will fulfill if no error.
     * Will reject if having error reading the file.
     */
    private static loadAllRooms(data: JSZip, dataset: DataSetDataRoom,
                                path: string, buildinginfo: any): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            data.file(path).async("text").then((text) => {
                let doc = parse5.parse(text);
                let tables = this.findAllChildNodeWithTag(doc, "table");
                for (let table of tables) {
                    let rows = this.getRowsInTable(table);
                    for (let row of rows) {
                        try {
                            this.handleRoomRow(row, dataset, buildinginfo);
                        } catch (e) {
                            // Log.error(e);
                        }
                    }
                }
                resolve("Add All Rooms");
            }).catch( (e) => reject("Error reading Building file"));
        });
    }

    /**
     * Get info about a room and add it to dataset.
     * @param row The row of a room
     * @param dataset data set.
     * @param buildinginfo the building info.
     */
    private static handleRoomRow(row: any, dataset: DataSetDataRoom, buildinginfo: any) {
        let tableCells = this.findAllChildNodeWithTag(row, "td");
        let texts = tableCells.map((x) => (this.extractTextFromNode(x)));
        let roomNum = texts[0];
        let roomCap = texts[1] === "" ? 0 : parseInt(texts[1], 10);
        let roomFur = texts[2];
        let roomType = texts[3];
        let roomHref = this.getLinkofChild(tableCells[4]);
        dataset.addData({
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

    /**
     * Get all text in a node
     * @param node
     */
    private static extractTextFromNode(node: any): string {
        if (node.nodeName === "#text") {
            return node.value;
        }
        if (node.hasOwnProperty("childNodes")) {
            let r = "";
            for (let chNode of node.childNodes) {
                r += this.extractTextFromNode(chNode);
            }
            return r.trim();
        }
        return "";
    }

    /**
     * Get first node with a tag.
     * @param node
     * @param tag
     */
    private static findFirstNodeWithTag(node: any, tag: string): any | null {
        if (node.tagName === tag) {
            return node;
        }
        if (node.hasOwnProperty("childNodes")) { // If the node does not have the childNode don't do the loop.
            for (let chNodes of node.childNodes) {
                let r = this.findFirstNodeWithTag(chNodes, tag);
                if (r != null) {
                    return r;
                }
            }
        }
        return null;
    }

    /**
     * Get all children of a node with tag
     * @param node
     * @param tag
     */
    private static findAllChildNodeWithTag(node: any, tag: string): any[] {
        if (!node.hasOwnProperty("childNodes")) {
            return [];
        }
        let r = [];
        for (let chNodes of node.childNodes) {
            if (chNodes.tagName === tag) {
                r.push(chNodes);
            }
            r = r.concat(this.findAllChildNodeWithTag(chNodes, tag));
        }
        return r;
    }
}
