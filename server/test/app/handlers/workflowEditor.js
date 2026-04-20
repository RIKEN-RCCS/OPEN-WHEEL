/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

//setup test framework
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const expect = chai.expect;

//testee
import { enqueueProjectOperation, stopProjectEdits, startProjectEdits, clearProjectEdits } from "../../../app/handlers/workflowEditor.js";

describe("workflowEditor UT", ()=>{
  describe("enqueueProjectOperation", ()=>{
    it("should execute operations serially for the same project", async ()=>{
      const order = [];
      const project = "/test/project-serial";

      const op1 = enqueueProjectOperation(project, async ()=>{
        order.push("op1-start");
        await new Promise((resolve)=>{ return setTimeout(resolve, 20); });
        order.push("op1-end");
      });
      const op2 = enqueueProjectOperation(project, async ()=>{
        order.push("op2-start");
        await new Promise((resolve)=>{ return setTimeout(resolve, 10); });
        order.push("op2-end");
      });

      await Promise.all([op1, op2]);

      expect(order).to.deep.equal(["op1-start", "op1-end", "op2-start", "op2-end"]);
    });

    it("should run operations for different projects concurrently", async ()=>{
      const order = [];
      const projectA = "/test/projectA-concurrent";
      const projectB = "/test/projectB-concurrent";

      const opA = enqueueProjectOperation(projectA, async ()=>{
        order.push("A-start");
        await new Promise((resolve)=>{ return setTimeout(resolve, 30); });
        order.push("A-end");
      });
      const opB = enqueueProjectOperation(projectB, async ()=>{
        order.push("B-start");
        await new Promise((resolve)=>{ return setTimeout(resolve, 10); });
        order.push("B-end");
      });

      await Promise.all([opA, opB]);

      //B finishes before A because they run concurrently and B is shorter
      expect(order[0]).to.equal("A-start");
      expect(order[1]).to.equal("B-start");
      expect(order[2]).to.equal("B-end");
      expect(order[3]).to.equal("A-end");
    });

    it("should continue the queue after a failed operation", async ()=>{
      const project = "/test/project-fail";
      let op2Ran = false;

      const op1 = enqueueProjectOperation(project, async ()=>{
        throw new Error("intentional failure");
      });
      const op2 = enqueueProjectOperation(project, async ()=>{
        op2Ran = true;
      });

      await expect(op1).to.be.rejectedWith("intentional failure");
      await op2;
      expect(op2Ran).to.be.true;
    });

    it("should allow a new operation after the queue is emptied", async ()=>{
      const project = "/test/project-cleanup";
      let count = 0;

      await enqueueProjectOperation(project, async ()=>{ count++; });
      //queue should be empty now; a new enqueue must still work
      await enqueueProjectOperation(project, async ()=>{ count++; });
      expect(count).to.equal(2);
    });
  });

  describe("stopProjectEdits and startProjectEdits", ()=>{
    it("should resolve immediately when no operation is running", async ()=>{
      await expect(stopProjectEdits("/test/project-stop-empty")).to.be.fulfilled;
      startProjectEdits("/test/project-stop-empty");
    });

    it("should wait for an in-flight operation before resolving", async ()=>{
      const project = "/test/project-stop-wait";
      let opCompleted = false;

      enqueueProjectOperation(project, async ()=>{
        await new Promise((resolve)=>{
          setTimeout(resolve, 30);
        });
        opCompleted = true;
      }).catch(()=>{});

      //Let SBS's internal setTimeout(0) fire so the op enters "running" state.
      await new Promise((resolve)=>{ setTimeout(resolve, 0); });

      await stopProjectEdits(project);
      expect(opCompleted).to.be.true;
      startProjectEdits(project);
    });

    it("should block new operations from starting while stopped", async ()=>{
      const project = "/test/project-stop-block";
      const executed = [];

      await stopProjectEdits(project);
      //enqueue while stopped — should not run yet
      const pending = enqueueProjectOperation(project, async ()=>{
        executed.push("ran");
      });
      expect(executed).to.deep.equal([]);

      startProjectEdits(project);
      await pending;
      expect(executed).to.deep.equal(["ran"]);
    });

    it("should resolve even if the in-flight operation fails", async ()=>{
      const project = "/test/project-stop-fail";

      enqueueProjectOperation(project, async ()=>{
        throw new Error("intentional failure in stop test");
      }).catch(()=>{});

      await expect(stopProjectEdits(project)).to.be.fulfilled;
      startProjectEdits(project);
    });
  });

  describe("clearProjectEdits", ()=>{
    it("should resolve immediately when no operation is running", async ()=>{
      await expect(clearProjectEdits("/test/project-clear-empty")).to.be.fulfilled;
      startProjectEdits("/test/project-clear-empty");
    });

    it("should wait for an in-flight operation before resolving", async ()=>{
      const project = "/test/project-clear-wait";
      let opCompleted = false;

      enqueueProjectOperation(project, async ()=>{
        await new Promise((resolve)=>{
          setTimeout(resolve, 30);
        });
        opCompleted = true;
      }).catch(()=>{});

      //Let SBS's internal setTimeout(0) fire so the op enters "running" state.
      await new Promise((resolve)=>{ setTimeout(resolve, 0); });

      await clearProjectEdits(project);
      expect(opCompleted).to.be.true;
      startProjectEdits(project);
    });

    it("should discard waiting operations", async ()=>{
      const project = "/test/project-clear-discard";
      const executed = [];

      //fill queue with a long-running op so second op stays waiting
      enqueueProjectOperation(project, async ()=>{
        await new Promise((resolve)=>{
          setTimeout(resolve, 50);
        });
        executed.push("op1");
      }).catch(()=>{});
      enqueueProjectOperation(project, async ()=>{
        executed.push("op2");
      }).catch(()=>{});

      //Let SBS's internal setTimeout(0) fire so op1 enters "running" state
      //and op2 stays in the waiting queue.
      await new Promise((resolve)=>{ setTimeout(resolve, 0); });

      await clearProjectEdits(project);
      //op1 was running so it completes; op2 was waiting and should be discarded
      expect(executed).to.deep.equal(["op1"]);
      startProjectEdits(project);
    });

    it("should resolve even if the in-flight operation fails", async ()=>{
      const project = "/test/project-clear-fail";

      enqueueProjectOperation(project, async ()=>{
        throw new Error("intentional failure in clear test");
      }).catch(()=>{});

      await expect(clearProjectEdits(project)).to.be.fulfilled;
      startProjectEdits(project);
    });
  });
});
