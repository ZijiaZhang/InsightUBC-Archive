/**
 * Builds a query object using the current bigContainer object model (DOM).
 * Must use the browser's global bigContainer object {@link https://developer.mozilla.org/en-US/docs/Web/API/bigContainer}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
let dataset = document.getElementsByClassName("nav-item tab active")[0].innerText.toLowerCase();
let bigContainer = document.getElementsByClassName("tab-panel active")[0];
let fieldInDS = [];

for (let i = 0; i < bigContainer.getElementsByClassName("form-group groups")[0].getElementsByClassName("control-group")[0].childElementCount; i++) {
    const childField = bigContainer.getElementsByClassName("form-group groups")[0].getElementsByClassName("control-group")[0].children[i].getElementsByTagName("input")[0];
    fieldInDS.push(childField);
}

CampusExplorer.buildQuery = function () {
    bigContainer = document.getElementsByClassName("tab-panel active")[0];
    dataset = bigContainer.getAttribute("data-type");
    let query = {};
    query.WHERE = getWhereClause();
    if(bigContainer.getElementsByClassName("transformations-container")[0].childNodes.length !== 0) {
        query.TRANSFORMATIONS = getTrans();
    }
    query.OPTIONS = getOptionClause();
    return query;
};

function getWhereClause () {
    let where = {};
    if (bigContainer.getElementsByClassName("conditions-container")[0].childElementCount === 0) {
        return {};
    } else if (bigContainer.getElementsByClassName("conditions-container")[0].childElementCount === 1) {
        return getSimpleLogic(bigContainer.getElementsByClassName("conditions-container")[0].childNodes[0]);
    } else {
        if (bigContainer.getElementById("courses-conditiontype-all").checked === true) {
            where.AND = [];
            for (let i = 0; i < bigContainer.getElementsByClassName("conditions-container")[0].childElementCount; i++) {
                let node = bigContainer.getElementsByClassName("conditions-container")[0].childNodes[i];
                let obj = {};
                if (node.getElementsByClassName("control not")[0].getElementsByTagName("input")[0].checked === true) {
                    obj.NOT = getSimpleLogic(node);
                } else {
                    obj = getSimpleLogic(node);
                }
                where.AND.push(obj);
            }
        }
        if (bigContainer.getElementById("courses-conditiontype-any").checked === true) {
            where.OR = [];
            for (let i = 0; i < bigContainer.getElementsByClassName("conditions-container")[0].childElementCount; i++) {
                where.OR.push();
            }
        }
        if (bigContainer.getElementById("courses-conditiontype-none").checked === true) {
            where.NOT = {};
            where.NOT.OR = [];
            for (let i = 0; i < bigContainer.getElementsByClassName("conditions-container")[0].childElementCount; i++) {
                where.NOT.OR.push();
            }
        }
        return where;
    }
}

    function getSimpleLogic(node) {
        let logic = {};
        const op = node.getElementsByClassName("control operators")[0].childNodes[1].value;
        logic[op] = {};
        const field = (dataset.concat("_")).concat(node.getElementsByClassName("control fields")[0].childNodes[1].value);
        logic[op][field] = node.getElementsByClassName("control term")[0].getElementsByTagName("input")[0].value;
        return logic;
    }

    function getTrans() {
        let trans = {};
        trans.GROUP = [];
        trans.APPLY = [];
        const numGroupFields = bigContainer.getElementsByClassName("form-group groups")[0].getElementsByClassName("control-group")[0].childElementCount;
        for (let i = 0; i < numGroupFields; i++) {
            const childField = bigContainer.getElementsByClassName("form-group groups")[0].getElementsByClassName("control-group")[0].children[i].getElementsByTagName("input")[0];
            if (childField.checked === true) {
               trans.GROUP.push((dataset.concat("_")).concat(childField.getAttribute("data-key")));
            }
        }
        for (let i = 0; i <bigContainer.getElementsByClassName("transformations-container")[0].childElementCount; i++) {
            let applyObj = {};
            const newFieldName = bigContainer.getElementsByClassName("transformations-container")[0]
                .getElementsByClassName("control-group transformation")[i]
                .getElementsByClassName("control term")[0]
                .getElementsByTagName("input")[0].value;
            const newFiledVal = {};
            const node = bigContainer.getElementsByClassName("transformations-container")[0].childNodes[i];
            const op = node.getElementsByClassName("control operators")[0].childNodes[1].value;
            const field = (dataset.concat("_")).concat(node.getElementsByClassName("control fields")[0].childNodes[1].value);
            newFiledVal[op] = field;
            applyObj[newFieldName] = newFiledVal;
            trans.APPLY.push(applyObj);
        }
        return trans;
    }

    function getOptionClause() {
        let options = {};
        options.COLUMNS = [];
        const numColFields = bigContainer.getElementsByClassName("form-group columns")[0].getElementsByClassName("control-group")[0].childElementCount;
        for (let i = 0; i < numColFields; i++) {
            const childField = bigContainer.getElementsByClassName("form-group columns")[0].getElementsByClassName("control-group")[0].children[i].getElementsByTagName("input")[0];
            if (childField.checked === true) {
                const field = childField.getAttribute("data-key");
                if (fieldInDS.includes(field)) {
                    options.COLUMNS.push((dataset.concat("_")).concat(field));
                } else {
                    options.COLUMNS.push(field);
                }
            }
        }
        const orderLength = bigContainer.getElementsByClassName("control order fields")[0].childNodes[1].selectedOptions.length;
        const orderDesc = bigContainer.getElementsByClassName("control descending")[0].getElementsByTagName("input")[0].checked;
        if (orderLength === 0) {
            return options;
        } else if (orderLength === 1 && orderDesc=== false) {
            const field = bigContainer.getElementsByClassName("control order fields")[0].childNodes[1].selectedOptions[0].value;
            if (fieldInDS.includes(field)) {
                options.ORDER = (dataset.concat("_")).concat(field);
            } else {
                options.ORDER = field;
            }
        } else {
            options.ORDER = {}
            options.ORDER.keys = [];
            if (orderDesc === true) {
                options.ORDER.dir = "DOWN";
            } else {
                options.ORDER.dir = "UP";
            }
            for (let i = 0; i < orderLength; i++) {
                const field = bigContainer.getElementsByClassName("control order fields")[0].childNodes[1].selectedOptions[i].value
                if (fieldInDS.includes(field)) {
                    options.ORDER.keys.push((dataset.concat("_")).concat(field));
                } else {
                    options.ORDER.keys.push(field);
                }
            }
        }
        return options;
    }

