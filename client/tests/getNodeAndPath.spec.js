/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
import { expect } from "chai";
import getNodeAndPath from "@/lib/getNodeAndPath.js";
import { componentTree } from "@/lib/dummyData.json";

describe("#getNodeAndPath", ()=>{
  it("should return null if root is undefined", ()=>{
    expect(getNodeAndPath()).to.be.null;
  });
  it("should return target node if path array is not passed", ()=>{
    const targetID = "362e7590-628c-11eb-b193-23d0d6b19239";
    const targetNode = getNodeAndPath(targetID, componentTree);
    expect(targetNode).to.be.a("object");
    expect(targetNode.ID).to.be.equal(targetID);
  });
  it("should return null target node not found", ()=>{
    expect(getNodeAndPath("hoge", componentTree, [])).to.be.undefined;
  });
  it("should return root node if targetID is null", ()=>{
    const path = [];
    expect(getNodeAndPath(null, componentTree, path)).to.be.equal(componentTree);
    expect(path).to.have.lengthOf(1);
    expect(path[0]).to.be.deep.equal({ name: componentTree.name, ID: componentTree.ID, type: componentTree.type });
  });
  it("should return root node if targetID is undefined", ()=>{
    const path = [];
    expect(getNodeAndPath(undefined, componentTree, path)).to.be.equal(componentTree);
    expect(path).to.have.lengthOf(1);
    expect(path[0]).to.be.deep.equal({ name: componentTree.name, ID: componentTree.ID, type: componentTree.type });
  });
  it("should find root node", ()=>{
    const path = [];
    expect(getNodeAndPath(componentTree.ID, componentTree, path)).to.be.equal(componentTree);
    expect(path).to.have.lengthOf(1);
    expect(path[0]).to.be.deep.equal({ name: componentTree.name, ID: componentTree.ID, type: componentTree.type });
  });
  it("should find specified node", ()=>{
    const targetID = "362e7590-628c-11eb-b193-23d0d6b19239";
    const path = [];
    const targetNode = getNodeAndPath(targetID, componentTree, path);
    expect(targetNode).to.be.a("object");
    expect(targetNode.ID).to.be.equal(targetID);
    expect(path).to.have.lengthOf(3);
    expect(path[0]).to.be.deep.equal({ name: componentTree.name, ID: componentTree.ID, type: componentTree.type });
    path.forEach((e)=>{
      expect(e).to.have.property("name");
      expect(e).to.have.property("ID");
      expect(e).to.have.property("type");
    });
  });
});
