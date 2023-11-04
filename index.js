"use strict";

const runner = require('./bin/index');
const fs = require('fs'); // read JSON file from disk
const path = require('path');

let fileName = null;
const newmanArgs = {};

/**
 * Process command arguments
 */
function processArgs() {
    process.argv.slice(2).forEach((arg) => {
        if (arg === '--help') {
            console.log('usage: npm start [filename] [option1=value1 ... optionN=valueN]');
            console.log('filename: name of a Postman collection file in the "collections" subdirectory. If absent, runs all collections in this directory.');
            console.log('options: option to pass to newman');
            return;
        }
        const parts = arg.split("=");
        if (parts[1]) {
            try {
                parts[1] = JSON.parse(parts[1]);
            } catch(e) {
                // Ignore error and consider value as simple string
            }
            newmanArgs[parts[0]] = parts[1];
        } else
            fileName = parts[0];
    });
}

/**
 * Run one or multiple files in the collection directory
 */
function run() {
    processArgs();
    if (fileName) {
        runOneCollection(path.join('./collections', fileName));
    } else {
        fs.readdirSync('./collections').forEach(fileName => {
            if (fileName.endsWith('.json')) {
                console.log(`\nProcessing ${fileName}`);
                try {
                    runOneCollection(path.join('./collections', fileName));
                } catch (err) {
                    console.error(err);
                }
            }
        });
    }
}

/**
 * Run one collection
 * @param {string} filePath Relative path of the collection file to run
 */
function runOneCollection(filePath) {
    const contents = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let collection = runner.initCollection(contents);
    console.log("Running collection " + collection.name + " with " + collection.items.members.length + " folders.");
    collection = runner.preprocessCollection(collection);
    runner.analyseCollection(collection, newmanArgs);
}

module.exports = { run: run };

// Run module if launched from CLI
(!module.parent) && run();