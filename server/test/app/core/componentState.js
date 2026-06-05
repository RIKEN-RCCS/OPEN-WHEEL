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
import path from "path";

//testee
import {
  _internal,
  setComponentStateR
} from "../../../app/core/componentState.js";

describe("componentState tests", ()=>{
  //eslint-disable-next-line @stylistic/max-statements-per-line
  let globMock; let readJsonGreedyMock; let writeComponentJsonMock;

  beforeEach(()=>{
    globMock = sinon.stub();
    readJsonGreedyMock = sinon.stub(_internal, "readJsonGreedy");
    writeComponentJsonMock = sinon.stub(_internal, "writeComponentJson");

    sinon.stub(_internal, "glob").callsFake(globMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  describe("#setComponentStateR", ()=>{
    it("should update the state for all components and call writeComponentJson", async ()=>{
      const mockProjectRootDir = "/mock/project/root";
      const mockDir = "/mock/project/root/components";
      const state = "finished";

      const globMockFilenames = [
        path.join(mockDir, "component1.json"),
        path.join(mockDir, "component2.json")
      ];
      const expectedFilenames = [
        path.join(mockDir, "component1.json"),
        path.join(mockDir, "component2.json"),
        path.join(mockDir, "cmp.wheel.json")
      ];

      const mockComponents = [
        { state: "not-started" },
        { state: "not-started" },
        { state: "default" }
      ];

      globMock.resolves(globMockFilenames);
      readJsonGreedyMock.onCall(0).resolves(mockComponents[0]);
      readJsonGreedyMock.onCall(1).resolves(mockComponents[1]);
      readJsonGreedyMock.onCall(2).resolves(mockComponents[2]);
      writeComponentJsonMock.resolves("success");

      await setComponentStateR(mockProjectRootDir, mockDir, state);

      expect(globMock.calledOnceWithExactly(path.join(mockDir, "**", "cmp.wheel.json"))).to.be.true;
      expect(readJsonGreedyMock.calledThrice).to.be.true;
      expect(writeComponentJsonMock.calledThrice).to.be.true;

      expect(writeComponentJsonMock.firstCall.args[1]).to.equal(path.dirname(expectedFilenames[0]));
      expect(writeComponentJsonMock.secondCall.args[1]).to.equal(path.dirname(expectedFilenames[1]));
      expect(writeComponentJsonMock.thirdCall.args[1]).to.equal(path.dirname(expectedFilenames[2]));

      expect(writeComponentJsonMock.firstCall.args[2].state).to.equal(state);
      expect(writeComponentJsonMock.secondCall.args[2].state).to.equal(state);
      expect(writeComponentJsonMock.thirdCall.args[2].state).to.equal(state);
    });

    it("should skip updating components in ignoreStates", async ()=>{
      const mockProjectRootDir = "/mock/project/root";
      const mockDir = "/mock/project/root/components";
      const mockState = "finished";
      const ignoreStates = ["running", "finished"];

      const globMockFilenames = [
        path.join(mockDir, "component1.json"),
        path.join(mockDir, "component2.json")
      ];
      const expectedFilenames = [
        path.join(mockDir, "component1.json"),
        path.join(mockDir, "component2.json"),
        path.join(mockDir, "cmp.wheel.json")
      ];

      const mockComponents = [
        { state: "not-started" }, //更新対象
        { state: "running" }, //スキップ対象
        { state: "default" } //更新対象
      ];

      globMock.resolves(globMockFilenames);
      readJsonGreedyMock.onCall(0).resolves(mockComponents[0]);
      readJsonGreedyMock.onCall(1).resolves(mockComponents[1]);
      readJsonGreedyMock.onCall(2).resolves(mockComponents[2]);
      writeComponentJsonMock.resolves("success");

      await setComponentStateR(mockProjectRootDir, mockDir, mockState, false, ignoreStates);

      expect(globMock.calledOnceWithExactly(path.join(mockDir, "**", "cmp.wheel.json"))).to.be.true;
      expect(readJsonGreedyMock.calledThrice).to.be.true;
      expect(writeComponentJsonMock.calledTwice).to.be.true; //2回のみ更新

      expect(writeComponentJsonMock.firstCall.args[1]).to.equal(path.dirname(expectedFilenames[0]));
      expect(writeComponentJsonMock.secondCall.args[1]).to.equal(path.dirname(expectedFilenames[2]));

      expect(writeComponentJsonMock.firstCall.args[2].state).to.equal(mockState);
      expect(writeComponentJsonMock.secondCall.args[2].state).to.equal(mockState);
    });

    it("should handle an empty directory gracefully", async ()=>{
      const mockProjectRootDir = "/mock/project/root";
      const mockDir = "/mock/project/root/components";
      const mockState = "finished";

      const globMockFilenames = []; //空ディレクトリとして設定
      const expectedFilenames = [
        path.join(mockDir, "cmp.wheel.json") //自動追加される
      ];

      globMock.resolves(globMockFilenames);
      readJsonGreedyMock.onCall(0).resolves({ state: "default" });
      writeComponentJsonMock.resolves("success");

      await setComponentStateR(mockProjectRootDir, mockDir, mockState);

      expect(globMock.calledOnceWithExactly(path.join(mockDir, "**", "cmp.wheel.json"))).to.be.true;
      expect(readJsonGreedyMock.calledOnce).to.be.true; //cmp.wheel.json のみ処理される
      expect(writeComponentJsonMock.calledOnce).to.be.true;

      expect(writeComponentJsonMock.firstCall.args[1]).to.equal(path.dirname(expectedFilenames[0]));
      expect(writeComponentJsonMock.firstCall.args[2].state).to.equal(mockState);
    });
  });
});
