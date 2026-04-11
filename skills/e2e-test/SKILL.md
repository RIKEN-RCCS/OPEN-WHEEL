---
name: e2e-test
description: how to run E2E test
---
Before you run E2E test, please run following command and all docker conatiner is down

```bash
npm run -w test test:e2e:stop
```

Then run E2E test with following command

```bash
npm run -w test test:e2e:mock
```

If you explicitly run with real app server, use following command instead

```bash
npm run -w test test:e2e
```
