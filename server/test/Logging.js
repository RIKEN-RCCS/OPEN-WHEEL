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
  _chai.Assertion.addMethod("withMessage", function(msg) {
    _.flag(this, "message", msg);
  });
});
const rewire = require("rewire");

const { logFilename } = require("../app/db/db.js");
const projectRootDir = path.resolve("hoge");

//testee
const LOG = rewire("../app/logSettings.js");
const getLogger = LOG.__get__("getLogger");
const setLoglevel = LOG.__get__("setLoglevel");
const reset = LOG.__get__("reset");

//stubs
const emitAll = sinon.stub();
LOG.__set__("emitAll", emitAll);


describe("Unit test for log4js's helper functions", ()=>{
  let logger;
  before(async()=>{
    await setLoglevel("log2client", "debug");
    await setLoglevel("filterdFile", "trace");
  });
  after(async()=>{
    await setLoglevel("log2client", process.env.WHEEL_LOGLEVEL);
    await setLoglevel("filterdFile", process.env.WHEEL_LOGLEVEL);
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
    beforeEach(async()=>{
      await fs.remove(projectRootDir);
      await fs.mkdir(projectRootDir);
      emitAll.resetHistory();
    });
    afterEach(async()=>{
      if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
        await fs.remove(path.resolve(__dirname, logFilename));
        await fs.remove(projectRootDir);
      }
      reset();
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
    it("should write all logs except trace to file", async()=>{
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
