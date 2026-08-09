---
name: e2e-test
description: how to run E2E test
---
Before you run E2E test, please run following command and make sure all docker conatiner for test is down

```bash
npm run -w test test:e2e:stop
```

Then run E2E test with following command

```bash
npm run -w test test:e2e:mock
```

If you need to run separate spec, prepare containers before run the test as follows.
And you have to shutdown containers after all test is done. You can keep containers if you will run test soon.

```bash
npm run -w test test:e2e:mock:start # prepareing containers
npx cypress run --browser chrome --spec XXXX.cy.js  #actual test
npm run -w test test:e2e:stop # teardown containers.
```


If you explicitly run with real app server, use following command instead

```bash
npm run -w test test:e2e
```
