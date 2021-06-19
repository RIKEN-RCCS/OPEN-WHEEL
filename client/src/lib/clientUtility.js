/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict"

/**
 * remove one entry from array
 * @param {Object[] | string[]} array - target array
 * @param {Object | string} target - element to be removed
 * @param {string} [prop]- element's property which to be used at compare time
 * @return {number} - removed element's index
 */
export function removeFromArray (array, target, prop) {
  const targetIndex = array.findIndex((e)=>{
    if (typeof target === "string") {
      return e === target
    }
    if (typeof prop === "string") {
      return e[prop] === target[prop]
    }
    return false
  })
  if (targetIndex !== -1) {
    array.splice(targetIndex, 1)
  }
  return targetIndex
}

/**
 * check feather given token is surrounded by { and }
 * @param {string} token - string to be checked
 * @return {boolean}
 */
export function isSurrounded (token) {
  return token.startsWith("{") && token.endsWith("}")
}

/**
 * remove heading '{' and trailing '}'
 * @param {string} token - string to be checked
 * @return {string} - trimed token
 */
export function trimSurrounded (token) {
  if (!isSurrounded(token)) {
    return token
  }
  const rt = /{+(.*)}+/.exec(token)
  return (Array.isArray(rt) && typeof rt[1] === "string") ? rt[1] : token
}

/**
 * transform grob string to array
 * @param {string} - grob pattern
 */
export function glob2Array (token) {
  // TODO {}で囲われているものは1つのエントリにする必要がある!!
  // が、この制約に対処するよりは、include/excludeのエントリをglobパターンの配列とする変更をしたい。
  return trimSurrounded(token).split(",")
}

/**
 * construct glob pattern from array of glob patterns
 * @param {string []} tokens - array of grlob patterns
 * @return {string} - glob pattern
 */
export function array2Glob (tokens) {
  const concatenatedString = tokens.reduce((a, c)=>{
    return `${a},${c}`
  })
  return `{${concatenatedString}}`
}

/**
 * add glob pattern to existing glob
 * @param {string} old - glob pattern
 * @param {string} add - new glob pattern to be added
 * @return {string} - combined glob pattern
 */
export function addGlobPattern (old, added) {
  // for the first time
  if (typeof old !== "string" || old === "") {
    return added
  }

  // only one entry in include
  if (!isSurrounded(old)) {
    return `{${old},${added}}`
  }

  // more than one entry in include
  const tmp = glob2Array(old)
  tmp.push(added)
  return array2Glob(tmp)
}

/**
 * remove part of globpattern
 * @param {string} glob  - glob pattern to be modified
 * @param {string} token - part of glob pattern to be removed
 * @param {number} index - position of glob pattern to be removed
 * @return {string} - new glob pattern
 */
export function removeGlobPattern (glob, token, index) {
  const globArray = glob2Array(glob)
  if (globArray.length <= 1) {
    return null
  }
  globArray.splice(index, 1)
  return globArray.length === 1 ? globArray[0] : array2Glob(globArray)
}

/**
 * update part of glob
 * @param {string} glob  - glob pattern to be modified
 * @param {string} token - new part of glob
 * @param {number} index - position of glob pattern to be replaced
 * @return {string} - new glob pattern
 */
export function updateGlobPattern (glob, token, index) {
  const globArray = glob2Array(glob)
  if (globArray.length <= 1) {
    return null
  }
  globArray[index] = token
  return globArray.length === 1 ? globArray[0] : array2Glob(globArray)
}
