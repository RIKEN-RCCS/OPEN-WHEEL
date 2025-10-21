/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from 'url';

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
import { getLogger, configure, logSettings, _internal } from "../../app/logSettings.js";

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
});