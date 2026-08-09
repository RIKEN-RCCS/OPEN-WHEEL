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
  replaceWebhook,
  _internal
} from "../../../app/core/webhook.js";

describe("#replaceWebhook", ()=>{
  //eslint-disable-next-line @stylistic/max-statements-per-line
  let getProjectJsonMock; let writeProjectJsonMock; let diffMock; let diffApplyMock;

  beforeEach(()=>{
    getProjectJsonMock = sinon.stub(_internal, "getProjectJson");
    writeProjectJsonMock = sinon.stub(_internal, "writeProjectJson");
    diffMock = sinon.stub(_internal, "diff");
    diffApplyMock = sinon.stub(_internal, "diffApply");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should set the new webhook if the existing one is undefined", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const newWebhook = {
      URL: "https://example.com/webhook",
      project: true,
      component: true
    };

    const mockProjectJson = {
      name: "testProject",
      webhook: undefined
    };

    getProjectJsonMock.resolves(mockProjectJson);
    writeProjectJsonMock.resolves();

    const result = await replaceWebhook(mockProjectRootDir, newWebhook);

    expect(result).to.deep.equal(undefined);

    expect(writeProjectJsonMock.calledOnceWithExactly(
      mockProjectRootDir,
      {
        name: "testProject",
        webhook: newWebhook
      }
    )).to.be.true;
  });

  it("should diff and apply patch if the existing webhook is not undefined", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const existingWebhook = {
      URL: "https://old.example.com",
      project: false,
      component: false
    };
    const newWebhook = {
      URL: "https://new.example.com",
      project: true,
      component: true
    };

    const mockProjectJson = {
      name: "testProject",
      webhook: existingWebhook
    };

    const mockPatch = [{ op: "replace", path: "/URL", value: "https://new.example.com" }];

    getProjectJsonMock.resolves(mockProjectJson);
    writeProjectJsonMock.resolves();
    diffMock.returns(mockPatch);
    diffApplyMock.callsFake((target, patch)=>{
      target.URL = patch[0].value;
      target.project = true;
      target.component = true;
    });

    const result = await replaceWebhook(mockProjectRootDir, newWebhook);

    expect(diffMock.calledOnceWithExactly(existingWebhook, newWebhook)).to.be.true;
    expect(diffApplyMock.calledOnce).to.be.true;

    expect(writeProjectJsonMock.calledOnceWithExactly(mockProjectRootDir, {
      name: "testProject",
      webhook: existingWebhook
    })).to.be.true;

    expect(result).to.deep.equal({
      URL: "https://new.example.com",
      project: true,
      component: true
    });
  });

  it("should throw an error if getProjectJson fails", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const newWebhook = { URL: "https://example.com/webhook", project: true, component: true };

    const mockError = new Error("Failed to read project JSON");
    getProjectJsonMock.rejects(mockError);

    try {
      await replaceWebhook(mockProjectRootDir, newWebhook);
      throw new Error("Expected replaceWebhook to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(writeProjectJsonMock.notCalled).to.be.true;
    expect(diffMock.notCalled).to.be.true;
    expect(diffApplyMock.notCalled).to.be.true;
  });

  it("should throw an error if writeProjectJson fails", async ()=>{
    const mockProjectRootDir = "/mock/project/root";
    const newWebhook = { URL: "https://example.com/webhook", project: true, component: true };
    const existingWebhook = { URL: "https://old.example.com", project: false, component: false };
    const mockPatch = [{ op: "replace", path: "/URL", value: "https://example.com/webhook" }];

    getProjectJsonMock.resolves({ webhook: existingWebhook });
    diffMock.returns(mockPatch);
    diffApplyMock.callsFake((target, patch)=>{
      target.URL = patch[0].value;
      target.project = true;
      target.component = true;
    });

    const mockError = new Error("Failed to write JSON");
    writeProjectJsonMock.rejects(mockError);

    try {
      await replaceWebhook(mockProjectRootDir, newWebhook);
      throw new Error("Expected replaceWebhook to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(getProjectJsonMock.calledOnce).to.be.true;
    expect(diffMock.calledOnce).to.be.true;
    expect(diffApplyMock.calledOnce).to.be.true;
    expect(writeProjectJsonMock.calledOnce).to.be.true;
  });
});
