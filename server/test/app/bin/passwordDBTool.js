/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

import path from "path";
import os from "os";
import fs from "fs-extra";
import { execFile } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { expect } from "chai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, "../../..");
const execFileAsync = promisify(execFile);

/**
 * run passwordDBTool.js
 * @param {string[]} args - command line arguments
 * @param {string} userDBDir - directory of user DB
 * @param {string} [input] - data to be written to stdin
 * @returns {Promise<object>} - exit code and stdout
 */
async function runTool(args, userDBDir, input) {
  const p = execFileAsync("node", ["bin/passwordDBTool.js", ...args], {
    cwd: serverDir,
    env: { ...process.env, WHEEL_USER_DB_DIR: userDBDir }
  });
  p.child.stdin.end(input);

  try {
    const { stdout } = await p;
    return { code: 0, stdout };
  } catch (e) {
    return { code: e.code, stdout: e.stdout };
  }
}

/**
 * check username and password in a separate process which reads user DB in userDBDir
 * @param {string} username - username
 * @param {string} password - password
 * @param {string} userDBDir - directory of user DB
 * @returns {Promise<boolean>} - true if valid
 */
async function isValid(username, password, userDBDir) {
  const script = `import { isValidUser } from "./app/core/auth.js";
const rt = await isValidUser(process.env.U, process.env.P);
process.stdout.write(rt ? "valid" : "invalid");`;
  const { stdout } = await execFileAsync("node", ["--input-type=module", "-e", script], {
    cwd: serverDir,
    env: { ...process.env, WHEEL_USER_DB_DIR: userDBDir, U: username, P: password }
  });
  return stdout.endsWith("valid") && !stdout.endsWith("invalid");
}

describe("passwordDBTool UT", function () {
  this.timeout(20000);
  let userDBDir;
  beforeEach(async ()=>{
    userDBDir = await fs.mkdtemp(path.join(os.tmpdir(), "wheel-pwtool-"));
  });
  afterEach(async ()=>{
    await fs.remove(userDBDir);
  });
  describe("--password-stdin", ()=>{
    it("should add user with password read from stdin", async ()=>{
      const rt = await runTool(["-u", "anonymous", "--password-stdin", "-c"], userDBDir, "s3cr#t pass\n");
      expect(rt.code).to.equal(0);
      expect(await isValid("anonymous", "s3cr#t pass", userDBDir)).to.be.true;
      expect(await isValid("anonymous", "s3cr#t pass\n", userDBDir)).to.be.false;
    });
    it("should fail if stdin is empty", async ()=>{
      const rt = await runTool(["-u", "anonymous", "--password-stdin", "-c"], userDBDir, "");
      expect(rt.code).to.equal(3);
    });
  });
  describe("-p", ()=>{
    it("should add user with password given by -p", async ()=>{
      const rt = await runTool(["-u", "foo", "-p", "bar", "-c"], userDBDir, "");
      expect(rt.code).to.equal(0);
      expect(await isValid("foo", "bar", userDBDir)).to.be.true;
    });
  });
});
