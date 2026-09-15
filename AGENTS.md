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
- do not hand-edit "server/app/db/version.json". It holds a fixed development placeholder in the repo; the real value is baked in only at build time (Dockerfile / build_and_deploy.yml), never by a running CI job. See documentMD/design/design.md ("バージョン番号の管理").
- Do not use conditional skip in unit tests except for pre-existing ones.

## implementation policy
- always write code in async/await style
- always use try/catch to handle errors in async functions
- use debug module for logging (temporarily use console.log for debugging is allowed, but remember to remove them before commit)

## bug fix workflow (standard)
Test-first is the principle for every bug fix. Follow these steps in order:

1. File the symptom as a GitLab issue.
2. Investigate the root cause and post the findings as a comment on that issue.
3. Write a reproduction test, confirm it fails (red), then commit it.
4. Implement the fix, confirm the full test suite is green, then commit it.
5. Push to the forked repository and confirm CI is green there.
6. Open a pull request to the upstream (RIKEN-RCCS) repository.

Run lint before every commit made in this workflow (not only once at the end).

When one pull request bundles fixes for multiple issues, do steps 1-4 separately and
sequentially for each issue (one issue's investigation/red-test/fix/commit cycle at a
time, not in parallel, to limit context/token usage), then do steps 5-6 once for the
combined branch.
