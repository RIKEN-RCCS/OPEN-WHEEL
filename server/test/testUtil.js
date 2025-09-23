/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

async function sleep(time) {
  return new Promise((resolve)=>{
    setTimeout(resolve, time);
  });
}

module.exports = {
  sleep
};
