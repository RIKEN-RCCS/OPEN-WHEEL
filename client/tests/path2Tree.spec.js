/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
import { expect } from "chai";
import { path2Array, taskStateList2Tree } from "@/lib/taskStateList2Tree.js";
import { taskStatelist } from "@/lib/dummyData.json";

describe("#path2Array", ()=>{
  const pathString = "/foo/bar/baz";
  it("should return null if given string is empty", async ()=>{
    expect(await path2Array("")).to.be.null;
  });
  it("should return array of each node name", async ()=>{
    expect(await path2Array(pathString)).to.have.ordered.members(["foo", "bar", "baz"]);
  });
});
describe("#taskStateList2Tree", ()=>{
  it("should return true and tree has all taskStatelist entry", async ()=>{
    const rt = { children: [] };
    expect(await taskStateList2Tree(taskStatelist, rt)).to.be.true;
    // tree should be checked!
  });
  it("should return false if taskStatelist is not changed", async ()=>{
    const rt = { children: [] };

    await taskStateList2Tree(taskStatelist, rt);
    expect(await taskStateList2Tree(taskStatelist, rt)).to.be.false;
  });
  it("should return null if tree does not have children prop", async ()=>{
    expect(await taskStateList2Tree(taskStatelist, {})).to.be.null;
  });
});
