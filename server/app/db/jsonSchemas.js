/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

class SrcSchema {
  constructor(srcNode, srcName) {
    this.required = ["srcNode", "srcName"];
    this.properties = {
      srcNode: { type: "string" },
      srcName: { type: "string" }
    };

    if (typeof srcNode !== "undefined" && typeof srcName !== "undefined") {
      this.properties.srcNode = { enum: [srcNode] };
      this.properties.srcName = { enum: [srcName] };
    }
  }
}

class DstSchema {
  constructor(dstNode, dstName) {
    this.required = ["dstNode", "dstName"];
    this.properties = {
      dstNode: { enum: [dstNode] },
      dstName: { enum: [dstName] }
    };
  }
}

class InputFileSchema {
  constructor(name, srcNode, srcName) {
    this.required = ["name", "src"];
    this.properties = {
      name: { type: "string" },
      src: { type: "array", minItems: 0, maxItems: 0, items: [] },
      forwardTo: { type: "array", minItems: 0, maxItems: 0, items: [] }
    };

    if (typeof name !== "undefined") {
      this.properties.name = { enum: [name] };
    }

    if (typeof srcNode !== "undefined" && typeof srcName !== "undefined") {
      this.properties.src.items.push(new SrcSchema(srcNode, srcName));
      const size = this.properties.src.items.length;
      this.properties.src.minItems = size;
      this.properties.src.maxItems = size;
    }
  }
}

class OutputFileSchema {
  constructor(name, dstNode, dstName) {
    this.required = ["name", "dst"];
    this.properties = {
      name: { type: "string" },
      dst: { type: "array", minItems: 0, maxItems: 0, items: [] },
      origin: { type: "array", minItems: 0, maxItems: 0, items: [] }
    };

    if (typeof name !== "undefined") {
      this.properties.name = { enum: [name] };
    }

    if (typeof dstNode !== "undefined" && typeof dstName !== "undefined") {
      this.properties.dst.items.push(new DstSchema(dstNode, dstName));
      const size = this.properties.dst.items.length;
      this.properties.dst.minItems = size;
      this.properties.dst.maxItems = size;
    }
  }
}

const emptyArraySchema = {
  type: "array",
  minItems: 0,
  maxItems: 0,
  items: { type: "string", enum: [] },
  uniqueItems: true
};

class PosSchema {
  constructor() {
    this.required = ["x", "y"];
    this.properties = {
      x: { type: "number" },
      y: { type: "number" }
    };
    this.maxProperties = 2;
  }
}

class BaseWorkflowComponentSchema {
  constructor(name, ID, parent) {
    this.required = ["parent", "pos", "ID", "type", "name", "description", "state"];
    this.properties = {
      parent: { type: "string" },
      pos: getSchema("pos"),
      ID: { type: "string" },
      type: { enum: ["task", "if", "workflow", "parameterStudy", "for", "while", "foreach", "source", "viewer"] },
      name: { type: "string" },
      description: { oneOf: [{ type: "null" }, { type: "string" }] },
      state: { enum: ["not-started", "running", "finished", "failed", "unknown"] }
    };

    if (typeof name === "string") {
      this.properties.name = { enum: [name] };
    }
    if (typeof ID === "string") {
      this.properties.ID = { enum: [ID] };
    }
    if (typeof parent === "string") {
      this.properties.parent = { enum: [parent] };
    }
  }

  addValue(prop, value) {
    this.properties[prop].items.enum.push(value);
    const size = this.properties[prop].items.enum.length;
    this.properties[prop].minItems = size;
    this.properties[prop].maxItems = size;
  }
}

class GeneralWorkflowComponentSchema extends BaseWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.required.push("previous", "next", "inputFiles", "outputFiles", "cleanupFlag");
    this.properties = Object.assign(this.properties, {
      previous: getSchema("emptyArray"),
      next: getSchema("emptyArray"),
      inputFiles: { type: "array", minItems: 0, maxItems: 0, items: [] },
      outputFiles: { type: "array", minItems: 0, maxItems: 0, items: [] },
      cleanupFlag: { enum: [0, 1, 2] }
    });
  }

  addInputFile(name, srcNode, srcName) {
    const tmp = new InputFileSchema(name, srcNode, srcName);
    this.properties.inputFiles.items.push(tmp);
    const size = this.properties.inputFiles.items.length;
    this.properties.inputFiles.minItems = size;
    this.properties.inputFiles.maxItems = size;
  }

  addInputFileLink(index, srcNode, srcName, isForward) {
    if (index > this.properties.inputFiles.items.length - 1) {
      return;
    }
    if (isForward) {
      const tmp = new DstSchema(srcNode, srcName);
      this.properties.inputFiles.items[index].properties.forwardTo.items.push(tmp);
      const size = this.properties.inputFiles.items[index].properties.forwardTo.items.length;
      this.properties.inputFiles.items[index].properties.forwardTo.minItems = size;
      this.properties.inputFiles.items[index].properties.forwardTo.maxItems = size;
    } else {
      const tmp = new SrcSchema(srcNode, srcName);
      this.properties.inputFiles.items[index].properties.src.items.push(tmp);
      const size = this.properties.inputFiles.items[index].properties.src.items.length;
      this.properties.inputFiles.items[index].properties.src.minItems = size;
      this.properties.inputFiles.items[index].properties.src.maxItems = size;
    }
  }

  addOutputFile(name, dstNode, dstName) {
    const tmp = new OutputFileSchema(name, dstNode, dstName);
    this.properties.outputFiles.items.push(tmp);
    const size = this.properties.outputFiles.items.length;
    this.properties.outputFiles.minItems = size;
    this.properties.outputFiles.maxItems = size;
  }

  addOutputFileLink(index, dstNode, dstName, isOrigin) {
    if (index > this.properties.outputFiles.items.length - 1) {
      return;
    }
    if (isOrigin) {
      const tmp = new SrcSchema(dstNode, dstName);
      this.properties.outputFiles.items[index].properties.origin.items.push(tmp);
      const size = this.properties.outputFiles.items[index].properties.origin.items.length;
      this.properties.outputFiles.items[index].properties.origin.minItems = size;
      this.properties.outputFiles.items[index].properties.origin.maxItems = size;
    } else {
      const tmp = new DstSchema(dstNode, dstName);
      this.properties.outputFiles.items[index].properties.dst.items.push(tmp);
      const size = this.properties.outputFiles.items[index].properties.dst.items.length;
      this.properties.outputFiles.items[index].properties.dst.minItems = size;
      this.properties.outputFiles.items[index].properties.dst.maxItems = size;
    }
  }
}

