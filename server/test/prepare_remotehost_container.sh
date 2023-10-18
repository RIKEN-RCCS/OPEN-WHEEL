#!/bin/bash
CONFIG_DIR=${1}
TAG_TEST_SERVER=${2:-wheel_release_test_server}
# start test server
docker run --platform linux/amd64 --rm -d -p 4000:22 --name ${TAG_TEST_SERVER} naoso5/openpbs
if [ $? -ne 0 ];then
  echo "ERROR: run test server failed $?"
  exit 2
fi
IPAddress=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${TAG_TEST_SERVER})

#create rmeotehost.json
{
echo '[{'
echo '  "name": "testServer",'
echo '  "host": "'${IPAddress}'",'
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
