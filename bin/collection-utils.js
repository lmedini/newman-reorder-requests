"use strict";

const { Collection } = require("postman-collection/lib/collection/collection");
const { PropertyList } = require("postman-collection/lib/collection/property-list");
const util = require("postman-collection/lib/util");

let requestItems, initialOrder, newOrder;

const init = function(){
    requestItems = new Map(); // map requests by IDs in source collection
    initialOrder = []; // order of requests in source collection
    newOrder = []; // order of requests in source collection
}

// internal boolean variable to indicate if logs should be displayed.
let verbose = false;

const utils = {
    /**
     * Parses the source collection to identify all request items and the initial order of those items.
     * @param {Collection.PropertyList} items A list of properties, containing possibly some requests, and possibly some folders to process recursively.
     */
    parseSourceCollectionItems: (items) => {
        items.members.forEach(element => {
            if (element.request) { // only request elements containing a "request" property
                initialOrder.push(element.id);
                verbose && console.log("ID: " + element.id, "Name: " + element.name);
                requestItems.set(element.id, element);
            }
            if (element.items)
                utils.parseSourceCollectionItems(element.items);
        });
        return initialOrder.length;
    },
    /**
     *  tries to identify the next request of an item, and changes the variable "newOrder" accordingly.
     */
    reorderRequestItems: () => {
        let oldPointer = 0, newPointer = 0;
        while (oldPointer < initialOrder.length) {
            newOrder.push(initialOrder[newPointer]);
            verbose && console.log("Pushed as " + oldPointer + ": " + requestItems.get(initialOrder[newPointer]).name);
            const nextRequestInfo = utils.getNextRequest(initialOrder[newPointer]);
            if (nextRequestInfo) {
                if (nextRequestInfo.value !== "null") {
                    verbose && console.log("Reordering after " + oldPointer + " (" + requestItems.get(newOrder[oldPointer]).name + "):", initialOrder.indexOf(nextRequestInfo.id) + " (" + requestItems.get(nextRequestInfo.id).name + ")");
                    newPointer = initialOrder.indexOf(nextRequestInfo.id);
                } else {
                    verbose && console.log("Stopping after " + oldPointer);
                    break;
                }
            } else {
                newPointer++;
            }
            oldPointer++;
        }
        return newOrder.length;
    },
    /**
     * Modifies a Postman "PropertyList" of items so that it contains a list of request items ordered according to the "newOrder" variable.
     * @param {Collection.PropertyList} items A list of properties, containing possibly some requests, and possibly some folders to process recursively.
     * @returns A flat list of properties (no folder), containing only requests ordered from the first one of the initial list to 
     * either the last of the list, or the first one in the oder for which the next request is set to null.
     */
    replaceItems: (items) => {
        const newItems = new PropertyList();
        newOrder.forEach((id) => {
            newItems.append(requestItems.get(id));
        });
        items = newItems;
        return items.members.length;
    },
    /**
     * Parses one request and test instructions in this request, finds "postman.setNextRequest()" instruction, and returns info about next request.
     * Only works if the argument of "setNextRequest()" is "null" or a simple string (not concatenation, does not contain variables inside).
     * Note: comments "postman.setNextRequest()" afterwards, so that no loop is possible.
     * @returns An object containing the name and id of the next request declaration if found, or null otherwise
     */
    getNextRequest: (id) => {
        for (const eventMember of requestItems.get(id).events.members) {
            if (eventMember.listen == 'test') {
                for (let line of eventMember.script.exec) {
                    line = line.replace("\r", "");
                    if (line.startsWith("postman.setNextRequest(") && line.endsWith(");")) {
                        let value = line.substring(23, line.length - 2);
                        if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
                            value = value.substring(1, value.length - 1);
                        } else if (value !== "null") {
                            throw new Error("Unrecognized value '" + value + "': postman.setNextRequest() arguments can only be null or simple strings.")
                        }
                        // comment this instruction, as it blocks newman execution
                        line = "//" + line;
                        return {
                            value: value,
                            id: utils.findRequest(value)
                        };
                    }
                }
            }
        }
        return null;
    },
    /**
     * Attemps to find a request according to a value that can represent its name or ID.
     * Note: search by ID removed as IDs are not exported in Postman collections,
     * but seem to be generated by the Collection constructor and therefore never match...
     * @param {(string | number)} nameOrId A value supposed to be a request name or ID in the "requests" object
     * @returns The (generated) ID of the request (if found) in the "order" object
     */
    findRequest: (nameOrId) => {
        for (const index of initialOrder) {
            if (nameOrId == requestItems.get(index).name) {
                return index;
            }
        };
        return null;
    },
    getVerbose: () => { return verbose; },
    /**
     * Specifies if detailed logs should be displayed
     * @param { Boolean } value true if yes, default is false
     */
    setVerbose: (value) => {
        //        verbose = value;
        (value === true || value === false) && (verbose = value);
    }
};

module.exports = {
    init: init,
    parseSourceCollectionItems: utils.parseSourceCollectionItems,
    reorderRequestItems: utils.reorderRequestItems,
    replaceItems: utils.replaceItems,
    getVerbose: utils.getVerbose,
    setVerbose: utils.setVerbose
};