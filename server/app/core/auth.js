/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import crypto from "crypto";
import { promisify } from "util";
import sqlite3 from "sqlite3";
const { Database } = sqlite3;
import { open } from "sqlite";
import { userDBFilename, userDBDir } from "../db/db.js";
import { getLogger } from "../logSettings.js";

const _internal = {
  crypto,
  db: null,
  initialized: false,
  logger: getLogger(),
  open
};

/**
 * open database and create table if not exists
 */
_internal.initialize = async function () {
  //open the database
  _internal.db = await _internal.open({
    filename: path.resolve(userDBDir, userDBFilename),
    driver: Database
  });
  const initSQL = `CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY,
  username TEXT UNIQUE,
  hashed_password BLOB,
  salt BLOB)`;
  await _internal.db.exec(initSQL);
  _internal.initialized = true;
  return _internal.db;
};

/**
 * create hashed password from plain password and salt
 * @param {string} password - plain text password
 * @param {string} salt - salt string
 * @returns {string} - hashed password
 */
_internal.getHashedPassword = async function (password, salt) {
  return promisify(_internal.crypto.pbkdf2)(password, salt, 210000, 32, "sha512");
};

/**
 * add new user
 * @param {string} username - new user's name
 * @param {string} password - new user's password
 */
async function addUser(username, password) {
  if (!_internal.initialized) {
    await _internal.initialize();
  }
  if (await _internal.getUserData(username) !== null) {
    const err = new Error("user already exists");
    err.username = username;
    throw err;
  }
  const id = _internal.crypto.randomUUID();
  const salt = _internal.crypto.randomBytes(16);
  const hashedPassword = await _internal.getHashedPassword(password, salt);
  await _internal.db.run("INSERT OR IGNORE INTO users (id, username, hashed_password, salt) VALUES (?, ?, ?, ?)", id, username, hashedPassword, salt);
}

/**
 * get single user data from DB
 * @param {string} username - username to be queried
 * @returns {object} - userdata which inclueds id, username, hashed_passowrd, salt
 */
_internal.getUserData = async function (username) {
  const row = await _internal.db.get("SELECT * FROM users WHERE username = ?", username);
  if (!row) {
    return null;
  }
  return username === row.username ? row : null;
};

/**
 * check if specified user and password pair is valid
 * @param {string} username - user's name
 * @param {string} password - user's password in plain text
 * @returns {boolean | object} - return user data if valid pair, or false if invalid
 */
async function isValidUser(username, password) {
  if (!_internal.initialized) {
    await _internal.initialize();
  }
  //check valid user
  const row = await _internal.getUserData(username);
  if (row === null) {
    _internal.logger.trace(`user: ${username} not found`);
    return false;
  }
  const hashedPassword = await _internal.getHashedPassword(password, row.salt);

  //password verification
  if (!_internal.crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
    _internal.logger.trace("wrong password");
    return false;
  }
  return row;
}

/**
 * list all user in DB
 * @returns {string[]} - array of usernames
 */
async function listUser() {
  if (!_internal.initialized) {
    await _internal.initialize();
  }
  const tmp = await _internal.db.all("SELECT username FROM users");
  return tmp.map((e)=>{
    return e.username;
  });
}

/**
 * delete user from DB
 * @param {string} username - user's name
 * @returns {boolean} - false if user does not exist in DB
 */
async function delUser(username) {
  if (!_internal.initialized) {
    await _internal.initialize();
  }
  return _internal.db.run(`DELETE FROM users WHERE username = '${username}'`);
}

export const getHashedPassword = _internal.getHashedPassword;
export const initialize = _internal.initialize;
export { addUser, isValidUser, listUser, delUser };
export const getUserData = _internal.getUserData;
export { _internal };
