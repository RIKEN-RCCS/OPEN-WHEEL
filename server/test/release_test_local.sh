#!/bin/bash
TEST_DIR=$(cd $(dirname $0);pwd)
./setup.sh

echo "start UT"
WHEEL_TEST_REMOTEHOST=testServer WHEEL_TEST_REMOTE_PASSWORD=passw0rd npm run test
rt=$?
echo "UT finished"
./teardown.sh
exit ${rt}
