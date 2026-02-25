## directory structure
The directory structure of this project is organized as follows:

```
client/                  client js codes
common/                  JS code shared between client and server
documentMD/              markdown documents
server/                  server js codes
server/tetst/            server unit test
test/cypress/e2e         end-to-end test with cypress
test/cypress/component   component test with cypress
```

## npm scripts
- npm run build: build client code
- npm run testDocker  -w server: run server unit tests in docker
- npm run test -w server: run server unit tests in native environment
- npm run test:e2e -w test:  run end-to-end tests with cypress
- npm run lint: run eslint to check and force code style

## important rules
- all code changes should be made under client, server, or common directories.
- after modifying the code under client or common, please run `npm run build` to rebuild the client code.
- after any code changes, please run lint and fix all errors.
- if you make new functions, you have to add JSDoc comments for them.
- if you make new functions under server, you have to add unit tests for them.
- if you make changes that affect user interactions, you have to add end-to-end tests for them.
- never commit, revert or make any other operations to git repo without explicitly order from user.
- do not change "server/app/db/version.json" this file is automatically updated by github workflow.
- To run e2e and unit tests, you have to run by npm scripts. it invoke docker run for test counter-part.
- output test results to file and report the filename. You can overwrite the file if you run the test again, unless user ask you to keep it.
- use only modifier to UT for testing. you do not need to run whole test suite except for final check of your work.

## implementation policy
- always write code in async/await style
- always use try/catch to handle errors in async functions
- use debug module for logging (temporarily use console.log for debugging is allowed, but remember to remove them before commit)
