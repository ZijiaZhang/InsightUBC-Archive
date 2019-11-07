/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */

// https://github.com/junzew/cpsc310-geolocation-ui/blob/checkpoint/5/public/query-sender.js
// in-class activity
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        let request = new XMLHttpRequest();
        request.open('POST', '/query', true);
        request.setRequestHeader("Content-Type", "application/json");
        request.onload = function () {
            let result = JSON.parse(request.responseText);
            fulfill(result);
        };

        request.onerror = function () {
            reject('The request failed')
        };

        request.send(JSON.stringify(query));
    });
};
