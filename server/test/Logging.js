/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
const fs = require("fs-extra");
const path = require("path");

//setup test framework
const chai = require("chai");
const { expect } = require("chai");
chai.use(require("chai-fs"));
const sinon = require("sinon");
chai.use(require("sinon-chai"));
chai.use((_chai, _)=>{
  _chai.Assertion.addMethod("withMessage", function (msg) {
    _.flag(this, "message", msg);
  });
});
const rewire = require("rewire");

const { logFilename } = require("../app/db/db.js");
const projectRootDir = path.resolve("hoge");

//testee
const LOG = rewire("../app/logSettings.js");
const getLogger = LOG.__get__("getLogger");

//stubs
const emitAll = sinon.stub();
LOG.__set__("emitAll", emitAll);

describe("Unit test for log4js's helper functions", ()=>{
  let logger;
  const log4js = LOG.__get__("log4js");
  const settings = LOG.__get__("logSettings");
  before(async ()=>{
    settings.appenders.log2client.level = "debug";
    settings.appenders.filterdFile.level = "trace";
    log4js.configure(settings);
  });
  after(async ()=>{
    settings.appenders.log2client.level = process.env.WHEEL_LOGLEVEL;
    settings.appenders.filterdFile.level = process.env.WHEEL_LOGLEVEL;
    log4js.configure(settings);
  });
  describe("#getLogger", ()=>{
    it("return log4js instance with default projectRootDir", ()=>{
      logger = getLogger();
      expect(logger.context.projectRootDir).to.equal(path.join(path.dirname(logFilename)));
    });
    it("return log4js instance with projectRootDir", ()=>{
      logger = getLogger(projectRootDir);
      expect(logger.context.projectRootDir).to.equal(projectRootDir);
    });
  });
  describe("#log", ()=>{
    beforeEach(async ()=>{
      await fs.remove(projectRootDir);
      await fs.mkdir(projectRootDir);
      emitAll.resetHistory();
    });
    afterEach(async ()=>{
      if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
        await fs.remove(path.resolve(__dirname, logFilename));
        await fs.remove(projectRootDir);
      }
      log4js.configure(settings);
    });
    it("should send info, warn and error log to client", ()=>{
      logger = getLogger(projectRootDir);
      logger.debug("debug");
      logger.info("info");
      logger.warn("warn");
      logger.error("error");
      expect(emitAll.callCount).to.eql(2);
      const calls = emitAll.getCalls();
      expect(calls[0].args[0]).to.eql(projectRootDir);
      expect(calls[0].args[1]).to.eql("logINFO");
      expect(calls[0].args[2]).to.match(/info$/);
      expect(calls[1].args[0]).to.eql(projectRootDir);
      expect(calls[1].args[1]).to.eql("logERR");
      expect(calls[1].args[2]).to.match(/error$/);
    });
    it("should write all logs except trace to file", async ()=>{
      logger = getLogger(projectRootDir);
      logger.trace("trace");
      logger.debug("debug");
      logger.info("info");
      logger.warn("warn");
      logger.error("error");
      logger.fatal("fatal");
      await logger.shutdown();

      const filename = path.resolve(projectRootDir, path.basename(logFilename));
      expect(filename).to.be.a.file();
      const log = await fs.readFile(filename).then((data)=>{
        return data.toString();
      });
      expect(log).to.match(/trace/);
      expect(log).to.match(/debug/);
      expect(log).to.match(/info/);
      expect(log).to.match(/warn/);
      expect(log).to.match(/error/);
      expect(log).to.match(/fatal/);
    });
  });
});
