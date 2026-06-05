/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import { hasMagic } from "glob";
import { getComponentDir, writeComponentJson, writeComponentJsonByID, readComponentJson, readComponentJsonByID } from "./componentJsonIO.js";
import { isParent } from "./componentUtility.js";
import { updateStepNumber } from "./componentOperations.js";

const _internal = {
  getComponentDir,
  readComponentJson,
  writeComponentJson,
  readComponentJsonByID,
  writeComponentJsonByID,
  isParent,
  updateStepNumber
};

/**
 * add link between 2 components
 * @param {string} projectRootDir - project's root path
 * @param {string} src - src component ID
 * @param {string} dst - destination component ID
 * @param {boolean} isElse - connect to else connector
 * @returns {Promise} - reject if link is not allowd. resolved after updated
 */
export async function addLink(projectRootDir, src, dst, isElse = false) {
  if (src === dst) {
    return Promise.reject(new Error("cyclic link is not allowed"));
  }
  const srcDir = await _internal.getComponentDir(projectRootDir, src, true);
  const srcJson = await _internal.readComponentJson(srcDir);
  const dstDir = await _internal.getComponentDir(projectRootDir, dst, true);
  const dstJson = await _internal.readComponentJson(dstDir);
  for (const type of ["viewer", "source"]) {
    if (srcJson.type !== type && dstJson.type !== type) {
      continue;
    }
    const err = new Error(`${type} can not have link`);
    err.src = src;
    err.srcName = srcJson.name;
    err.dst = dst;
    err.dstName = dstJson.name;
    err.isElse = isElse;
    err.code = "ELINK";
    return Promise.reject(err);
  }
  if (isElse && !srcJson.else.includes(dst)) {
    srcJson.else.push(dst);
  } else if (!srcJson.next.includes(dst)) {
    srcJson.next.push(dst);
  }
  await _internal.writeComponentJson(projectRootDir, srcDir, srcJson);
  if (!dstJson.previous.includes(src)) {
    dstJson.previous.push(src);
  }
  await _internal.writeComponentJson(projectRootDir, dstDir, dstJson);
  if (srcJson.type === "stepjobTask" && dstJson.type === "stepjobTask") {
    await _internal.updateStepNumber(projectRootDir);
  }
};

/**
 * remove link between 2 components
 * @param {string} projectRootDir - project's root path
 * @param {string} src - src component ID
 * @param {string} dst - destination component ID
 * @param {boolean} isElse - connect to else connector
 * @returns {Promise} - resolved after updated
 */
export async function removeLink(projectRootDir, src, dst, isElse) {
  const srcDir = await _internal.getComponentDir(projectRootDir, src, true);
  const srcJson = await _internal.readComponentJson(srcDir);
  if (isElse) {
    srcJson.else = srcJson.else.filter((e)=>{
      return e !== dst;
    });
  } else {
    srcJson.next = srcJson.next.filter((e)=>{
      return e !== dst;
    });
  }
  await _internal.writeComponentJson(projectRootDir, srcDir, srcJson);

  const dstDir = await _internal.getComponentDir(projectRootDir, dst, true);
  const dstJson = await _internal.readComponentJson(dstDir);
  dstJson.previous = dstJson.previous.filter((e)=>{
    return e !== src;
  });
  await _internal.writeComponentJson(projectRootDir, dstDir, dstJson);
};

/**
 * remove all link from specified component
 * @param {string} projectRootDir - project's root path
 * @param {string} componentID - component's ID string
 */
export async function removeAllLink(projectRootDir, componentID) {
  const dstDir = await _internal.getComponentDir(projectRootDir, componentID, true);
  const dstJson = await _internal.readComponentJson(dstDir);

  const srcComponents = dstJson.previous || [];
  const dstComponents = [...(dstJson.next || []), ...(dstJson.else || [])];
  const p = [];

  //Remove this component from previous components' next/else
  for (const src of srcComponents) {
    const srcDir = await _internal.getComponentDir(projectRootDir, src, true);
    const srcJson = await _internal.readComponentJson(srcDir);
    if (Array.isArray(srcJson.next)) {
      srcJson.next = srcJson.next.filter((e)=>{
        return e !== componentID;
      });
    }
    if (Array.isArray(srcJson.else)) {
      srcJson.else = srcJson.else.filter((e)=>{
        return e !== componentID;
      });
    }
    p.push(_internal.writeComponentJson(projectRootDir, srcDir, srcJson));
  }

  //Remove this component from next components' previous
  for (const dst of dstComponents) {
    const dstComponentDir = await _internal.getComponentDir(projectRootDir, dst, true);
    const dstComponentJson = await _internal.readComponentJson(dstComponentDir);
    if (Array.isArray(dstComponentJson.previous)) {
      dstComponentJson.previous = dstComponentJson.previous.filter((e)=>{
        return e !== componentID;
      });
    }
    p.push(_internal.writeComponentJson(projectRootDir, dstComponentDir, dstComponentJson));
  }

  //Clear all links on this component
  dstJson.previous = [];
  dstJson.next = [];
  dstJson.else = [];
  p.push(_internal.writeComponentJson(projectRootDir, dstDir, dstJson));
  return Promise.all(p);
};

