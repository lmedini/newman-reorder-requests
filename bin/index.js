"use strict";

const newman = require('newman'); // require newman in your project
const Collection = require('postman-collection').Collection;
const utils = require('./collection-utils');

const VERBOSE = false;
const DEFAULT_PROPERTIES = {
    ignoreRedirects: true,
    reporters: 'htmlextra',
    insecure: true
};

/**
 * Read initial collection with postman-collection & (re)initiate processing variables
 * @param {object} jsonData Content of the file containing the collection to process
 * @returns A postman collection object
 */
function initCollection(jsonData) {
    utils.init();
    return new Collection(jsonData);
}

/**
 * Process the collection to reorder requests according to the postman.setNextRequest() instruction
 * @param {Collection} collection The Postman collection to process
 * @returns the same collection, with the requests in a different order
 */
function preprocessCollection(collection) {
    // Ad hoc processing to reorder collection items
    utils.setVerbose(VERBOSE);
    console.log("Found " + utils.parseSourceCollectionItems(collection.items) + " requests.");
    console.log("Reordered " + utils.reorderRequestItems() + " items.");
    console.log("Replaced " + utils.replaceItems(collection.items) + " items.");

    return collection;
}

/**
 * Run a collection using newman
 * @param {Collection} collection The Postman collection to run
 */
function analyseCollection(collection, newmanArgs) {
    let requestIterator = 0 // Used in VERBOSE mode

    // Merge "default" properties with those passed as arguments
    const options = Object.assign({collection: collection}, DEFAULT_PROPERTIES, newmanArgs);

    // call newman.run to pass `options` object and wait for callback
    newman.run(options, function (err) {
        if (err) { throw err; }
        console.log('collection run complete!');
    })
    .on('test', function (err, summary) {
        if (VERBOSE) {
            if (err || summary.error) {
                console.error('test run encountered an error.');
            }
            else {
                console.log("test " + (++requestIterator) + " completed.");
            }
        }
    });
}

module.exports = {
    initCollection: initCollection,
    preprocessCollection: preprocessCollection,
    analyseCollection: analyseCollection
};