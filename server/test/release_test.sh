#!/bin/bash
TEST_DIR=$(cd $(dirname $0);pwd)
pushd ${TEST_DIR}

TAG=wheel_release_test
TAG_TEST_SERVER=wheel_release_test_server

#clean up containers just in case
docker stop ${TAG} 2>/dev/null
docker stop ${TAG_TEST_SERVER} 2>/dev/null
docker rm ${TAG} 2>/dev/null

# crate config files
#
CONFIG_DIR=$(mktemp -d tmp.XXXXXXXXXX)
export CONFIG_DIR

{
echo '[{'
echo '  "name": "testServer",'
echo '  "host": "wheel_release_test_server",'
echo '  "path": "/home/testuser",'
echo '  "keyFile": null,'
echo '  "username": "testuser",'
echo '  "numJob": 5,'
echo '  "port": 22,'
echo '  "id": "dummy-id",'
echo '  "jobScheduler": "PBSPro",'
echo '  "renewInterval": 0,'
echo '  "renewDelay": 0,'
echo '  "statusCheckInterval": 10,'
echo '  "maxStatusCheckError": 10,'
echo '  "readyTimeout": 5000'
echo '}]'
} > ${CONFIG_DIR}/remotehost.json


echo boot up test server
docker-compose up ${TAG_TEST_SERVER} -d

echo remove entry from known_hosts
ssh-keygen -R 'wheel_release_test_server'

docker-compose run --build --rm ${TAG}
rt=$?

docker-compose down

#get log files from container
if [ x$1 == x-c ];then
  LOG_DIR=$(dirname ${TEST_DIR})/$(date "+%Y%m%d-%H%M")
  mkdir $LOG_DIR
  docker cp ${TAG}:/usr/src/server/coverage $LOG_DIR
fi

rm -fr ${CONFIG_DIR}

exit ${rt}
