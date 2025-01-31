/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

const path = require("path");
const sinon = require("sinon");
const fs = require("fs-extra");
const { expect } = require("chai");
const rewire = require("rewire");

const executerManager = rewire("../../app/core/executerManager");
const executers = executerManager.__get__("executers");
const removeExecuters = executerManager.__get__("removeExecuters");
const testDirRoot = "WHEEL_TEST_TMP";

describe("UT for executerManager class", function () {
  describe("removeExecuters", async ()=>{
    const mockProjectRootDir = path.resolve("WHEEL_TEST_TMP", "testProject.wheel");
    const otherProjectRootDir = path.resolve("WHEEL_TEST_TMP", "otherProject.wheel");
    let executerMock;

    beforeEach(function () {
      executerMock = {
        stop: sinon.stub(),
        start: sinon.stub()
      };
      executers.set(`${mockProjectRootDir}-localhost-false`, executerMock);
      executers.set(`${mockProjectRootDir}-remoteHost-true`, executerMock);
      executers.set(`${otherProjectRootDir}-localhost-false`, executerMock);

      expect(executers.size).to.be.greaterThan(0); //事前確認
    });
    after(async ()=>{
      if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
        await fs.remove(testDirRoot);
      }
    });

    it("should remove all executers associated with a given projectRootDir", async function () {
      removeExecuters(mockProjectRootDir);
      expect(executers.has(`${mockProjectRootDir}-localhost-false`)).to.be.false;
      expect(executers.has(`${mockProjectRootDir}-remoteHost-true`)).to.be.false;
      expect(executers.size).to.equal(1);
    });

    it("should not remove executers from other projects", function () {
      removeExecuters(mockProjectRootDir);
      expect(executers.has(`${otherProjectRootDir}-localhost-false`)).to.be.true;
    });

    it("should not throw an error if no matching executers exist", function () {
      executers.clear();

      expect(()=>removeExecuters(mockProjectRootDir)).to.not.throw();
      expect(executers.size).to.equal(0);
    });
  });
});
