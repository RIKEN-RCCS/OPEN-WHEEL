/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const path = require("path");
const crypto = require("crypto");
const { promisify } = require("util");
const { Database } = require("sqlite3");
const { open } = require("sqlite");
const { userDBFilename, userDBDir } = require("../db/db.js");
const { getLogger } = require("../logSettings");
const logger = getLogger();

let db;
let initialized = false;

/**
 * open database and create table if not exists
 */
async function initialize() {
  //open the database
  db = await open({
    filename: path.resolve(userDBDir, userDBFilename),
    driver: Database
  });
  await db.exec("CREATE TABLE IF NOT EXISTS users ( \
    id INT PRIMARY KEY, \
    username TEXT UNIQUE, \
    hashed_password BLOB, \
    salt BLOB \
  )");
  initialized = true;
  return db;
}

/**
 * create hashed password from plain password and salt
 * @param {string} password - plain text password
 * @param {string} salt - salt string
 * @returns {string} - hashed password
 */
async function getHashedPassword(password, salt) {
  return promisify(crypto.pbkdf2)(password, salt, 210000, 32, "sha512");
}

/**
 * add new user
 * @param {string} username - new user's name
 * @param {string} password - new user's password
 */
async function addUser(username, password) {
  if (!initialized) {
    await initialize();
  }
  if (await getUserData(username) !== null) {
    const err = new Error("user already exists");
    err.username = username;
    throw err;
  }
  const id = crypto.randomUUID();
  const salt = crypto.randomBytes(16);
  const hashedPassword = await getHashedPassword(password, salt);
  await db.run("INSERT OR IGNORE INTO users (id, username, hashed_password, salt) VALUES (?, ?, ?, ?)", id, username, hashedPassword, salt);
}

/**
 * get single user data from DB
 * @param {string} username - username to be queried
 * @returns {object} - userdata which inclueds id, username, hashed_passowrd, salt
 */
async function getUserData(username) {
  const row = await db.get("SELECT * FROM users WHERE username = ?", username);
  if (!row) {
    return null;
  }
  return username === row.username ? row : null;
}

/**
 * check if specified user and password pair is valid
 * @param {string} username - user's name
 * @param {string} password - user's password in plain text
 * @returns {boolean | object} - return user data if valid pair, or false if invalid
 */
async function isValidUser(username, password) {
  if (!initialized) {
    await initialize();
  }
  //check valid user
  const row = await getUserData(username);
  if (row === null) {
    logger.trace(`user: ${username} not found`);
    return false;
  }
  const hashedPassword = await getHashedPassword(password, row.salt);

  //password verification
  if (!crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
    logger.trace("wrong password");
    return false;
  }
  return row;
}

/**
 * list all user in DB
 * @returns {string[]} - array of usernames
 */
async function listUser() {
  if (!initialized) {
    await initialize();
  }
  const tmp = await db.all("SELECT username FROM users");
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
  if (!initialized) {
    await initialize();
  }
  return db.run(`DELETE FROM users WHERE username = '${username}'`);
}

module.exports = {
  initialize,
  addUser,
  isValidUser,
  listUser,
  delUser
};
