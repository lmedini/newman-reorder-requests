# newman-reorder-requests

While creating a collection in Postman, one usually groups collections in folders according to common resources, topics or whatever. This ordering does not necessarily reflect the order in which they are supposed to be executed. For instance, if your server manages 2 different types of resources, say users and hats, you may want to first create a user, then a hat, then attribute the hat to the user, and then check if the user's hat property has actually been set. To do so, you will need to execute some requests in the "users" folder, then in the "hats" folder, and then in "users" again. That is what `postman.setNextRequest()` helps you to do.

While this instruction works well when running the collection in Postman, other collection runners have trouble making it work at runtime. **This small application is able to load one or multiple collection(s) created in Postman, reorder the requests according to the workflow specified with `postman.setNextRequest()` instructions in request tests, and run the resulting collection with newman.**

Features (or bugs or todos):

- reorders according to `postman.setNextRequest(requestName);` statements in the tests:
  - only works with request "names" (aka the text describing a request), since Postman's request IDs are not persistent when exported -> ensure you do not have several requests with the same name, as after previous reorderings, it may not choose the first one in the original order
  - no "intelligent", nor runtime processing is done for the reordering (only string matching) -> won't work well if `postman.setNextRequest()` are inside `if` blocks for instance, or if its argument is a variable instead of a simple string
  - only performs reordering - and not copy - of the requests -> loops are not permitted
  - `postman.setNextRequest()` lines are commented in the transformed collection -> make sure nothing else is useful on these lines
- flattens the collection folder hierarchy (at least of one level) -> may produce multiple folders if subfolders are split during the reordering operation
- preserves collection metadata (eg. name and variables) -> use `pm.collectionVariables` and not `pm.environmentVariables` in scripts
- searches for Postman collections in the `collections` folder -> make sure to create it if not present after clone, and to place collections in there; if no collection file name passed as argument, will process all JSON files in this fiolder
- allows for passing options to newman runner (see below)

## Installation

**Requirements:** NodeJS, NPM (or Yarn)

```sh
git clone https://github.com/lmedini/newman-reorder-requests
npm i
cd newman-reorder-requests
mkdir collections
```

## Usage

- To process all collections in the `collections` folder:<br>
`npm start`
- To process one collection in the `collections` folder:<br>
`npm start my-collection-export.json`
- To process all collections and pass options to newman (note that there are default options in `bin/index.js` `DEFAULT_PROPERTIES`):<br>
`npm start reporters=cli ignoreRedirects=false`
- To process one collection in the `collections` folder and pass options to newman:<br>
`npm start my-collection-export.json reporters=cli ignoreRedirects=true` (argument order is not relevant)

TODO: improve argument processing...

## Reporters

Works out-of-the-box with all built-in newman reporters, plus html-extra, which is the default. When file reports are created, they are placed in the `newman` directory.

Additional reporters can be used by:

- Installing them in the project: `npm i newman-reporter-csv`
- Passing them as argument: `npm start reporters=csv`
