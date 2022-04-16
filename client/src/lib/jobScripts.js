function createITOAScript(v) {
  return `#!/bin/bash
#PJM -L "rscunit=ito-a"
${v.rscgrp      ? `#PJM -L "rscgrp=${v.rscgrp}"`:""}
${v.nodeNum     ? `#PJM -L "vnode=${v.nodeNum}"` : ""}
${v.coreNum     ? `#PJM -L "vnode-core=${v.coreNum}"` : ""}
${v.elapsedTime ? `#PJM -L "elapse=${v.elapsedTime}"` : ""}
${v.stdoutName  ? `#PJM -o "${v.stdoutName}"` : ""}
${v.stderrName  ? `#PJM -e "${v.stderrName}"` : ""}
${v.jobName     ? `#PJM -N "${v.jobName}"` : ""}
${v.other ? `${v.other}` : ""}
#### WHEEL inserted lines ####
`.replaceAll(/^\n/mg,"");
}

function createITOBScript(v) {
  return `#!/bin/bash
#PJM -L "rscunit=ito-b"
${v.rscgrp      ? `#PJM -L "rscgrp=${v.rscgrp}"`:""}
${v.nodeNum     ? `#PJM -L "vnode=${v.nodeNum}"` : ""}
${v.coreNum     ? `#PJM -L "vnode-core=${v.coreNum}"` : ""}
${v.elapsedTime ? `#PJM -L "elapse=${v.elapsedTime}"` : ""}
${v.stdoutName  ? `#PJM -o "${v.stdoutName}"` : ""}
${v.stderrName  ? `#PJM -e "${v.stderrName}"` : ""}
${v.jobName     ? `#PJM -N "${v.jobName}"` : ""}
${v.other ? `${v.other}` : ""}
#### WHEEL inserted lines ####
`.replaceAll(/^\n/mg,"");
}

function createOtherScript(v){
  return `"#!/bin/bash";
${v.rsctype && v.rscnum ? `#$ -l ${buffer.rsctype}=${buffer.rscnum}\n` : ""}
${v.elapseTime          ? `#$ -l h_rt=${buffer.elapseTime}\n` : ""}
${v.Priority            ? `#$ -p ${buffer.Priority}\n` : ""}
${v.taskId              ? `#$ -t ${buffer.taskId}\n` : ""}//n[-m[:s]]で指定
${v.holdId              ? `#$ -hold_jid ${buffer.holdId}\n` : ""}
${v.arId                ? `#$ -ar ${buffer.arId}\n` : ""}
${v.stdoutName          ? `#$ -o ${buffer.stdoutName}\n` : ""}
${v.stderrName          ? `#$ -e ${buffer.stderrName}\n` : ""}
${v.jobName             ? `#$ -N ${buffer.jobName}\n` : ""}
${v.other ? `${buffer.other}` : ""}
#### WHEEL inserted lines ####
`.replaceAll(/^\n/mg,"");
}

function createJobScript(center, v){
  if(center === "KYUSHU UNIVERSITY ITO-A"){
    return createITOAScript(v);
  }else if(center === "KYUSHU UNIVERSITY ITO-B"){
    return createITOBScript(v);
  }else if(center === "other"){
    createOtherScript;
  }else{
    console.log("unsupported center name", center);
  }
}

export default createJobScript;

