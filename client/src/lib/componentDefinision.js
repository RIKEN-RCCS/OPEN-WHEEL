/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
import imgTask from "@/assets/img_task.png"
import imgJob from "@/assets/img_task_job.png"
import imgRemoteTask from "@/assets/img_remotetask.png"
import imgRemoteJob from "@/assets/img_remotetask_job.png"
import imgIf from "@/assets/img_if.png"
import imgFor from "@/assets/img_for.png"
import imgWhile from "@/assets/img_while.png"
import imgForeach from "@/assets/img_foreach.png"
import imgPS from "@/assets/img_parameterStudy.png"
import imgWorkflow from "@/assets/img_workflow.png"
import imgStorage from "@/assets/img_storage.png"
import imgSource from "@/assets/img_source.png"
import imgViewer from "@/assets/img_viewer.png"
import imgStepJob from "@/assets/img_stepjob.png"
import imgStepJobTask from "@/assets/img_stepjobTask.png"

export default function () {
  return {
    task:                         { color: "#3B55B3", img: imgTask },
    taskAndUsejobscheluler:       { color: "#3B55B3", img: imgJob },
    remotetask:                   { color: "#3B55B3", img: imgRemoteTask },
    remotetaskAndUsejobscheluler: { color: "#3B55B3", img: imgRemoteJob },
    if:                           { color: "#5B5B5F", img: imgIf },
    for:                          { color: "#247780", img: imgFor },
    while:                        { color: "#247780", img: imgWhile },
    foreach:                      { color: "#247780", img: imgForeach },
    parameterStudy:               { color: "#666622", img: imgPS },
    workflow:                     { color: "#803DB3", img: imgWorkflow },
    storage:                      { color: "#00b8a0", img: imgStorage },
    source:                       { color: "#00bff0", img: imgSource  },
    viewer:                       { color: "#00b050", img: imgViewer  },
    stepjob:                      { color: "#803DB3", img: imgStepJob },
    stepjobTask:                  { color: "#3B55B3", img: imgStepJobTask },
    bulkjobTask:                  { color: "#3B55B3", img: imgStepJobTask },
  };
}
