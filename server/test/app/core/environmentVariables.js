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
  getEnv,
  replaceEnv,
  _internal
} from "../../../app/core/environmentVariables.js";

describe("#getEnv", ()=>{
  let readComponentJsonByIDMock;

  beforeEach(()=>{
    readComponentJsonByIDMock = sinon.stub(_internal, "readComponentJsonByID");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return the env object if the component has env property", async ()=>{
    const mockComponentJson = {
      env: {
        VAR_A: "VALUE_A",
        VAR_B: "VALUE_B"
      }
    };

    readComponentJsonByIDMock.resolves(mockComponentJson);

    const projectRootDir = "/mock/project/root";
    const componentID = "mockComponentID";
    const result = await getEnv(projectRootDir, componentID);

    expect(readComponentJsonByIDMock.calledOnceWithExactly(projectRootDir, componentID)).to.be.true;
    expect(result).to.deep.equal(mockComponentJson.env);
  });

  it("should return an empty object if env property is not defined", async ()=>{
    const mockComponentJson = { name: "testComponent" };
    readComponentJsonByIDMock.resolves(mockComponentJson);

    const result = await getEnv("/mock/project/root", "mockComponentID");
    expect(result).to.deep.equal({});
  });

  it("should throw an error if readComponentJsonByID rejects", async ()=>{
    const mockError = new Error("Failed to read component JSON");
    readComponentJsonByIDMock.rejects(mockError);

    try {
      await getEnv("/mock/project/root", "errorComponentID");
      expect.fail("getEnv should throw an error, but did not");
    } catch (err) {
      expect(err).to.equal(mockError);
    }
  });
});

describe("#replaceEnv", ()=>{
  let readComponentJsonByIDMock;
  let writeComponentJsonByIDMock;
  let diffStub;
  let diffApplyStub;
  const componentJson = {
    ID: "testComponent",
    env: { OLD_KEY: "old_value", UNUSED_KEY: "unused" }
  };

  beforeEach(()=>{
    readComponentJsonByIDMock = sinon.stub(_internal, "readComponentJsonByID");
    writeComponentJsonByIDMock = sinon.stub(_internal, "writeComponentJsonByID").resolves();
    diffStub = sinon.stub(_internal, "diff");
    diffApplyStub = sinon.stub(_internal, "diffApply");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should replace env with newEnv and write the updated component JSON", async ()=>{
    readComponentJsonByIDMock.resolves(componentJson);
    writeComponentJsonByIDMock.resolves();
    diffStub.returns([{ op: "replace", path: "/OLD_KEY", value: "new_value" }]);

    //eslint-disable-next-line no-unused-vars
    diffApplyStub.callsFake((target, _patch)=>{
      target.OLD_KEY = "new_value";
      delete target.UNUSED_KEY;
    });

    const newEnv = { OLD_KEY: "new_value" };

    const result = await replaceEnv("/project/root", "testComponent", newEnv);

    expect(readComponentJsonByIDMock.calledOnceWithExactly("/project/root", "testComponent")).to.be.true;
    expect(diffStub.calledOnceWithExactly(componentJson.env, newEnv)).to.be.true;
    expect(diffApplyStub.calledOnce).to.be.true;
    expect(writeComponentJsonByIDMock.calledOnceWithExactly("/project/root", "testComponent", componentJson)).to.be.true;

    expect(result.env).to.deep.equal({ OLD_KEY: "new_value" });
  });

  it("should throw an error if readComponentJsonByID fails", async ()=>{
    const mockError = new Error("Failed to read component JSON");
    readComponentJsonByIDMock.rejects(mockError);

    try {
      await replaceEnv("/project/root", "testComponent", {});
      throw new Error("Expected replaceEnv to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(readComponentJsonByIDMock.calledOnceWithExactly("/project/root", "testComponent")).to.be.true;
    expect(writeComponentJsonByIDMock.notCalled).to.be.true;
    expect(diffStub.notCalled).to.be.true;
    expect(diffApplyStub.notCalled).to.be.true;
  });

  it("should throw an error if writeComponentJsonByID fails", async ()=>{
    readComponentJsonByIDMock.resolves(componentJson);
    diffStub.returns([]);
    diffApplyStub.callsFake(()=>{});

    const mockError = new Error("Failed to write component JSON");
    writeComponentJsonByIDMock.rejects(mockError);

    try {
      await replaceEnv("/project/root", "testComponent", { NEW_KEY: "new_value" });
      throw new Error("Expected replaceEnv to throw");
    } catch (err) {
      expect(err).to.equal(mockError);
    }

    expect(diffStub.calledOnce).to.be.true;
    expect(diffApplyStub.calledOnce).to.be.true;
    expect(writeComponentJsonByIDMock.calledOnce).to.be.true;
  });
});
