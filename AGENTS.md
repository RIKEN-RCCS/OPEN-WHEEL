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

## important rules
- all code changes should be made under client, server, or common directories.
- after modifying the code under client or common you have to build the client code.
- after any code changes, you have to run lint.
- if you make new functions, you have to add JSDoc comments for them.
- if you make new functions under server, you have to add unit tests for them.
- if you make changes that affect the UI, you have to add component tests for them.
- never commit, revert or make any other operations to git repo without explicitly order from user.
- do not change "server/app/db/version.json" this file is automatically updated by github workflow.
- Do not use conditional skip in unit tests except for pre-existing ones.

## implementation policy
- always write code in async/await style
- always use try/catch to handle errors in async functions
- use debug module for logging (temporarily use console.log for debugging is allowed, but remember to remove them before commit)
