#!/bin/bash
TAG=wheel_release_test
TAG_TEST_SERVER=wheel_release_test_server
TEST_DIR=$(cd $(dirname $0);pwd)
pushd ${TEST_DIR}
# crate config files
#
CONFIG_DIR=$(mktemp -d tmp.XXXXXXXXXX)
# self-signed-certification files
SSL_CONFIG=$(mktemp tmp_config.XXXXXXXXXX)

function cleanup()
{
    echo "============================================="
    echo "start cleanup process"
    set +e
    docker stop ${TAG}
    docker stop ${TAG_TEST_SERVER}
    rm -fr ${CONFIG_DIR}
    rm ${SSL_CONFIG}
    docker rm ${TAG}
    echo "remaining containers"
    docker ps -a
    echo "remaining images"
    docker images
    popd
    return
}

#clean up containers just in case
docker stop ${TAG} 2>/dev/null
docker stop ${TAG_TEST_SERVER} 2>/dev/null
docker rm ${TAG} 2>/dev/null


cd ${TEST_DIR}
set -e -o pipefail
trap cleanup EXIT

./prepare_remotehost_container.sh ${CONFIG_DIR} ${TAG_TEST_SERVER}

# build WHEEL docker image
pushd ../../
docker build --platform linux/amd64 --target=UT -t ${TAG} .
rt=$?
popd
if [ ${rt} -ne 0 ];then
  echo "ERROR: build wheel failed ${rt}"
  exit 3
fi

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


#run UT in container
docker run --env "WHEEL_TEST_REMOTEHOST=testServer"\
           --env "WHEEL_TEST_REMOTE_PASSWORD=passw0rd"\
           -v ${PWD}/${CONFIG_DIR}:/usr/src/server/app/config\
           -p 8089:8089\
           --name ${TAG} ${TAG}
rt=$?

#get log files from container
if [ x$1 == x-c ];then
  LOG_DIR=$(dirname ${TEST_DIR})/$(date "+%Y%m%d-%H%M")
  mkdir $LOG_DIR
  docker cp ${TAG}:/usr/src/server/coverage $LOG_DIR
fi

if [ ${rt} -ne 0 ];then
  echo "ERROR: unit test failed ${rt}"
  exit 7
fi
