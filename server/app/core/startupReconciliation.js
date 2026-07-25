/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import { checkRunningJobs } from "./checkRunningJobs.js";
import { getProjectState, setProjectState } from "./projectJsonFileOperator.js";
import { getLogger } from "../logSettings.js";

export const _internal = {
  checkRunningJobs,
  getProjectState,
  setProjectState,
  getLogger
};

/**
 * reconcile persisted project states left over from a previous server process.
 * a `Dispatcher` only ever exists inside `runProject()` while an explicit run/continue
 * operation is in flight, so at server startup no project can genuinely still be
 * "running" - any project found in that state is stale (the server crashed or was
 * restarted mid-run) and is flipped to "stopped" so the user can continue it
 * a single unreadable/stale project entry (e.g. removed from disk but still
 * listed) must not prevent every other project from being reconciled
 * @param {object} projectList - project list DB object (has getAll())
 * @returns {Promise<void>}
 */
export async function reconcileProjectStates(projectList) {
  await Promise.all(projectList.getAll()
    .map(async (pj)=>{
      try {
        const { jmFiles } = await _internal.checkRunningJobs(pj.path);
        if (jmFiles.length > 0) {
          _internal.setProjectState(pj.path, "holding");
          return;
        }
        const state = await _internal.getProjectState(pj.path);
        if (state === "running") {
          await _internal.setProjectState(pj.path, "stopped");
        }
      } catch (e) {
        _internal.getLogger(pj.path).warn("failed to reconcile project state at startup, skipping", e);
      }
    }));
}