/**
 * add file link between 2 components
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID
 * @param {string} srcName - outputFile name
 * @param {string} dstNode - destination component ID
 * @param {string} argDstName - inputFile name
 * @returns {Promise} - resolved after updated
 */
export async function addFileLink(projectRootDir, srcNode, srcName, dstNode, argDstName) {
  if (srcNode === dstNode) {
    return Promise.reject(new Error("cyclic link is not allowed"));
  }
  const dstName = hasMagic(argDstName) ? "./" : argDstName;
  if (await _internal.isParent(projectRootDir, dstNode, srcNode)) {
    return _internal.addFileLinkToParent(projectRootDir, srcNode, srcName, dstName);
  }
  if (await _internal.isParent(projectRootDir, srcNode, dstNode)) {
    return _internal.addFileLinkFromParent(projectRootDir, srcName, dstNode, dstName);
  }
  return _internal.addFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);
};

/**
 * remove filelink between 2 components
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID
 * @param {string} srcName - outputFile name
 * @param {string} dstNode - destination component ID
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved after updated
 */
export async function removeFileLink(projectRootDir, srcNode, srcName, dstNode, dstName) {
  if (await _internal.isParent(projectRootDir, dstNode, srcNode)) {
    return _internal.removeFileLinkToParent(projectRootDir, srcNode, srcName, dstName);
  }
  if (await _internal.isParent(projectRootDir, srcNode, dstNode)) {
    return _internal.removeFileLinkFromParent(projectRootDir, srcName, dstNode, dstName);
  }
  return _internal.removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName);
};

/**
 * remove all filelink on the inputFile
 * @param {string} projectRootDir - project's root path
 * @param {string} componentID - ID of component which has filelink to be removed
 * @param {string} inputFilename - inputFile which has filelink to be removed
 * @param {boolean} fromChildren - if true, remove filelink from children
 * @returns {Promise} - resolved after updated
 */
export async function removeAllFileLink(projectRootDir, componentID, inputFilename, fromChildren) {
  const targetDir = await _internal.getComponentDir(projectRootDir, componentID, true);
  const componentJson = await _internal.readComponentJson(targetDir);
  const p = [];
  if (fromChildren) {
    const outputFile = componentJson.outputFiles.find((e)=>{
      return e.name === inputFilename;
    });
    if (!outputFile) {
      return new Error(`${inputFilename} not found in parent's outputFiles`);
    }
    if (!Array.isArray(outputFile.origin)) {
      return true;
    }
    for (const { srcNode, srcName } of outputFile.origin) {
      p.push(_internal.removeFileLinkToParent(projectRootDir, srcNode, srcName, inputFilename));
    }
  } else {
    const inputFile = componentJson.inputFiles.find((e)=>{
      return e.name === inputFilename;
    });
    if (!inputFile) {
      return new Error(`${inputFilename} not found in inputFiles`);
    }
    for (const { srcNode, srcName } of inputFile.src) {
      p.push(_internal.removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, componentID, inputFilename));
    }
  }
  return Promise.all(p);
}

/**
 * add new file link to parent component
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID
 * @param {string} srcName - outputFile name
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved when all component JSON files are writted
 */
export async function addFileLinkToParent(projectRootDir, srcNode, srcName, dstName) {
  const srcDir = await _internal.getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await _internal.readComponentJson(srcDir);
  const parentDir = path.dirname(srcDir);
  const parentJson = await _internal.readComponentJson(parentDir);
  const parentID = parentJson.ID;

  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (!srcOutputFile.dst.includes({ dstNode: parentID, dstName })) {
    srcOutputFile.dst.push({ dstNode: parentID, dstName, forceCopy: false });
  }
  const p = _internal.writeComponentJson(projectRootDir, srcDir, srcJson);

  const parentOutputFile = parentJson.outputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (!Object.prototype.hasOwnProperty.call(parentOutputFile, "origin")) {
    parentOutputFile.origin = [];
  }
  if (!parentOutputFile.origin.includes({ srcNode, srcName })) {
    parentOutputFile.origin.push({ srcNode, srcName });
  }
  await p;
  return _internal.writeComponentJson(projectRootDir, parentDir, parentJson);
}

/**
 * add new file link from parent component
 * @param {string} projectRootDir - project's root path
 * @param {string} srcName - outputFile name
 * @param {string} dstNode - destination component ID
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved when all component JSON files are writted
 */
