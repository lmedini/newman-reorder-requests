# newman-reorder-requests

While creating a collection in [Postman](https://www.postman.com/), one usually groups collections in folders according to common resources, topics or whatever. This ordering does not necessarily reflect the order in which they are supposed to be executed.

For instance, if your server manages 2 different types of resources, say _users_ and _hats_, you may want to store them in two different so-called folders. But when running the collection, you may define a test workflow that first creates a user, then a hat, then attributes the hat to the user, and finally checks if the user's hat property has actually been set. To do so, you will need to execute some requests in the _users_ folder, then in the _hats_ folder, and then in _users_ again. That is what `postman.setNextRequest()` helps you to do.

While this instruction works well when running the collection in Postman, other collection runners have trouble making it work at runtime.<br>
**This small application is able to load one or multiple collection(s) created in Postman, reorder the requests according to the workflow specified with `postman.setNextRequest()` instructions in request tests, and run the resulting collection with [newman](https://github.com/postmanlabs/newman).**

Features (or bugs or todos):

- reorders according to `postman.setNextRequest(requestName);` statements in the tests:
  - only works with request "names" (aka the text describing a request), since Postman's request IDs are not persistent when exported -> ensure you do not have several requests with the same name, as after previous reorderings, it may not choose the first one in the original order
  - no "intelligent", nor runtime processing is done for the reordering (only string matching) -> won't work well if `postman.setNextRequest()` are inside `if` blocks for instance, or if its argument is a variable instead of a simple string
  - only performs reordering - and not copy - of the requests -> loops are not permitted
  - `postman.setNextRequest()` lines are commented in the transformed collection -> make sure nothing else is useful on these lines
- flattens the collection folder hierarchy (at least of one level) -> may produce multiple folders if subfolders are split during the reordering operation (can help to understand the different steps of the workflow, so let's call this a feature...)
- preserves collection metadata (eg. name and variables) -> use `pm.collectionVariables` and not `pm.environmentVariables` in scripts
- searches for Postman collections in the `collections` folder -> make sure to create it if not present after clone, and to place collections in there; if no collection file name passed as argument, will process all JSON files in this folder
- allows for passing options to newman runner (see below)

## Installation

**Requirements:** [NodeJS](https://nodejs.org/), [NPM](https://www.npmjs.com/) (or [Yarn](https://yarnpkg.com/))

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

## Reporters

Works out-of-the-box with all [built-in newman reporters](https://learning.postman.com/docs/collections/using-newman-cli/newman-built-in-reporters/), plus [html-extra](https://github.com/DannyDainton/newman-reporter-htmlextra), which is the default. When file reports are created, they are placed in the `newman` directory.

Additional reporters can be used by:

- Installing them in the project: `npm i newman-reporter-csv`
- Passing them as argument: `npm start my-collection-export.json reporters=csv` (suppress the leading "newman-reporter-" in the reporter name)

## Complete example with iteration data and corresponding reporter

- Do the "Installation step"
- `npm i newman-reporter-iteration-tests`
- `npm start my-collection-export.json reporters=iteration-tests interactionData=myData.csv`

## License

**Note:** "Postman" and "newman" are trademarks of Postman, Inc.

The components of this work that are not subject to any other license are licensed under a [Cecill-C](https://cecill.info/licences/Licence_CeCILL-C_V1-en.txt) license.
