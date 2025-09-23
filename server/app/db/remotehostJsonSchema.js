/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

//user is not required parameter for ssh-client-wrapper
//but its default value is owner of WHEEL process on localhost and it may be root in docker container
//so, it is practically required value

const remotehostJsonSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    host: { type: "string" },
    user: { type: "string" },
    port: {
      type: "number",
      minimum: 0,
      maximum: 65535
    },
    keyFile: { type: "string" },
    path: { type: "string" },
    jobScheduler: { type: "string" },
    numJob: { type: "number", default: 5, minimum: 0 },
    queue: { type: "string" },
    useBulkjob: { type: "boolean", default: false },
    useStepjob: { type: "boolean", default: false },
    sharedHost: { type: "string", default: "" },
    sharedPath: { type: "string", default: "" },
    renewInterval: { type: "number", default: 0, minimum: 0 },
    statusCheckInterval: { type: "number", default: 60, minimum: 0 },
    maxStatusCheckError: { type: "number", default: 10, minimum: 0 },
    execInterval: { type: "number", minimum: 0 },
    readyTimeout: { type: "number", minimum: 0 },
    rcfile: { type: "string", default: "/etc/profile" },
    prependCmd: { type: "string" },
    useGfarm: { type: "boolean", default: false },
    JWTServerUser: { type: "string", format: "uri" },
    JWTServerURL: { type: "string" }
  },
  additionalProperties: false,
  required: ["name", "host", "user"]
};

module.exports = {
  remotehostJsonSchema
};