class TaskSchema extends GeneralWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.required.push("script", "host", "useJobScheduler", "queue", "include", "exclude");
    this.properties.type = { enum: ["task"] };
    this.properties.script = { type: "null" };
    this.properties.host = { type: "string" };
    this.properties.useJobScheduler = { type: "boolean" };
    this.properties.queue = { type: "null" };
    this.properties.include = { type: "array", minItems: 0, maxItems: 0, items: [] };
    this.properties.exclude = { type: "array", minItems: 0, maxItems: 0, items: [] };
    this.properties.state = this.properties.state.enum.concat(["stage-in", "waiting", "queued", "stage-out"]);
  }
}

class WorkflowSchema extends GeneralWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.properties.type = { enum: ["workflow"] };
  }
}

class ForeachSchema extends GeneralWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.required.push("indexList");
    this.properties.type = { enum: ["foreach"] };
    this.properties.indexList = { type: "array", minItems: 0, maxItems: 0 };
  }
}

class SourceSchema extends BaseWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.required.push("outputFiles");
    this.required.push("uploadOnDemand");
    this.properties.uploadOnDemand = { type: "boolean" };
    this.properties.outputFiles = { type: "array", minItems: 1, maxItems: 1, items: [new OutputFileSchema()] };
  }

  renameOutputFile(newName) {
    this.properties.outputFiles.items[0].properties.name = { enum: [newName] };
  }

  addOutputFile(name, dstNode, dstName) {
    const tmp = new OutputFileSchema(name, dstNode, dstName);
    this.properties.outputFiles.items.push(tmp);
    const size = this.properties.outputFiles.items.length;
    this.properties.outputFiles.minItems = size;
    this.properties.outputFiles.maxItems = size;
  }

  addOutputFileLink(dstNode, dstName) {
    const tmp = new DstSchema(dstNode, dstName);
    this.properties.outputFiles.items[0].properties.dst.items.push(tmp);
    const size = this.properties.outputFiles.items[0].properties.dst.items.length;
    this.properties.outputFiles.items[0].properties.dst.minItems = size;
    this.properties.outputFiles.items[0].properties.dst.maxItems = size;
  }
}

class ViewerSchema extends BaseWorkflowComponentSchema {
  constructor(...args) {
    super(...args);
    this.required.push("inputFiles");
    this.properties.inputFiles = { type: "array", minItems: 0, maxItems: 0, items: [] };
  }

  addInputFile(name, srcNode, srcName) {
    const tmp = new InputFileSchema(name, srcNode, srcName);
    this.properties.inputFiles.items.push(tmp);
    const size = this.properties.inputFiles.items.length;
    this.properties.inputFiles.minItems = size;
    this.properties.inputFiles.maxItems = size;
  }

  addInputFileLink(index, srcNode, srcName) {
    if (index > this.properties.inputFiles.items.length - 1) {
      return;
    }
    const tmp = new SrcSchema(srcNode, srcName);
    this.properties.inputFiles.items[index].properties.src.items.push(tmp);
    const size = this.properties.inputFiles.items[index].properties.src.items.length;
    this.properties.inputFiles.items[index].properties.src.minItems = size;
    this.properties.inputFiles.items[index].properties.src.maxItems = size;
  }
}

function getSchema(type, name, ID) {
  let rt;

  switch (type) {
    case "pos":
      rt = new PosSchema();
      break;
    case "task":
      rt = new TaskSchema(name, ID);
      break;
    case "workflow":
      rt = new WorkflowSchema(name, ID);
      break;
    case "foreach":
      rt = new ForeachSchema(name, ID);
      break;
    case "source":
      rt = new SourceSchema(name, ID);
      break;
    case "viewer":
      rt = new ViewerSchema(name, ID);
      break;
    case "emptyArray":
      rt = JSON.parse(JSON.stringify(emptyArraySchema));
      break;
    default:
      rt = null;
  }
  return rt;
}

module.exports = getSchema;
