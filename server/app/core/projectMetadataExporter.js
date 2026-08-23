/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { writeFile } from "node:fs/promises";
import path from "path";
import fs from "fs-extra";
import { XMLBuilder } from "fast-xml-parser";
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

//sentinel key fast-xml-parser's XMLBuilder recognizes as "wrap this value's text
//content in a CDATA section" - see reshapeForXmlBuilder()
const cdataPropName = "__cdata";
const xmlBuilder = new XMLBuilder({ ignoreAttributes: false, format: true, cdataPropName });

//XML element names must start with a letter or underscore and contain only
//letters, digits, hyphens, underscores, and periods. every currently-known
//component property is a plain camelCase identifier, so this only exists as a
//defensive fallback - if it ever triggers, sanitize rather than silently drop
//the property, since "never silently drop data" is the entire point of this module.
const validXmlNamePattern = /^[A-Za-z_][A-Za-z0-9_.-]*$/;

/**
 * Sanitize a property name into a valid XML element name, logging a warning if
 * sanitization was actually needed (not expected in practice - see above).
 * @param {string} key - property name
 * @param {string} projectRootDir - only used to route the warning to the right log
 * @returns {string} - a valid XML element name
 */
function sanitizeXmlName(key, projectRootDir) {
  if (validXmlNamePattern.test(key)) {
    return key;
  }
  const sanitized = key.replace(/[^A-Za-z0-9_.-]/g, "_").replace(/^[^A-Za-z_]/, "_$&");
  _internal.getLogger(projectRootDir).warn(`sanitized invalid XML element name "${key}" to "${sanitized}"`);
  return sanitized;
}

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
 * Recursively reshape a plain JS value into the shape fast-xml-parser's
 * XMLBuilder expects: null/undefined are dropped entirely (so they are simply
 * absent from the output, rather than rendered as empty tags), multiline
 * strings are wrapped for CDATA (generalizes the old scriptContent-only
 * special case to any free-text property), and object keys are sanitized into
 * valid XML element names. No property is excluded - this replaces the old
 * per-field allowlist.
 * @param {string|number|boolean|object|Array|null|undefined} value - value to reshape
 * @param {string} projectRootDir - only used to route a sanitization warning, if any
 * @returns {string|number|boolean|object|Array|undefined} - reshaped value, or undefined if it should be omitted entirely
 */
function reshapeForXmlBuilder(value, projectRootDir) {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value
      .map((item)=>{ return reshapeForXmlBuilder(item, projectRootDir); })
      .filter((item)=>{ return item !== undefined; });
  }
  if (typeof value === "object") {
    const out = {};
    for (const [key, v] of Object.entries(value)) {
      const reshaped = reshapeForXmlBuilder(v, projectRootDir);
      if (reshaped !== undefined) {
        out[sanitizeXmlName(key, projectRootDir)] = reshaped;
      }
    }
    return out;
  }
  if (typeof value === "string" && value.includes("\n")) {
    return { [cdataPropName]: value };
  }
  return value;
}

/**
 * Convert a single component (with optional nested children, as built by
 * gatherComponentMetadata) into an XMLBuilder-ready object. type/name/ID
 * become attributes on <component> (for cheap identification without walking
 * children); every other property - including ones that used to be silently
 * dropped, like previous/next/else/pos/parent and every dispatcher/executer
 * runtime field - becomes a generic child element/array/nested-object.
 * @param {object} component - component object
 * @param {string} projectRootDir - only used to route a sanitization warning, if any
 * @returns {object} - XMLBuilder-shaped object for this <component>
 */
function componentToXmlObject(component, projectRootDir) {
  const { type, name, ID, children, ...rest } = component;
  const node = {
    "@_type": type === null || type === undefined ? "" : String(type),
    "@_name": name === null || name === undefined ? "" : String(name),
    "@_id": ID === null || ID === undefined ? "" : String(ID)
  };
  Object.assign(node, reshapeForXmlBuilder(rest, projectRootDir));

  if (Array.isArray(children) && children.length > 0) {
    node.children = {
      component: children.map((child)=>{
        return componentToXmlObject(child, projectRootDir);
      })
    };
  }
  return node;
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
 * Components are nested inside <children> elements to reflect the workflow
 * hierarchy. Every property present on a component is included - there is no
 * allowlist.
 * @param {object} metadata - nested component metadata from gatherComponentMetadata
 * @returns {Promise<string>} - XML string with XML declaration
 */
export async function componentMetadataToXml(metadata) {
  const doc = {
    workflow: {
      component: metadata.components.map((component)=>{ return componentToXmlObject(component); })
    }
  };
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBuilder.build(doc)}`;
  if (debugMetadataXml) {
    await writeFile(debugMetadataXml, xml);
  }
  return xml;
}

export { _internal };
