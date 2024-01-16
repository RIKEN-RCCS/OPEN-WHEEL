/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

export function required (v) {
  return v === 0 || !!v || "Required.";
}

export function validPortNumber (v) {
  if(v === ""){
    return true
  }
  if (typeof v !== "number") {
    return false;
  }
  return (v > 0 && v < 65536) || "out of port number range";
}
export function positiveNumber (allowEmpty, v) {
  if(allowEmpty){
    if (v === "" || typeof v === "undefined") {
      return true;
    }
  }
  return (typeof v === "number" && v >= 0) || allowEmpty? "0 or more" : "more than 0";
}
