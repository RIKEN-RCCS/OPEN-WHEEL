/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const { defaultPSconfigFilename } = require("../db/db.js");

const emptyArraySchema = {
  type: "array",
  maxItems: 0,
  uniqueItems: true
};

const stringArraySchema = {
  type: "array",
  items: {
    type: "string"
  }
};

const srcSchema = {
  type: "object",
  required: ["srcNode", "srcName"],
  properties: {
    srcNode: { type: "string" },
    srcName: { type: "string" }
  }
};
const dstSchema = {
  type: "object",
  required: ["dstNode", "dstName"],
  properties: {
    dstNode: { type: "string" },
    dstName: { type: "string" }
  }
};

const inputFileSchema = {
  type: "object",
  required: ["name", "src"],
  properties: {
    name: { type: "string" },
    src: { type: "array", items: srcSchema },
    forwardTo: { type: "array", items: dstSchema }
  }
};
const outputFileSchema = {
  type: "object",
  required: ["name", "dst"],
  properties: {
    name: { type: "string" },
    dst: { type: "array", items: dstSchema },
    origin: { type: "array", items: srcSchema }
  }
};

const posSchema = {
  type: "object",
  required: ["x", "y"],
  properties: {
    x: { type: "number" },
    y: { type: "number" }
  },
  maxProperties: 2
};

class BaseWorkflowComponentSchema {
  constructor() {
    this.type = "object";
    this.required = ["parent", "pos", "ID", "type", "name"];
    this.properties = {
      parent: { type: "string" },
      pos: posSchema,
      ID: { type: "string" },
      disable: { type: "boolean", default: null },
      type: { enum: ["task", "workflow", "parameterStudy", "if",
        "for", "while", "foreach", "storage", "source", "viewer",
        "stepjob", "stepjobTask", "bulkjobTask"] },
      name: { type: "string" },
      description: { type: ["string", "null"], default: null },
      env: { type: "object", default: {} },
      state: { enum: ["not-started", "running", "finished", "failed", "unknown"], default: "not-started" }
    };
  }
}

class GeneralWorkflowComponentSchema extends BaseWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.required.push("previous", "next", "inputFiles", "outputFiles", "cleanupFlag");
    this.properties = Object.assign(this.properties, {
      previous: stringArraySchema,
      next: stringArraySchema,
      inputFiles: { type: "array", items: inputFileSchema },
      outputFiles: { type: "array", items: outputFileSchema },
      cleanupFlag: { enum: [0, 1, 2] }
    });
  }
}

class TaskSchema extends GeneralWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.properties.type = { enum: ["task"] };
    this.properties.script = { type: ["string", "null"], default: null };
    this.properties.host = { type: "string", default: "localhost" };
    this.properties.useJobScheduler = { type: "boolean", default: false };
    this.properties.queue = { type: ["string", "null"], default: null };
    this.properties.submitOption = { type: ["string", "null"], default: null };
    this.properties.include = stringArraySchema;
    this.properties.exclude = stringArraySchema;
    this.properties.state.enum.push(...["stage-in", "waiting", "queued", "stage-out"]);
  }
}

class WorkflowSchema extends GeneralWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.properties.type = { enum: ["workflow"] };
  }
}

class ParameterStudySchema extends GeneralWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.properties.type = { enum: ["parameterStudy"] };
    this.required.push("parameterFile", "numTotal", "numFinished", "numFailed", "forceOverwrite", "deleteLoopInstance");
    this.properties.parameterFile = { type: "string", default: defaultPSconfigFilename };
    this.properties.numTotal = { type: ["number", "null"], default: null };
    this.properties.numFinished = { type: ["number", "null"], default: null };
    this.properties.numFailed = { type: ["number", "null"], default: null };
    this.properties.forceOverwrite = { type: "boolean", default: false };
    this.properties.deleteLoopInstance = { type: "boolean", default: false };
  }
}

class IfSchema extends GeneralWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.properties.type = { enum: ["if"] };
    this.required.push("condition", "else");
    this.properties.condition = { type: ["string", "null"], default: null };
    this.properties.else = { type: "array", items: { type: "string" } };
  }
}

class ForSchema extends GeneralWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.properties.type = { enum: ["for"] };
    this.required.push("start", "end", "step", "keep");
    this.properties.start = { type: ["number", "null"] };
    this.properties.end = { type: ["number", "null"] };
    this.properties.step = { type: ["number", "null"] };
    this.properties.keep = { type: ["number", "null"] };
  }
}

class WhileSchema extends GeneralWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.properties.type = { enum: ["while"] };
    this.required.push("condition", "keep");
    this.properties.condition = { type: ["string", "null"], default: null };
    this.properties.keep = { type: ["number", "null"] };
  }
}

class ForeachSchema extends GeneralWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.properties.type = { enum: ["foreach"] };
    this.required.push("indexList");
    this.properties.indexList = { type: "array", items: { type: "string" } };
    this.properties.keep = { type: ["number", "null"] };
  }
}

class StorageSchema extends BaseWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.properties.type = { enum: ["storage"] };
    this.required.push("inputFiles", "outputFiles", "host", "storagePath");
    this.properties.inputFiles = { type: "array", items: inputFileSchema, default: [] };
    this.properties.outputFiles = { type: "array", items: outputFileSchema, default: [] };
    this.properties.host = { type: "string", default: "localhost" };
    this.properties.storagePath = { type: ["string", "null"], default: null };
  }
}

