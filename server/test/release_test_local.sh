#!/bin/bash
export WHEEL_CONFIG_DIR=/tmp/WHEEL_CONFIG_DIR
TAG_TEST_SERVER=wheel_release_test_server

REMOTE_HOSTNAME=127.0.0.1
REMOTE_PORT=4000

docker stop ${TAG_TEST_SERVER} 2>/dev/null

echo "prepareing remotehost"
mkdir ${WHEEL_CONFIG_DIR} 2>/dev/null
{
echo '[{'
echo '  "name": "testServer",'
echo '  "host": "'${REMOTE_HOSTNAME}'",'
echo '  "path": "/home/testuser",'
echo '  "username": "testuser",'
echo '  "numJob": 5,'
echo '  "port": '${REMOTE_PORT}','
echo '  "id": "dummy-id",'
echo '  "jobScheduler": "PBSPro",'
echo '  "renewInterval": 0,'
echo '  "renewDelay": 0,'
echo '  "statusCheckInterval": 10,'
echo '  "maxStatusCheckError": 10,'
echo '  "readyTimeout": 5000'
echo '}]'
} > ${WHEEL_CONFIG_DIR}/remotehost.json

echo boot up test server
docker compose up ${TAG_TEST_SERVER} -d --wait --remove-orphans
docker exec ${TAG_TEST_SERVER} /opt/pbs/bin/qmgr -c "set server job_history_enable=True"

echo remove entry from known_hosts to avoid error if the entry already exists
ssh-keygen -R '['${REMOTE_HOSTNAME}']:'${REMOTE_PORT} 2>/dev/null

echo "start UT"
WHEEL_TEST_REMOTEHOST=testServer WHEEL_TEST_REMOTE_PASSWORD=passw0rd npm run test
echo "UT finished"

docker compose down

echo clean up known_hosts
ssh-keygen -R '['${REMOTE_HOSTNAME}']:'${REMOTE_PORT} 2>/dev/null
#
