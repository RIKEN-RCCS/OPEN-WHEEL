#!/bin/bash -x
echo generate keypair = ${WHEEL_GENERATE_KEYPAIR:-NO}
if [ "xYES" == "x${WHEEL_GENERATE_KEYPAIR}" ];then
  rm  /tmp_identify /tmp_identify.pub 2>/dev/null
  ssh-keygen -t ed25519 -f /tmp_identify -N ""
  mv /tmp_identify.pub ${HOME}/.wheel/wheel_tmp_pubkey
  echo key generation done
  echo   private key: /tmp_identify
  echo   public key : ${HOME}/.wheel/wheel_tmp_pubkey
fi
echo generate anonymous login user = ${WHEEL_ANONYMOUS_LOGIN:-NO}
if [ "xYES" == "x${WHEEL_ANONYMOUS_LOGIN}" ]; then
  if [ -z ${WHEEL_ANONYMOUS_PASSWORD} ];then
    node bin/passwordDBTool.js -A -c
  else
    node bin/passwordDBTool.js -A -c >${WHEEL_ANONYMOUS_PASSWORD}
  fi
  export WHEEL_ENABLE_AUTH=YES
fi

npm start
