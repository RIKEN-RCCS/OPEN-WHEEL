#!/bin/bash
TEST_DIR=$(cd $(dirname $0);pwd)
pushd ${TEST_DIR}

if [ -f .env ]; then
  source .env
fi
if [ -f ${SETTING_FILE} ]; then
  source ${SETTING_FILE}
fi

docker compose down
rm -fr ${WHEEL_CONFIG_DIR}
rm -f .env

echo clean up known_hosts
ssh-keygen -R ${KNOWN_HOSTS} 2>/dev/null
popd
