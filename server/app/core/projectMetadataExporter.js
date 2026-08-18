/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { writeFile } from "node:fs/promises";
import path from "path";
import fs from "fs-extra";
import { getAllComponentIDs } from "./projectJsonFileOperator.js";
import { getComponentDir, readComponentJsonByID } from "./componentJsonIO.js";
import { getLogger } from "../logSettings.js";
import { debugMetadataJson, debugMetadataXml } from "../db/db.js";

const _internal = {
  getAllComponentIDs,
  readComponentJsonByID,
  getComponentDir,
  fs,
  getLogger
};

/**
 * Get the property name that holds a task/if/while component's script (or
 * condition script/expression) filename, for the 3 types whose script
 * content should be embedded in the exported metadata.
 * @param {string} type - component type
 * @returns {string|null} - property name, or null if this type has no script field
 */
function getScriptFieldName(type) {
  if (type === "task") {
    return "script";
  }
  if (type === "if" || type === "while") {
    return "condition";
  }
  return null;
}

/**
 * Escape special XML characters in a string value.
 * @param {string|number|boolean|null|undefined} value - value to escape
 * @returns {string} - XML-safe string
 */
function escapeXml(value) {
  const str = value === null || value === undefined ? "" : String(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Convert a single component (with optional nested children) to XML string.
 * @param {object} component - component object
 * @param {string} indent - current indentation string
 * @returns {string} - XML fragment for this component
 */
function componentToXml(component, indent = "  ") {
  const type = escapeXml(component.type);
  const name = escapeXml(component.name);
  const id = escapeXml(component.ID);
  let xml = `${indent}<component type="${type}" name="${name}" id="${id}">\n`;

  //Simple scalar fields
  const scalarFields = [
    "description", "script", "condition", "host", "queue", "submitOption", "sourceScript",
    "retry", "retryCondition", "checker", "cleanupFlag", "disable",
    "ignoreFailure", "useJobScheduler", "storagePath", "state", "memo"
  ];
  for (const field of scalarFields) {
    if (component[field] !== null && component[field] !== undefined) {
      xml += `${indent}  <${field}>${escapeXml(component[field])}</${field}>\n`;
    }
  }

  //script/condition file content (task/if/while) - multi-line free text, so
  //CDATA instead of entity-escaping; fall back to escaping only in the rare
  //case the content itself contains the CDATA terminator.
  if (typeof component.scriptContent === "string") {
    xml += `${indent}  <scriptContent>`;
    xml += component.scriptContent.includes("]]>")
      ? escapeXml(component.scriptContent)
      : `<![CDATA[${component.scriptContent}]]>`;
    xml += "</scriptContent>\n";
  }

  //env object
  if (component.env && Object.keys(component.env).length > 0) {
    xml += `${indent}  <env>\n`;

    for (const [key, value] of Object.entries(component.env)) {
      xml += `${indent}    <variable name="${escapeXml(key)}">${escapeXml(value)}</variable>\n`;
    }
    xml += `${indent}  </env>\n`;
  }

  //inputFiles array
  if (Array.isArray(component.inputFiles) && component.inputFiles.length > 0) {
    xml += `${indent}  <inputFiles>\n`;

    for (const f of component.inputFiles) {
      const mandatory = f.mandatory === true ? "true" : "false";
      if (Array.isArray(f.src) && f.src.length > 0) {
        xml += `${indent}    <inputFile name="${escapeXml(f.name)}" mandatory="${mandatory}">\n`;

        for (const s of f.src) {
          xml += `${indent}      <src srcNode="${escapeXml(s.srcNode)}" srcName="${escapeXml(s.srcName)}"/>\n`;
        }
        xml += `${indent}    </inputFile>\n`;
      } else {
        xml += `${indent}    <inputFile name="${escapeXml(f.name)}" mandatory="${mandatory}"/>\n`;
      }
    }
    xml += `${indent}  </inputFiles>\n`;
  }

  //outputFiles array
  if (Array.isArray(component.outputFiles) && component.outputFiles.length > 0) {
    xml += `${indent}  <outputFiles>\n`;

    for (const f of component.outputFiles) {
      if (Array.isArray(f.dst) && f.dst.length > 0) {
        xml += `${indent}    <outputFile name="${escapeXml(f.name)}">\n`;

        for (const d of f.dst) {
          xml += `${indent}      <dst dstNode="${escapeXml(d.dstNode)}" dstName="${escapeXml(d.dstName)}"/>\n`;
        }
        xml += `${indent}    </outputFile>\n`;
      } else {
        xml += `${indent}    <outputFile name="${escapeXml(f.name)}"/>\n`;
      }
    }
    xml += `${indent}  </outputFiles>\n`;
  }

  //Nested children
  if (Array.isArray(component.children) && component.children.length > 0) {
    xml += `${indent}  <children>\n`;

    for (const child of component.children) {
      xml += componentToXml(child, `${indent}    `);
    }
    xml += `${indent}  </children>\n`;
  }

  xml += `${indent}</component>\n`;
  return xml;
}

/**
 * Gather all component metadata from a project into a nested JSON tree.
 * Components are organized by parent-child relationships. Root components
 * (those with parent === "this is root") form the top level of the tree.
 * @param {string} projectRootDir - absolute path to project root directory
 * @returns {Promise<object>} - nested component tree with shape { components: [...] }
 */
export async function gatherComponentMetadata(projectRootDir) {
  const allIDs = await _internal.getAllComponentIDs(projectRootDir);

  const componentMap = new Map();
  for (const id of allIDs) {
    const component = await _internal.readComponentJsonByID(projectRootDir, id);

    //for task/if/while, embed the referenced script's content alongside its
    //filename - but if/while's "condition" is dual-purpose (a script filename
    //OR a raw JS expression), so only attempt this when it actually resolves
    //to a file on disk, same disambiguation evalCondition() uses at run time.
    const scriptField = getScriptFieldName(component.type);
    if (scriptField && typeof component[scriptField] === "string" && component[scriptField]) {
      try {
        const componentDir = await _internal.getComponentDir(projectRootDir, id, true);
        if (componentDir) {
          const scriptPath = path.resolve(componentDir, component[scriptField]);
          if (await _internal.fs.pathExists(scriptPath)) {
            component.scriptContent = await _internal.fs.readFile(scriptPath, "utf8");
          }
        }
      } catch (e) {
        _internal.getLogger(projectRootDir).warn(`failed to read script content for component ${id} (${scriptField}=${component[scriptField]}): ${e.message}`);
      }
    }
    componentMap.set(id, component);
  }

  /**
   * Recursively build subtree for components whose parent is parentID.
   * @param {string} parentID - ID of parent component
   * @returns {object[]} - array of component nodes with nested children
   */
  function buildSubtree(parentID) {
    const children = [];
    for (const [id, component] of componentMap) {
      if (component.parent === parentID) {
        const node = { ...component };
        const subtreeChildren = buildSubtree(id);
        if (subtreeChildren.length > 0) {
          node.children = subtreeChildren;
        }
        children.push(node);
      }
    }
    return children;
  }

  const rootComponents = buildSubtree("this is root");
  if (debugMetadataJson) {
    await writeFile(debugMetadataJson, JSON.stringify({ components: rootComponents }, null, 2));
  }
  return { components: rootComponents };
}

/**
 * Convert nested component metadata JSON to an XML string.
 * The XML uses <workflow> as root element and <component> for each component.
 * Components are nested inside <children> elements to reflect the workflow hierarchy.
 * @param {object} metadata - nested component metadata from gatherComponentMetadata
 * @returns {string} - XML string with XML declaration
 */
export async function componentMetadataToXml(metadata) {
  let xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<workflow>\n";
  for (const component of metadata.components) {
    xml += componentToXml(component);
  }
  xml += "</workflow>\n";
  if (debugMetadataXml) {
    await writeFile(debugMetadataXml, xml);
  }
  return xml;
}

export { _internal };
