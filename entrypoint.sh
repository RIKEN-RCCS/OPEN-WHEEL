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
npm start