export async function addFileLinkFromParent(projectRootDir, srcName, dstNode, dstName) {
  const dstDir = await _internal.getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await _internal.readComponentJson(dstDir);
  const parentDir = path.dirname(dstDir);
  const parentJson = await _internal.readComponentJson(parentDir);
  const parentID = parentJson.ID;

  const parentInputFile = parentJson.inputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (!Object.prototype.hasOwnProperty.call(parentInputFile, "forwardTo")) {
    parentInputFile.forwardTo = [];
  }
  if (!parentInputFile.forwardTo.includes({ dstNode, dstName })) {
    parentInputFile.forwardTo.push({ dstNode, dstName });
  }
  const p = _internal.writeComponentJson(projectRootDir, parentDir, parentJson);

  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (typeof dstInputFile === "undefined") {
    dstJson.inputFiles.push({ name: dstName, src: [{ srcNode: parentID, srcName }] });
  } else if (!dstInputFile.src.includes({ srcNode: parentID, srcName })) {
    dstInputFile.src.push({ srcNode: parentID, srcName });
  }
  await p;
  return _internal.writeComponentJson(projectRootDir, dstDir, dstJson);
}

/**
 * add file link between sibling components
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID
 * @param {string} srcName - outputFile name
 * @param {string} dstNode - destination component ID
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved when all component JSON files are writted
 */
export async function addFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName) {
  const srcDir = await _internal.getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await _internal.readComponentJson(srcDir);
  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (!srcOutputFile.dst.includes({ dstNode, dstName })) {
    srcOutputFile.dst.push({ dstNode, dstName, forceCopy: false });
  }
  const p1 = _internal.writeComponentJson(projectRootDir, srcDir, srcJson);

  const dstDir = await _internal.getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await _internal.readComponentJson(dstDir);
  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (typeof dstInputFile === "undefined") {
    dstJson.inputFiles.push({ name: dstName, src: [{ srcNode, srcName }] });
  } else if (!dstInputFile.src.includes({ srcNode, srcName })) {
    dstInputFile.src.push({ srcNode, srcName });
  }
  await p1;
  return _internal.writeComponentJson(projectRootDir, dstDir, dstJson);
}

/**
 * remove filelink to parent component
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID
 * @param {string} srcName - outputFile name
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved when all component JSON files are writted
 */
export async function removeFileLinkToParent(projectRootDir, srcNode, srcName, dstName) {
  const srcDir = await _internal.getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await _internal.readComponentJson(srcDir);
  const parentDir = path.dirname(srcDir);
  const parentJson = await _internal.readComponentJson(parentDir);

  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  srcOutputFile.dst = srcOutputFile.dst.filter((e)=>{
    return e.dstNode !== parentJson.ID || e.dstName !== dstName;
  });
  const p = _internal.writeComponentJson(projectRootDir, srcDir, srcJson);

  const parentOutputFile = parentJson.outputFiles.find((e)=>{
    return e.name === dstName;
  });
  if (Object.prototype.hasOwnProperty.call(parentOutputFile, "origin")) {
    parentOutputFile.origin = parentOutputFile.origin.filter((e)=>{
      return e.srcNode !== srcNode || e.srcName !== srcName;
    });
  }

  await p;
  return _internal.writeComponentJson(projectRootDir, parentDir, parentJson);
}

/**
 * remove filelink from parent component
 * @param {string} projectRootDir - project's root path
 * @param {string} srcName - outputFile name
 * @param {string} dstNode - destination component ID
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved when all component JSON files are writted
 */
export async function removeFileLinkFromParent(projectRootDir, srcName, dstNode, dstName) {
  const dstDir = await _internal.getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await _internal.readComponentJson(dstDir);
  const parentDir = path.dirname(dstDir);
  const parentJson = await _internal.readComponentJson(parentDir);
  const parentID = parentJson.ID;

  const parentInputFile = parentJson.inputFiles.find((e)=>{
    return e.name === srcName;
  });
  if (Object.prototype.hasOwnProperty.call(parentInputFile, "forwardTo")) {
    parentInputFile.forwardTo = parentInputFile.forwardTo.filter((e)=>{
      return e.dstNode !== dstNode || e.dstName !== dstName;
    });
  }
  const p = _internal.writeComponentJson(projectRootDir, parentDir, parentJson);

  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  dstInputFile.src = dstInputFile.src.filter((e)=>{
    return e.srcNode !== parentID || e.srcName !== srcName;
  });
  await p;
  return _internal.writeComponentJson(projectRootDir, dstDir, dstJson);
}

