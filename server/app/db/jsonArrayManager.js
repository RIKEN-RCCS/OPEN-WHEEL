/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const fs = require("fs-extra");
const uuidv1 = require("uuid/v1");

class JsonArrayManager {
  constructor(filename) {
    this.filename = filename;
    this.data = [];

    try {
      this.data = fs.readJsonSync(this.filename);
    } catch (e) {
      if (e.code === "ENOENT") {
        this.write();
      } else {
        throw e;
      }
    }
  }

  async write() {
    return fs.writeJson(this.filename, this.data, { spaces: 4 });
  }

  /**
   * add new entry
   * please note that if the entry has 'id' key, the value will be overwritten.
   * @param {Object} entry - data to be added
   */
  add(entry) {
    entry.id = uuidv1();
    this.data.push(entry);
    return this.write();
  }

  /**
   * add new entry at the top of array
   * @param {Object} entry - data to be added at the begining of array
   */
  async unshift(entry) {
    entry.id = uuidv1();
    this.data.unshift(entry);
    await this.write();
    return entry.id;
  }

  /**
   * update entry
   * @param {Object} entry
   */
  async update(entry) {
    const targetIndex = this.data.findIndex((e)=>{
      return e.id === entry.id;
    });
    Object.assign(this.data[targetIndex], entry);
    return this.write();
  }

  /**
   * remove existing entry
   * @param {string} id - id of target entry
   */
  async remove(id) {
    this.data = this.data.filter((e)=>{
      return e.id !== id;
    });
    return this.write();
  }


  /**
   * remove existing entries
   * @param {string[]} ids - array of id to be removed
   */
  async removeMany(ids) {
    this.data = this.data.filter((e)=>{
      return !ids.includes(e.id);
    });
    return this.write();
  }

  /**
   * add duplicated entry
   * @param {string} id - id of src entry
   */
  async copy(id) {
    const target = this.data.find((e)=>{
      return e.id === id;
    });
    const duplicate = Object.assign({}, target);
    duplicate.id = uuidv1();
    this.data.unshift(duplicate);
    return this.write();
  }

  /**
   * add duplicated entry
   * @param {string} id - id of src entry
   */
  /**
   * to be removed
   * @param {*} id - to be removed
   * @param {*} newLabel - to be removed
   * @returns {Promise} - to be removed
   * @memberof JsonArrayManager
   */
  jobScriptcopy(id, newLabel) {
    const target = this.data.find((e)=>{
      return e.id === id;
    });
    const duplicate = Object.assign({}, target);
    duplicate.id = uuidv1();
    duplicate.templateName = newLabel;
    this.data.push(duplicate);
    return this.write();
  }

  /**
   * get the entry which have specified id
   * @param {string} id - id
   */
  get(id) {
    return this.query("id", id);
  }

  /**
   * get the specified element of array
   * this function will throw RangeError if specified index is out of range
   * @param {string} index - array index
   */
  getByPosition(index) {
    return this.data[index];
  }

  /**
   * return entry id with specific key:value pair
   * @param {string} key - query target's property name
   * @param {string} value - query criteria
   */
  getID(key, value) {
    const entry = this.query(key, value);
    return entry ? entry.id : entry;
  }

  /**
   * return entry with specific key:value pair
   * @param {string} key - query target's property name
   * @param {string} value - query criteria
   */
  query(key, value) {
    return this.data.find((e)=>{
      return e[key] === value;
    });
  }

  /**
   * getter for data array
   */
  getAll() {
    return this.data;
  }

  /**
   * reorder data array
   * @param {string[]} newOrder - array of indeces stored in new order
   */
  reorder(newOrder) {
    if (this.data.length !== newOrder.length) {
      return Promise.resolve();
    }
    const tmp = Array.from(this.data);

    for (let i = 0; i < tmp.length; i++) {
      this.data[i] = tmp[newOrder[i]];
    }
    return this.write();
  }
}

module.exports = JsonArrayManager;
