/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
function createFugaku(v) {
  return `#!/bin/bash
${v.rscgrp ? `#PJM -L "rscgrp=${v.rscgrp}"` : ""}
${v.nodeNum ? `#PJM -L "node=${v.nodeNum}"` : ""}
${v.elapsedTime ? `#PJM -L "elapse=${v.elapsedTime}"` : ""}
${v.stdoutName ? `#PJM -o "${v.stdoutName}"` : ""}
${v.stderrName ? `#PJM -e "${v.stderrName}"` : ""}
${v.jobName ? `#PJM -N "${v.jobName}"` : ""}
${v.other ? `${v.other}` : ""}
#### WHEEL inserted lines ####
`.replaceAll(/^\n/mg, "");
}
function createITOScript(unit, v) {
  return `#!/bin/bash
${unit ? "#PJM -L \"rscunit=ito-a\"" : ""}
${v.rscgrp ? `#PJM -L "rscgrp=${v.rscgrp}"` : ""}
${v.nodeNum ? `#PJM -L "vnode=${v.nodeNum}"` : ""}
${v.coreNum ? `#PJM -L "vnode-core=${v.coreNum}"` : ""}
${v.elapsedTime ? `#PJM -L "elapse=${v.elapsedTime}"` : ""}
${v.stdoutName ? `#PJM -o "${v.stdoutName}"` : ""}
${v.stderrName ? `#PJM -e "${v.stderrName}"` : ""}
${v.jobName ? `#PJM -N "${v.jobName}"` : ""}
${v.other ? `${v.other}` : ""}
#### WHEEL inserted lines ####
`.replaceAll(/^\n/mg, "");
}
function createOtherScript(v) {
  return `"#!/bin/bash";
${v.rsctype && v.rscnum ? `#$ -l ${v.rsctype}=${v.rscnum}\n` : ""}
${v.elapseTime ? `#$ -l h_rt=${v.elapseTime}\n` : ""}
${v.Priority ? `#$ -p ${v.Priority}\n` : ""}
${v.taskId ? `#$ -t ${v.taskId}\n` : ""}//n[-m[:s]]で指定
${v.holdId ? `#$ -hold_jid ${v.holdId}\n` : ""}
${v.arId ? `#$ -ar ${v.arId}\n` : ""}
${v.stdoutName ? `#$ -o ${v.stdoutName}\n` : ""}
${v.stderrName ? `#$ -e ${v.stderrName}\n` : ""}
${v.jobName ? `#$ -N ${v.jobName}\n` : ""}
${v.other ? `${v.other}` : ""}
#### WHEEL inserted lines ####
`.replaceAll(/^\n/mg, "");
}

const funcTable = {
  "Fugaku": createFugaku,
  "KYUSHU UNIVERSITY ITO-A": createITOScript.bind(null, "ito-a"),
  "KYUSHU UNIVERSITY ITO-B": createITOScript.bind(null, "ito-b"),
  "other": createOtherScript
};
function createJobScript(center, v) {
  const func = funcTable[center];
  if (typeof func === "undefined") {
    console.log("unsupported center name", center);
    return "";
  }
  return func(v);
}

export default createJobScript;