/**
 * remove filelink between sibling components
 * @param {string} projectRootDir - project's root path
 * @param {string} srcNode - src component ID
 * @param {string} srcName - outputFile name
 * @param {string} dstNode - destination component ID
 * @param {string} dstName - inputFile name
 * @returns {Promise} - resolved when all component JSON files are writted
 */
export async function removeFileLinkBetweenSiblings(projectRootDir, srcNode, srcName, dstNode, dstName) {
  const srcDir = await _internal.getComponentDir(projectRootDir, srcNode, true);
  const srcJson = await _internal.readComponentJson(srcDir);
  const srcOutputFile = srcJson.outputFiles.find((e)=>{
    return e.name === srcName;
  });
  srcOutputFile.dst = srcOutputFile.dst.filter((e)=>{
    return !(e.dstNode === dstNode && e.dstName === dstName);
  });
  const p = _internal.writeComponentJson(projectRootDir, srcDir, srcJson);

  const dstDir = await _internal.getComponentDir(projectRootDir, dstNode, true);
  const dstJson = await _internal.readComponentJson(dstDir);
  const dstInputFile = dstJson.inputFiles.find((e)=>{
    return e.name === dstName;
  });
  dstInputFile.src = dstInputFile.src.filter((e)=>{
    return !(e.srcNode === srcNode && e.srcName === srcName);
  });
  await p;
  return _internal.writeComponentJson(projectRootDir, dstDir, dstJson);
}

/**
 *
 * @param {string} projectRootDir - project's root path
 * @param {string} ID - ID string of component which has link to be deleted
 */
export async function removeAllLinkFromComponent(projectRootDir, ID) {
  const counterparts = new Map();
  const component = await _internal.readComponentJsonByID(projectRootDir, ID);
  if (Object.prototype.hasOwnProperty.call(component, "previous")) {
    for (const previousComponent of component.previous) {
      const counterpart = counterparts.get(previousComponent) || await _internal.readComponentJsonByID(projectRootDir, previousComponent);
      counterpart.next = counterpart.next.filter((e)=>{
        return e !== component.ID;
      });
      if (counterpart.else) {
        counterpart.else = counterpart.else.filter((e)=>{
          return e !== component.ID;
        });
      }
      counterparts.set(counterpart.ID, counterpart);
    }
  }
  if (Object.prototype.hasOwnProperty.call(component, "next")) {
    for (const nextComponent of component.next) {
      const counterpart = counterparts.get(nextComponent) || await _internal.readComponentJsonByID(projectRootDir, nextComponent);
      counterpart.previous = counterpart.previous.filter((e)=>{
        return e !== component.ID;
      });
      counterparts.set(counterpart.ID, counterpart);
    }
  }
  if (Object.prototype.hasOwnProperty.call(component, "else")) {
    for (const elseComponent of component.else) {
      const counterpart = counterparts.get(elseComponent) || await _internal.readComponentJsonByID(projectRootDir, elseComponent);
      counterpart.previous = counterpart.previous.filter((e)=>{
        return e !== component.ID;
      });
      counterparts.set(counterpart.ID, counterpart);
    }
  }
  if (Object.prototype.hasOwnProperty.call(component, "inputFiles")) {
    for (const inputFile of component.inputFiles) {
      for (const src of inputFile.src) {
        const srcComponent = src.srcNode;
        const counterpart = counterparts.get(srcComponent) || await _internal.readComponentJsonByID(projectRootDir, srcComponent);
        for (const outputFile of counterpart.outputFiles) {
          outputFile.dst = outputFile.dst.filter((e)=>{
            return e.dstNode !== component.ID;
          });
        }
        counterparts.set(counterpart.ID, counterpart);
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(component, "outputFiles")) {
    for (const outputFile of component.outputFiles) {
      for (const dst of outputFile.dst) {
        const dstComponent = dst.dstNode;
        const counterpart = counterparts.get(dstComponent) || await _internal.readComponentJsonByID(projectRootDir, dstComponent);
        for (const inputFile of counterpart.inputFiles) {
          inputFile.src = inputFile.src.filter((e)=>{
            return e.srcNode !== component.ID;
          });
        }
        counterparts.set(counterpart.ID, counterpart);
      }
    }
  }

  for (const [counterPartID, counterpart] of counterparts) {
    await _internal.writeComponentJsonByID(projectRootDir, counterPartID, counterpart);
  }
};

//Add helper functions to _internal for testing
_internal.addFileLinkBetweenSiblings = addFileLinkBetweenSiblings;
_internal.removeFileLinkBetweenSiblings = removeFileLinkBetweenSiblings;
_internal.addFileLinkToParent = addFileLinkToParent;
_internal.removeFileLinkToParent = removeFileLinkToParent;
_internal.addFileLinkFromParent = addFileLinkFromParent;
_internal.removeFileLinkFromParent = removeFileLinkFromParent;

export { _internal };
