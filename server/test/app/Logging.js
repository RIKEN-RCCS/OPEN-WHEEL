/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//setup test framework
import { expect } from "chai";
import * as chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
chai.use((_chai, _)=>{
  _chai.Assertion.addMethod("withMessage", function (msg) {
    _.flag(this, "message", msg);
  });
});

import { logFilename } from "../../app/db/db.js";
const projectRootDir = path.resolve("hoge");

//testee
import { getLogger, configure, logSettings, _internal, logInfo, logDebug, logError } from "../../app/logSettings.js";

describe("Unit test for log4js's helper functions", ()=>{
  let logger;
  let emitAll;
  let originalLog2clientLevel;
  let originalFilterdFileLevel;
  before(async ()=>{
    originalLog2clientLevel = logSettings.appenders.log2client.level;
    originalFilterdFileLevel = logSettings.appenders.filterdFile.level;
    logSettings.appenders.log2client.level = "debug";
    logSettings.appenders.filterdFile.level = "trace";
    configure(logSettings);
    emitAll = sinon.stub(_internal, "emitAll");
  });
  after(async ()=>{
    sinon.restore();
    logSettings.appenders.log2client.level = originalLog2clientLevel;
    logSettings.appenders.filterdFile.level = originalFilterdFileLevel;
    configure(logSettings);
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
      configure(logSettings);
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
      expect(calls[0].args[1]).to.eql("WHEEL_LOG");
      const infoLog = JSON.parse(calls[0].args[2].slice(0, -1));
      expect(infoLog.data[0]).to.equal("info");
      expect(calls[1].args[0]).to.eql(projectRootDir);
      expect(calls[1].args[1]).to.eql("WHEEL_LOG");
      const errorLog = JSON.parse(calls[1].args[2].slice(0, -1));
      expect(errorLog.data[0]).to.equal("error");
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
      expect(fs.statSync(filename).isFile()).to.be.true;
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
  describe("#logWithComponentDir", ()=>{
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
      configure(logSettings);
    });
    it("should convert absolute path to relative path", async ()=>{
      const componentDir = path.join(projectRootDir, "workflow1", "task0");
      logInfo(projectRootDir, componentDir, "test message");
      await getLogger(projectRootDir).shutdown();

      const filename = path.resolve(projectRootDir, path.basename(logFilename));
      const log = await fs.readFile(filename).then((data)=>{
        return data.toString();
      });
      expect(log).to.match(/\[workflow1\/task0\]/);
      expect(log).to.match(/test message/);
    });
    it("should show 'project root' when componentDir equals projectRootDir", async ()=>{
      logDebug(projectRootDir, projectRootDir, "root message");
      await getLogger(projectRootDir).shutdown();

      const filename = path.resolve(projectRootDir, path.basename(logFilename));
      const log = await fs.readFile(filename).then((data)=>{
        return data.toString();
      });
      expect(log).to.match(/\[project root\]/);
      expect(log).to.match(/root message/);
    });
    it("should keep absolute path if not under projectRootDir", async ()=>{
      const externalPath = "/some/external/path";
      logError(projectRootDir, externalPath, "external message");
      await getLogger(projectRootDir).shutdown();

      const filename = path.resolve(projectRootDir, path.basename(logFilename));
      const log = await fs.readFile(filename).then((data)=>{
        return data.toString();
      });
      expect(log).to.match(/\[\/some\/external\/path\]/);
      expect(log).to.match(/external message/);
    });
    it("should not print '[object Object]' when a plain object is logged", async ()=>{
      logInfo(projectRootDir, projectRootDir, "payload:", { foo: "bar" });
      await getLogger(projectRootDir).shutdown();

      const filename = path.resolve(projectRootDir, path.basename(logFilename));
      const log = await fs.readFile(filename).then((data)=>{
        return data.toString();
      });
      expect(log).not.to.match(/\[object Object\]/);
      expect(log).to.match(/"foo":"bar"/);
    });
    it("should not print '[object Object]' and should keep the stack when an Error is logged", async ()=>{
      const err = new Error("something went wrong");
      logError(projectRootDir, projectRootDir, "operation failed:", err);
      await getLogger(projectRootDir).shutdown();

      const filename = path.resolve(projectRootDir, path.basename(logFilename));
      const log = await fs.readFile(filename).then((data)=>{
        return data.toString();
      });
      expect(log).not.to.match(/\[object Object\]/);
      expect(log).to.match(/Error: something went wrong/);
    });
  });
  describe("#object logging to client", ()=>{
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
      configure(logSettings);
    });
    it("should not send '[object Object]' to client when a plain object is logged directly", ()=>{
      logger = getLogger(projectRootDir);
      logger.info("payload:", { foo: "bar" });
      expect(emitAll.callCount).to.eql(1);
      const payload = emitAll.getCalls()[0].args[2].slice(0, -1);
      expect(payload).not.to.match(/\[object Object\]/);
      const infoLog = JSON.parse(payload);
      expect(infoLog.data.join(" ")).not.to.match(/\[object Object\]/);
      expect(infoLog.data.join(" ")).to.match(/"foo":"bar"/);
    });
    it("should not send '[object Object]' to client when an Error is logged directly", ()=>{
      logger = getLogger(projectRootDir);
      const err = new Error("something went wrong");
      logger.error("operation failed:", err);
      expect(emitAll.callCount).to.eql(1);
      const payload = emitAll.getCalls()[0].args[2].slice(0, -1);
      expect(payload).not.to.match(/\[object Object\]/);
      const errorLog = JSON.parse(payload);
      expect(errorLog.data.join(" ")).to.match(/Error: something went wrong/);
    });
  });
});
