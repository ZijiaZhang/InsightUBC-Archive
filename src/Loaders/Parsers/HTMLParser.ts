export class HTMLParser {
    /**
     * Get all text in a node
     * @param node
     */
    public static extractTextFromNode(node: any): string {
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
    public static findFirstNodeWithTag(node: any, tag: string): any | null {
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
    public static findAllChildNodeWithTag(node: any, tag: string): any[] {
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

    /**
     * Get rows in a table
     * @param table
     */
    public static getRowsInTable(table: any) {
        try {
            // let tbody = this.findFirstNodeWithTag(table, "tbody");
            return HTMLParser.findAllChildNodeWithTag(table, "tr");
        } catch (e) {
            return []; // Invalid Table
        }
    }

    /**
     * Get Links of a node
     * @param node The parent node of any link.
     */
    public static getLinkofChild(node: any): string| null {
        let a = HTMLParser.findFirstNodeWithTag(node, "a");
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

}
