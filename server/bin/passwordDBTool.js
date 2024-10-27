/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const fs = require("fs-extra");
const crypto = require("crypto");
const docopt = require("@eyalsh/docopt").default;

const { userDBFilename, userDBDir } = require("../app/db/db.js");
const { initialize, addUser, delUser, listUser } = require("../app/core/auth.js");

const toolVersion = "1.0";

const doc = `
manupirate WHEEL's user DB

Usage:
  wheel_pw [-A|--anonymous] [-u <username>] [-p <password>] [-c|--clear] [-d|--delete] [-h|--help] [--version]

Options:
  -A: create anonymous user and remove old if it exists
  -u USERNAME : username
  -p PASSWORD : password
  -c: clear DB before add new user
  -d: delete user instead of adding newuser
  -h: show this message
  --version: show version info of this tool (not WHEEL)


`;
function generatePassword() {
  const pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+{}[]<>:?.";
  let password = "";
  for (let i = 0; i < 12; i++) {
    const index = crypto.randomInt(0, pool.length);
    password += pool[index];
  }
  return password;
}

function parseOptions(options) {
  if (options["--version"] === true) {
    return "version";
  }

  const clear = options["-c"] || options["--clear"];
  const makeAnonymous = options["-A"] || options["--anonymous"];
  const deleteUser = options["-d"] || options["--delete"];
  const username = options["-u"];
  const password = options["-p"];

  let mode = "add";
  if (makeAnonymous) {
    mode = "anon";
  } else if (deleteUser) {
    mode = "del";
  } else if (username === null && password === null) {
    mode = "list";
  }

  if (mode === "add" && (username === null || password === null)) {
    console.log("username and password are requilred");
    process.exit(1);
  }
  if (mode === "del" && (username === null)) {
    console.log("username is requilred");
    process.exit(2);
  }
  return { mode, clear, username, password };
}

async function createAnonymousUser() {
  const password = generatePassword();
  await delUser("anonymous");
  await addUser("anonymous", password);
  console.log("Anonymous user created with password = ", password);
}

async function printAllUsers() {
  const users = await listUser();
  console.log(`${users.length} user exists`);
  users.forEach((e)=>{
    console.log(` ${e}`);
  });
  return users;
}

let options;
try {
  options = docopt(doc);
} catch (e) {
  console.error(e.message);
  process.exit(10);
}

const { mode, clear, username, password } = parseOptions(options);

if (mode === "version") {
  console.log(toolVersion);
  process.exit(0);
}

(async ()=>{
  if (clear && mode !== "list") {
    await fs.remove(path.resolve(userDBDir, userDBFilename));
  }

  await initialize();

  switch (mode) {
    case "list":
      await printAllUsers();
      break;
    case "del":
      await delUser(username);
      break;
    case "add":
      await addUser(username, password);
      break;
    case "anon":
      await createAnonymousUser();
      break;
  }
})();
