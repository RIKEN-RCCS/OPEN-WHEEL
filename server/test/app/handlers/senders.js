/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

//setup test framework
import * as chai from "chai";
import sinon from "sinon";
import path from "path";
const expect = chai.expect;

//testee
import { sendWorkflow, _internal } from "../../../app/handlers/senders.js";
import { getParentDirs, removeParentDirsOfClient } from "../../../app/core/global.js";

describe("senders UT", ()=>{
  describe("sendWorkflow", ()=>{
    const projectRootDir = path.resolve("/tmp/senders-ut-project");
    const subDir = path.resolve(projectRootDir, "sub");
    const otherDir = path.resolve(projectRootDir, "other");
    let emitted;
    beforeEach(()=>{
      emitted = [];
      sinon.stub(_internal, "getThreeGenerationFamily").callsFake(async (root, dir)=>{
        return { ID: dir };
      });
      sinon.stub(_internal, "emitAll").callsFake(async (room, eventName, wf)=>{
        emitted.push({ room, eventName, ID: wf.ID });
      });
    });
    afterEach(()=>{
      sinon.restore();
      removeParentDirsOfClient("clientA");
      removeParentDirsOfClient("clientB");
    });
    it("should send requested dir only to the requester and record it", async ()=>{
      const cb = sinon.stub();
      await sendWorkflow(cb, projectRootDir, subDir, "clientA");
      expect(emitted).to.deep.equal([{ room: "clientA", eventName: "workflow", ID: subDir }]);
      expect(getParentDirs(projectRootDir)).to.deep.equal([subDir]);
      expect(cb.calledOnceWith(true)).to.be.true;
    });
    it("should keep displayed dirs of every client", async ()=>{
      await sendWorkflow(null, projectRootDir, subDir, "clientA");
      await sendWorkflow(null, projectRootDir, otherDir, "clientB");
      expect(getParentDirs(projectRootDir)).to.have.members([subDir, otherDir]);
    });
    it("should send every displayed dir to the project room if dir is not specified", async ()=>{
      await sendWorkflow(null, projectRootDir, subDir, "clientA");
      await sendWorkflow(null, projectRootDir, otherDir, "clientB");
      emitted = [];
      await sendWorkflow(null, projectRootDir);
      expect(emitted).to.have.deep.members([
        { room: projectRootDir, eventName: "workflow", ID: subDir },
        { room: projectRootDir, eventName: "workflow", ID: otherDir }
      ]);
    });
    it("should send the same dir only once even if displayed by several clients", async ()=>{
      await sendWorkflow(null, projectRootDir, subDir, "clientA");
      await sendWorkflow(null, projectRootDir, subDir, "clientB");
      emitted = [];
      await sendWorkflow(null, projectRootDir);
      expect(emitted).to.deep.equal([{ room: projectRootDir, eventName: "workflow", ID: subDir }]);
    });
    it("should send specified dir and every displayed dir without duplication", async ()=>{
      await sendWorkflow(null, projectRootDir, subDir, "clientA");
      await sendWorkflow(null, projectRootDir, otherDir, "clientB");
      emitted = [];
      await sendWorkflow(null, projectRootDir, subDir);
      expect(emitted).to.have.deep.members([
        { room: projectRootDir, eventName: "workflow", ID: subDir },
        { room: projectRootDir, eventName: "workflow", ID: otherDir }
      ]);
      expect(emitted).to.have.lengthOf(2);
    });
    it("should send root dir if no client displays the project", async ()=>{
      await sendWorkflow(null, projectRootDir);
      expect(emitted).to.deep.equal([{ room: projectRootDir, eventName: "workflow", ID: projectRootDir }]);
    });
    it("should not change displayed dirs on broadcast", async ()=>{
      await sendWorkflow(null, projectRootDir, subDir, "clientA");
      await sendWorkflow(null, projectRootDir, otherDir);
      expect(getParentDirs(projectRootDir)).to.deep.equal([subDir]);
    });
    it("should forget displayed dir of disconnected client", async ()=>{
      await sendWorkflow(null, projectRootDir, subDir, "clientA");
      await sendWorkflow(null, projectRootDir, otherDir, "clientB");
      removeParentDirsOfClient("clientA");
      expect(getParentDirs(projectRootDir)).to.deep.equal([otherDir]);
      removeParentDirsOfClient("clientB");
      expect(getParentDirs(projectRootDir)).to.deep.equal([]);
    });
    it("should skip displayed dir which can not be read and continue", async ()=>{
      await sendWorkflow(null, projectRootDir, subDir, "clientA");
      await sendWorkflow(null, projectRootDir, otherDir, "clientB");
      _internal.getThreeGenerationFamily.callsFake(async (root, dir)=>{
        if (dir === subDir) {
          throw new Error("removed");
        }
        return { ID: dir };
      });
      emitted = [];
      const cb = sinon.stub();
      await sendWorkflow(cb, projectRootDir);
      expect(emitted).to.deep.equal([{ room: projectRootDir, eventName: "workflow", ID: otherDir }]);
      expect(cb.calledOnceWith(true)).to.be.true;
    });
    it("should pass error to cb if specified dir can not be read", async ()=>{
      const err = new Error("not found");
      _internal.getThreeGenerationFamily.rejects(err);
      const cb = sinon.stub();
      await sendWorkflow(cb, projectRootDir, subDir);
      expect(cb.calledOnceWith(err)).to.be.true;
    });
  });
});
