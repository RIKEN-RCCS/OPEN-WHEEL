winHelper = {
  scriptName: "run.bat",
  scriptHeader: "@echo off",
  pwdCmd: "cd",
  exit: (rt)=>{
    return `exit /b ${rt}`
  },
  referenceEnv: (env)=>{
    return `%${env}%`;
  }
};
posixHelper = {
  scriptName: "run.sh",
  scriptHeader: "#!/bin/bash",
  pwdCmd: "pwd",
  exit: (rt)=>{
    return `exit ${rt}`
  },
  referenceEnv: (env)=>{
    return `\${${env}}`;
  }
};

module.exports = process.platform === "win32" ? winHelper : posixHelper;