class SourceSchema extends BaseWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.properties.type = { enum: ["source"] };
    this.required.push("uploadOnDemand", "outputFiles");
    this.properties.uploadOnDemand = { type: "boolean" };
    this.properties.outputFiles = { type: "array", minItems: 1, maxItems: 1, items: outputFileSchema };
  }
}

class ViewerSchema extends BaseWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.properties.type = { enum: ["viewer"] };
    this.required.push("inputFiles");
    this.properties.inputFiles = { type: "array", items: inputFileSchema, default: [] };
  }
}

class StepjobSchema extends GeneralWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.properties.type = { enum: ["stepjob"] };
    this.required.push("host", "useJobScheduler", "queue");
    this.properties.host = { type: "string", default: "localhost" };
    this.properties.useJobScheduler = { type: "boolean", default: false };
    this.properties.queue = { type: ["string", "null"], default: null };
  }
}

class StepjobTaskSchema extends TaskSchema {
  constructor(...args) {
    super(...args);
    this.properties.type = { enum: ["stepjobTask"] };
    this.required.push("stepnum", "useJobScheduler", "useDependency", "dependencyForm");
    //at this time we set this value is default true but in fact it must be true
    //so, this prop should be removed and treat as true always
    this.properties.useJobScheduler = { type: "boolean", default: true };
    this.properties.stepnum = { type: "number", default: 0 };
    this.properties.useDependency = { type: "boolean", default: false };
    this.properties.dependencyForm = { type: ["string", "null"], default: null };
  }
}

class BulkjobTaskSchema extends TaskSchema {
  constructor(...args) {
    super(...args);
    this.properties.type = { enum: ["bulkjobTask"] };
    this.required.push("useJobScheduler", "usePSSettingFile",
      "parameterFile", "startBulkNumber", "endBulkNumber",
      "manualFinishCondition", "condition");
    //see comment in StepjobTaskSchema
    this.properties.useJobScheduler = { type: "boolean", default: true };

    this.properties.usePSSettingFile = { type: "boolean", default: true };
    this.properties.parameterFile = { type: ["string", "null"], default: null };
    this.properties.startBulkNumber = { type: ["number", "null"], default: null };
    this.properties.endBulkNumber = { type: ["number", "null"], default: null };
    this.properties.manualFinishCondition = { type: "boolean", default: false };
    this.properties.condition = { type: ["string", "null"], default: null };
  }
}

class BreakSchema extends GeneralWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.properties.type = { enum: ["break"] };
    this.required.push("condition");
    this.properties.condition = { type: ["string", "null"], default: null };
  }
}

class ContinueSchema extends GeneralWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.properties.type = { enum: ["continue"] };
    this.required.push("condition");
    this.properties.condition = { type: ["string", "null"], default: null };
  }
}

const psSettingFileSchema = {
  type: "object",
  required: [
    "version", "targetFiles", "params"
  ],
  properties: {
    version: { type: "number", enum: [2] },
    targetFiles: {
      type: "array",
      items: {
        type: "object",
        required: ["targetName"],
        properties: {
          targetName: { type: "string" },
          targetNode: { type: "string" }
        }
      }
    },
    params: {
      type: "array",
      items: {
        oneOf: [
          {
            type: "object",
            required: ["keyword", "type", "min", "max", "step"],
            properties: {
              type: { enum: ["min-max-step"] },
              min: { type: "number" },
              max: { type: "number" },
              step: { type: "number" }
            }
          },
          {
            type: "object",
            required: ["keyword", "type", "list"],
            properties: {
              type: { enum: ["list"] },
              list: { type: "array", items: { type: "string" } }
            }
          },
          {
            type: "object",
            required: ["keyword", "type", "files"],
            properties: {
              type: { enum: ["files"] },
              files: { type: "array", items: { type: "string" } }
            }
          }
        ]
      }
    },
    scatter: {
      type: "array",
      items: {
        type: "object",
        required: ["srcName", "dstNode", "dstName"],
        properties: {
          srcName: { type: "string" },
          dstNode: { type: "string" },
          dstName: { type: "string" }
        }
      }
    },
    gather: {
      type: "array",
      items: {
        type: "object",
        required: ["srcName", "srcNode", "dstName"],
        properties: {
          srcName: { type: "string" },
          srcNode: { type: "string" },
          dstName: { type: "string" }
        }
      }
    }
  }
};

/**
 * return JSON schema
 * @param {string} type - keyword for schema
 * @returns {object} - JSON schema
 */
function getSchema(type) {
  switch (type) {
    case "pos":
      return JSON.parse(JSON.stringify(posSchema));
    case "task":
      return new TaskSchema();
    case "workflow":
      return new WorkflowSchema();
    case "parameterStudy":
      return new ParameterStudySchema();
    case "if":
      return new IfSchema();
    case "for":
      return new ForSchema();
    case "while":
      return new WhileSchema();
    case "foreach":
      return new ForeachSchema();
    case "storage":
      return new StorageSchema();
    case "source":
      return new SourceSchema();
    case "viewer":
      return new ViewerSchema();
    case "stepjob":
      return new StepjobSchema();
    case "stepjobTask":
      return new StepjobTaskSchema();
    case "bulkjobTask":
      return new BulkjobTaskSchema();
    case "break":
      return new BreakSchema();
    case "continue":
      return new ContinueSchema();
    case "emptyArray":
      return JSON.parse(JSON.stringify(emptyArraySchema));
    case "psSettingFile":
      return psSettingFileSchema;
    default:
      return null;
  }
}

module.exports = getSchema;
