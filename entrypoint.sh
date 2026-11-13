#!/bin/bash
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
  if [ -z "${WHEEL_ANONYMOUS_PASSWORD}" ];then
    node bin/passwordDBTool.js -A -c
  else
    # pass the password via stdin (printf is a shell builtin), because command line
    # arguments can be seen by other users on the same host via ps
    printf '%s' "${WHEEL_ANONYMOUS_PASSWORD}" | node bin/passwordDBTool.js -u anonymous --password-stdin -c
  fi
  export WHEEL_ENABLE_AUTH=YES
fi
# the password is no longer needed. do not pass it to WHEEL and the tasks it spawns
unset WHEEL_ANONYMOUS_PASSWORD

SSH_ENV_FILE=/root/ssh_env
ssh-agent -s > ${SSH_ENV_FILE}
source ${SSH_ENV_FILE}
echo "source ${SSH_ENV_FILE}" >> /root/.bashrc

npm start
