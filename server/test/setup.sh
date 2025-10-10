#!/bin/bash
TEST_DIR=$(cd $(dirname $0);pwd)
pushd ${TEST_DIR}
WHEEL_CONFIG_DIR=$(mktemp -d tmp.XXXXXXXXXX)

TAG_TEST_SERVER=wheel_release_test_server

SETTING_FILE=${1:-"test_setting_local.txt"}
source ${SETTING_FILE}

docker stop ${TAG_TEST_SERVER} 2>/dev/null
echo "prepareing remotehost"
{
echo '[{'
echo '  "name": "testServer",'
echo '  "host": "'${REMOTE_HOSTNAME}'",'
echo '  "path": "/home/testuser",'
echo '  "username": "testuser",'
echo '  "numJob": "'${NUM_JOB}'",'
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
ssh-keygen -R ${KNOWN_HOSTS} 2>/dev/null

echo WHEEL_CONFIG_DIR=${WHEEL_CONFIG_DIR} > .env
echo SETTING_FILE=${SETTING_FILE} >> .env
