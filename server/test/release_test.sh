#!/bin/bash
TEST_DIR=$(cd $(dirname $0);pwd)
./setup.sh test_setting_docker.txt

echo "start UT"
docker compose run -e WHEEL_KEEP_FILES_AFTER_LAST_TEST --build wheel_release_test
rt=$?
echo "UT finished"
./teardown.sh
exit ${rt}
