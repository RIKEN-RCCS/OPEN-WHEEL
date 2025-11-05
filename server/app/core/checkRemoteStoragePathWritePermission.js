import { getSsh } from "./sshManager.js";
import { remoteHost } from "../db/db.js";

const _internal = {
  getSsh,
  remoteHost
};

/**
 * check if user has write permission to storagePath on remotehost
 * @param {string} projectRootDir - project's root path
 * @param {object} secondArg -
 * @param {string} secondArg.host - label of remotehost
 * @param {string} secondArg.storagePath - storage path on remotehost
 * @returns {Promise} - resolved if user has write permission to storagePath on remotehost
 */
export async function checkRemoteStoragePathWritePermission(projectRootDir, { host, storagePath }) {
  const remotehostID = _internal.remoteHost.getID("name", host);
  const ssh = _internal.getSsh(projectRootDir, remotehostID);
  const rt = await ssh.exec(`test -w ${storagePath}`);
  if (rt !== 0) {
    const err = new Error("bad permission");
    err.host = host;
    err.storagePath = storagePath;
    err.reason = "invalidRemoteStorage";
    throw err;
  }
  return Promise.resolve();
}

export { _internal };
