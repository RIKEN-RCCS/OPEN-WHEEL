---
name: server-side-test
description: how to run server side unit tests
---

To run server side unit tests, you must use the following npm script:

```bash
npm run test -w server
```

it will run docker compose up, npm run test, and docker compose down in sequence. we need to use docker conainer as test counter-part to make sure the test environment is consistent and isolated.

## restrictions
it takes a few dozen minutes to run full test. you have to use only modifier to run specific test cases for debugging, and/or newly created test cases. remember to remove only and run whole test suite as final check before finish your work.

always keep latest test output to a file and report the filename to user. you can re-use the same file for each test run.
