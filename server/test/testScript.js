/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
const winHelper = {
  scriptName: "run.bat",
  scriptHeader: "@echo off",
  pwdCmd: "cd",
  exit: (rt)=>{
    return `exit /b ${rt}`;
  },
  referenceEnv: (env)=>{
    return `%${env}%`;
  }
};
const posixHelper = {
  scriptName: "run.sh",
  scriptHeader: "#!/bin/bash",
  pwdCmd: "pwd",
  exit: (rt)=>{
    return `exit ${rt}`;
  },
  referenceEnv: (env)=>{
    return `\${${env}}`;
  }
};

const helper = process.platform === "win32" ? winHelper : posixHelper;

export const { scriptName, scriptHeader, pwdCmd, exit, referenceEnv } = helper;
export default helper;
