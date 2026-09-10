#!/bin/bash
# a blank TZ (e.g. from an unset host env var passed through compose as
# TZ: ${TZ:-}) must not be left set, since glibc/Node treat an explicitly
# empty TZ the same as TZ=UTC - unsetting it instead falls through to the
# image's baked-in default (see Dockerfile's `ENV TZ=Etc/UTC`)
if [ -z "${TZ}" ]; then
  unset TZ
fi
echo "timezone = ${TZ:-Etc/UTC (image default)}"

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
    node bin/passwordDBTool.js -u anonymous -p "${WHEEL_ANONYMOUS_PASSWORD}" -c
  fi
  export WHEEL_ENABLE_AUTH=YES
fi

# start an ssh-agent for the WHEEL server. WHEEL spawns many `ssh` subprocesses
# (ssh-client-wrapper) that inherit SSH_AUTH_SOCK from this process, so with
# AddKeysToAgent in the user's ssh config the key passphrase is entered once (via
# the browser prompt) and reused, and agent forwarding works for ProxyJump chains.
# The socket lives on a container-local path (/tmp is not bind-mounted) so nothing
# is written into a bind-mounted home - a shared /etc/bash.bashrc line (see
# Dockerfile) lets `docker exec ... bash` pick up the same agent.
export SSH_AUTH_SOCK=/tmp/wheel-ssh-agent.sock
rm -f "${SSH_AUTH_SOCK}"
ssh-agent -a "${SSH_AUTH_SOCK}" > /dev/null

exec npm start
