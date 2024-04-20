#!/bin/bash
export CONFIG_DIR=/tmp/WHEEL_CONFIG_DIR
TAG_TEST_SERVER=wheel_release_test_server

docker stop ${TAG_TEST_SERVER} 2>/dev/null

echo "prepareing remotehost"
mkdir ${CONFIG_DIR} 2>/dev/null
{
echo '[{'
echo '  "name": "testServer",'
echo '  "host": "localhost",'
echo '  "path": "/home/testuser",'
echo '  "keyFile": null,'
echo '  "username": "testuser",'
echo '  "numJob": 5,'
echo '  "port": 4000,'
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
ssh-keygen -R '[localhost]:4000' 2>/dev/null


echo "start UT"
WHEEL_CONFIG_DIR=/tmp/WHEEL_CONFIG_DIR WHEEL_TEST_REMOTEHOST=testServer WHEEL_TEST_REMOTE_PASSWORD=passw0rd npm run test
echo "UT finished"

docker-compose down
