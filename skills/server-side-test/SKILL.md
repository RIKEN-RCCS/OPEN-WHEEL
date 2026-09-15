---
name: server-side-test
description: how to run server side unit tests
---

To run server side unit tests, you must use the following npm script:

```bash
npm run testDocker -w server
```

it will run `test/setup.sh test_setting_docker.txt` (bring up the PBS testbed container and
prepare the docker-based remotehost config), then `docker compose ... run --build
wheel_release_test` (build and run the *entire* test suite, mocha included, inside its own
container - not on the host), then tear both down. Never run `npm run test -w server` (the
host-native variant, without the `Docker` suffix) or `npm run mocha`/`dotenv -e test/.env --
...` directly - the whole suite, including the mocha process itself, must run inside a
container so the environment is consistent and isolated regardless of what's installed on the
host.

## restrictions
it takes a few dozen minutes to run full test. you have to use only modifier to run specific test cases for debugging, and/or newly created test cases. remember to remove only and run whole test suite as final check before finish your work.

always keep latest test output to a file and report the filename to user. you can re-use the same file for each test run.
