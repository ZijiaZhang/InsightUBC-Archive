/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
let dataset = document.getElementsByClassName("nav-item tab active")[0].innerText.toLowerCase();

CampusExplorer.buildQuery = function () {
    let query = {};
    query.WHERE = getWhereClause();
    if(document.getElementsByClassName("transformations-container")[0]
        .getElementsByClassName("control-group transformation")[0]
        .getElementsByClassName("control term")[0]
        .getElementsByTagName("input")[0].value !== undefined) {
        query.TRANSFORMATIONS = getTrans();
    }
    query.OPTIONS = getOptionClause();
    return query;
};

function getWhereClause () {
    let where = {};
    if (document.getElementsByClassName("conditions-container")[0].childElementCount === 0) {
        return {};
    } else if (document.getElementsByClassName("conditions-container")[0].childElementCount === 1) {
        return getSimpleLogic(document.getElementsByClassName("conditions-container")[0].childNodes[0]);
    } else {
        if (document.getElementById("courses-conditiontype-all").checked === true) {
            where.AND = [];
            for (let i = 0; i < document.getElementsByClassName("conditions-container")[0].childElementCount; i++) {
                let node = document.getElementsByClassName("conditions-container")[0].childNodes[i];
                let obj = {};
                if (node.getElementsByClassName("control not")[0].getElementsByTagName("input")[0].checked === true) {
                    obj.NOT = getSimpleLogic(node);
                } else {
                    obj = getSimpleLogic(node);
                }
                where.AND.push(obj);
            }
        }
        if (document.getElementById("courses-conditiontype-any").checked === true) {
            where.OR = [];
            for (let i = 0; i < document.getElementsByClassName("conditions-container")[0].childElementCount; i++) {
                where.OR.push();
            }
        }
        if (document.getElementById("courses-conditiontype-none").checked === true) {
            where.NOT = {};
            where.NOT.OR = [];
            for (let i = 0; i < document.getElementsByClassName("conditions-container")[0].childElementCount; i++) {
                where.NOT.OR.push();
            }
        }
        return where;
    }

    function getSimpleLogic(node) {
        let logic = {};
        const op = node.getElementsByClassName("control operators")[0].childNodes[1].value;
        const field = (dataset.concat("_")).concat(node.getElementsByClassName("control fields")[0].childNodes[1].value);
        logic[op][field] = node.getElementsByClassName("control term")[0].getElementsByTagName("input")[0].value;
        return logic;
    }

    function getTrans() {
        let trans = {};
        trans.GROUP = [];
        trans.APPLY = [];
        let numGroupFields = document.getElementsByClassName("form-group groups")[0].getElementsByClassName("control-group")[0].childElementCount;
        for (let i = 0; i < numGroupFields; i++) {
            const childField = document.getElementsByClassName("form-group groups")[0].getElementsByClassName("control-group")[0].children[i].getElementsByTagName("input")[0];
            if (childField.checked === true) {
               trans.GROUP.push((dataset.concat("_")).concat(childField.getAttribute("data-key")));
            }
        }
        return trans;
    }

    function getOptionClause() {
        let options = {};
        return options;
    }
}
