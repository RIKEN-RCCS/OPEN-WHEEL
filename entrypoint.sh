#!/bin/bash
if [ xYES=x${WHEEL_GENERATE_KEYPAIR} ];then
  echo generate keypair
  rm  /tmp_identify /tmp_identify.pub
  ssh-keygen -t ed25519 -f /tmp_identify -N ""
  mv /tmp_identify.pub ${HOME}/.wheel/wheel_tmp_pubkey
fi
npm start
