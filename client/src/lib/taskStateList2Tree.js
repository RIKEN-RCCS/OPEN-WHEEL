/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
import { v4 as uuidv4 } from 'uuid';

export function path2Array (pathString) {
  if (typeof pathString !== "string" || pathString === "") {
    return null;
  }
  const splitedPath = pathString.split("/");
  if (splitedPath[0] === "") {
    splitedPath.shift();
  }
  return splitedPath;
}

/**
 * @typedef TaskState
 * @param {String} - ancestorsName
 */

/**
 * add path entory to tree
 * @param {TaskState[]} taskStatelist - array of task state object
 * @param {Object} tree - tree object which will be updated
 * @return {null | boolean} - null if any error occurred, true means some update, false means no update
 */
export function taskStateList2Tree (taskStatelist, tree) {
  if (!(Object.prototype.hasOwnProperty.call(tree, "children") && Array.isArray(tree.children))) {
    return null;
  }
  let treeIsChanged = false;
  taskStatelist.forEach((task)=>{
    const ancestorsNames = path2Array(task.ancestorsName);
    const ancestorsTypes = path2Array(task.ancestorsType);
    //task.ancestorsDIspatchedTime could be undefined (it was implemented later)
    //and it implies that path2Array could return null
    //as work around, we assign empty array to ancestorsDispatchedTimes in this case.
    const ancestorsDispatchedTimes=path2Array(task.ancestorsDispatchedTime) ||[];
    let poi = tree.children; // candidate nodes
    if(ancestorsNames === null){
      const tmp = Object.assign({}, task);
      delete tmp.ancestorsName;
      delete tmp.ancestorsType;
      delete tmp.ancestorsDispatchedTime
      tmp.type = "task";
      const existingNode=poi.find((e)=>{return e.ID=== task.ID;});
      if(existingNode){
        Object.assign(existingNode, task);
      }else{
        poi.push(tmp);
      }
      treeIsChanged = true;
      return;
    }
    let entry; // current operating node
    ancestorsNames.forEach((name, index)=>{
      entry = poi.find((e)=>{
        return e.name === name;
      });

      if (typeof entry === "undefined") {
        const type = ancestorsTypes[index];
        const dispatchedTime = ancestorsDispatchedTimes[index];
        const ID=uuidv4();
        entry = { name, type, children: [], ID };
        poi.push(entry);
        treeIsChanged = true;
      }
      if (!Object.prototype.hasOwnProperty.call(entry, "children")) {
        entry.children = [];
        treeIsChanged = true;
      }
      poi = entry.children;
    });
    const leaf = entry.children.find((e)=>{
      return e.name === task.name;
    });

    if (typeof leaf === "undefined") {
      const tmp = Object.assign({}, task);
      delete tmp.ancestorsName;
      delete tmp.ancestorsType;
      // TODO in this section, read host and useJobScheduler porp
      // to store taskAndUsejobscheluler,remotetask, or remotetask to type prop
      // (currently, host and useJobScheduler porp is not sent from server)
      tmp.type = "task";
      entry.children.push(tmp);
      treeIsChanged = true;
    } else {
      for (const [k, v] of Object.entries(task)) {
        if (leaf[k] !== v && (k !== "ancestorsName") && k !== "ancestorsType") {
          leaf[k] = v;
          treeIsChanged = true;
        }
      }
    }
  });
  return treeIsChanged;
}
