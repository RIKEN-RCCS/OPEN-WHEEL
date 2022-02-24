/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */

import * as svgNode from "./svgNodeUI"
import SIO from "@/lib/socketIOWrapper.js"

let nodes = []
let parentnode = []
let svg = null
let presentState = null
let projectRootDir = null
let commit = null
let dispatch = null

/**
   * draw components
   */
function drawComponents (currentWf, argSvg, argPresentState, argProjectRootDir, argCommit, argDispatch) {
  if (!currentWf) return
  svg = argSvg
  presentState = argPresentState
  projectRootDir = argProjectRootDir
  commit = argCommit
  dispatch = argDispatch

  // remove all node from workflow editor
  nodes.forEach(function (v) {
    if (v !== null) v.remove()
  })
  nodes = []

  // remove parent node
  parentnode.forEach(function (vv) {
    if (vv !== null) vv.remove()
  })
  parentnode = []

  drawNodes(currentWf.descendants)
  drawParentFileRelation(currentWf)
  drawLinks(nodes)
  drawParentLinks(parentnode, nodes)
}

/**
  * draw parent children file relation
  * @param  files list in workflow Json
  */
function drawParentFileRelation (parentwf) {
  const node = new svgNode.SvgParentNodeUI(svg, parentwf)
  parentnode.push(node)
}

/**
  * draw cables between Lower and Upper plug Connector and Receptor plug respectively
  */
function drawParentLinks (parentnode, nodes) {
  parentnode.forEach(function (node) {
    if (node != null) {
      node.drawParentLinks()
    }
  })
  parentnode.forEach(function (node) {
    node.inputFileLinks.forEach(function (cable) {
      const dst = cable.cable.data("dst")
      const target = nodes.find((e)=>{
        return e.ID === dst
      })
      target.inputFileLinks.push(cable)
    })
  })
}

/**
   * draw nodes
   * @param nodeInWF node list in workflow Json
   */
function drawNodes (nodesInWF) {
  nodesInWF.forEach(function (v) {
    const node = new svgNode.SvgNodeUI(svg, v)
    node.ID = v.ID
    node
      .onClick(function (e) {
        dispatch("selectedComponent", v)
        e.stopPropagation()
      })
      .onDblclick(function (e) {
        const nodeType = e.target.instance.parent(".node").data("type")
        if (nodeType === "workflow" || nodeType === "parameterStudy" || nodeType === "for" || nodeType === "while" || nodeType === "foreach" || nodeType === "stepjob") {
          const currentWorkFlowID = e.target.instance.parent(".node").data("ID")
          SIO.emitGlobal("getWorkflow", projectRootDir, currentWorkFlowID)
        }
      })
    nodes.push(node)
    node.setEditDisable(isEditDisable())
  })
  svgNode.setEditDisable(svg, nodes, isEditDisable())
}

/**
   * draw cables between Lower and Upper plug Connector and Receptor plug respectively
   * @param nodeInWF node list in workflow Json
   */
function drawLinks (nodes) {
  nodes.forEach(function (node) {
    if (node != null) {
      node.drawLinks()
    }
  })
  nodes.forEach(function (node) {
    node.nextLinks.forEach(function (cable) {
      const dst = cable.cable.data("dst")
      const target = nodes.find((e)=>{
        return e.ID === dst
      })
      target.previousLinks.push(cable)
    })
    node.elseLinks.forEach(function (cable) {
      const dst = cable.cable.data("dst")
      const target = nodes.find((e)=>{
        return e.ID === dst
      })
      target.previousLinks.push(cable)
    })
    node.outputFileLinks.forEach(function (cable) {
      const dst = cable.cable.data("dst")
      const target = nodes.find((e)=>{
        return e.ID === dst
      })
      if (typeof target === "undefined") return
      target.inputFileLinks.push(cable)
    })
  })
}

function isEditDisable () {
  var disableFlag
  if (presentState === "running" || presentState === "prepareing") {
    disableFlag = true
  } else {
    disableFlag = false
  }
  return disableFlag
}

export default drawComponents
