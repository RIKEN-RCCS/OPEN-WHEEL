/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import * as chai from "chai";
const { expect } = chai;
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import sinon from "sinon";

//testee
import {
  isParent,
  _internal
} from "../../../app/core/componentUtility.js";

describe("#isParent", ()=>{
  let readComponentJsonByIDMock;

  beforeEach(()=>{
    readComponentJsonByIDMock = sinon.stub(_internal, "readComponentJsonByID");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return true if parentID is 'parent'", async ()=>{
    const result = await isParent("/mock/project", "parent", "childID");
    expect(result).to.be.true;
  });

  it("should return false if childID is 'parent'", async ()=>{
    const result = await isParent("/mock/project", "parentID", "parent");
    expect(result).to.be.false;
  });

  it("should return false if childJson is null", async ()=>{
    readComponentJsonByIDMock.resolves(null);

    const result = await isParent("/mock/project", "parentID", "childID");
    expect(result).to.be.false;
    expect(readComponentJsonByIDMock.calledOnceWithExactly("/mock/project", "childID")).to.be.true;
  });

  it("should return false if childID is not a string", async ()=>{
    readComponentJsonByIDMock.resolves({ parent: "parentID" });

    const result = await isParent("/mock/project", "parentID", 123);
    expect(result).to.be.false;
  });

  it("should return true if childJson.parent matches parentID", async ()=>{
    readComponentJsonByIDMock.resolves({ parent: "parentID" });

    const result = await isParent("/mock/project", "parentID", "childID");
    expect(result).to.be.true;
    expect(readComponentJsonByIDMock.calledOnceWithExactly("/mock/project", "childID")).to.be.true;
  });

  it("should return false if childJson.parent does not match parentID", async ()=>{
    readComponentJsonByIDMock.resolves({ parent: "otherParentID" });

    const result = await isParent("/mock/project", "parentID", "childID");
    expect(result).to.be.false;
    expect(readComponentJsonByIDMock.calledOnceWithExactly("/mock/project", "childID")).to.be.true;
  });
});
