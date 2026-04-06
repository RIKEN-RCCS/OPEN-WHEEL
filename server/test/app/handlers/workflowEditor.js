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
import { enqueueProjectOperation } from "../../../app/handlers/workflowEditor.js";

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
});
