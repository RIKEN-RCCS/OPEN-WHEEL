#!/bin/bash
TAG=wheel_release_test
TAG_TEST_SERVER=wheel_release_test_server

function cleanup()
{
    echo "============================================="
    echo "start cleanup process"
    docker stop ${TAG} ${TAG_TEST_SERVER}
    rm -fr ${CONFIG_DIR}
    rm ${SSL_CONFIG}
    echo "remaining containers"
    docker ps -a
    echo "remaining images"
    docker images
    popd
    return
}

TEST_DIR=$(dirname $0)
pushd ${TEST_DIR}

# stop container
docker stop ${TAG} >& /dev/null
# remove container
docker rm ${TAG} >& /dev/null
# remove image
docker rmi ${TAG} >& /dev/null

set -e -o pipefail
trap cleanup EXIT

# start test server
docker run --rm -d -p 4000:22 --name ${TAG_TEST_SERVER} naoso5/openpbs
if [ $? -ne 0 ];then
  echo "ERROR: run test server failed $?"
  exit 2
fi
IPAddress=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${TAG_TEST_SERVER})


# build WHEEL docker image
pushd ../../
docker build --platform linux/amd64 --target=test -t ${TAG} .
rt=$?
popd
if [ ${rt} -ne 0 ];then
  echo "ERROR: build wheel failed ${rt}"
  exit 3
fi

#
# crate config files
#
CONFIG_DIR=$(mktemp -d tmp.XXXXXXXXXX)
# self-signed-certification files
SSL_CONFIG=$(mktemp tmp_config.XXXXXXXXXX)
echo '[dn]
CN=localhost
[req]
distinguished_name = dn
[EXT]
subjectAltName=DNS:localhost
keyUsage=digitalSignature
extendedKeyUsage=serverAuth
' > ${SSL_CONFIG}
openssl req -x509 -out ${CONFIG_DIR}/server.crt -keyout ${CONFIG_DIR}/server.key  -newkey rsa:2048 \
-nodes -sha256  -subj '/CN=localhost' -extensions EXT -config ${SSL_CONFIG}

#copy default setting files
cp ../app/config/{server,jobScheduler}.json ${CONFIG_DIR}

#create rmeotehost.json
{
echo '[{'
echo '  "name": "testServer",'
echo '  "host": "'${IPAddress}'",'
echo '  "path": "/home/pbsuser",'
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

#run UT in container
docker run --env "WHEEL_TEST_REMOTEHOST=testServer" \
           --env "WHEEL_TEST_REMOTE_PASSWORD=passw0rd"  \
           -v ${PWD}/${CONFIG_DIR}:/usr/src/app/config  \
           -p 8089:8089  \
           -p 8090:8090  \
           --name ${TAG} ${TAG}
rt=$?

#get log files from container
LOG_DIR=$(dirname ${TEST_DIR})/$(date "+%Y%m%d-%H%M")
mkdir $LOG_DIR
docker cp ${TAG}:/usr/src/coverage/ $LOG_DIR

if [ ${rt} -ne 0 ];then
  echo "ERROR: unit test failed ${rt}"
  exit 7
fi
