/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

import path from "path";
import os from "os";
import fs from "fs-extra";
import sinon from "sinon";
import * as chai from "chai";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
const { expect } = chai;

import { migrateConfigFile, warnDeprecatedEnvVars, runMigrations, PROP_RENAMES, DEPRECATED_ENV_VARS } from "../../../app/core/migrationHelper.js";

const testDirRoot = "WHEEL_MIGRATION_TEST_TMP";

describe("migrationHelper", function () {
  let warnStub;

  beforeEach(function () {
    warnStub = sinon.stub(console, "warn");
  });

  afterEach(function () {
    sinon.restore();
  });

  after(async function () {
    if (!process.env.WHEEL_KEEP_FILES_AFTER_LAST_TEST) {
      await fs.remove(testDirRoot);
    }
  });

  describe("PROP_RENAMES and DEPRECATED_ENV_VARS", function () {
    it("should have numJobOnLocal → numLocalJob in PROP_RENAMES", function () {
      expect(PROP_RENAMES).to.have.property("numJobOnLocal", "numLocalJob");
    });
    it("should have WHEEL_LOGLEVEL → WHEEL_LOG_LEVEL in DEPRECATED_ENV_VARS", function () {
      expect(DEPRECATED_ENV_VARS).to.have.property("WHEEL_LOGLEVEL", "WHEEL_LOG_LEVEL");
    });
  });

  describe("migrateConfigFile", function () {
    it("should silently skip if the file does not exist", async function () {
      const filePath = path.resolve(testDirRoot, "nonexistent.json");
      await migrateConfigFile(filePath);
      expect(warnStub).not.to.have.been.called;
    });

    it("should warn and skip if the file contains invalid JSON", async function () {
      const filePath = path.resolve(testDirRoot, "invalid.json");
      await fs.outputFile(filePath, "not json", "utf8");
      await migrateConfigFile(filePath);
      expect(warnStub).to.have.been.calledOnce;
      expect(warnStub.firstCall.args[0]).to.include("could not parse");
    });

    it("should rename old property to new property and rewrite the file", async function () {
      const filePath = path.resolve(testDirRoot, "rename.json");
      await fs.outputFile(filePath, JSON.stringify({ numJobOnLocal: 4, port: 8080 }), "utf8");
      await migrateConfigFile(filePath);
      const result = await fs.readJson(filePath);
      expect(result).to.have.property("numLocalJob", 4);
      expect(result).not.to.have.property("numJobOnLocal");
      expect(result).to.have.property("port", 8080);
      expect(warnStub).to.have.been.calledOnce;
      expect(warnStub.firstCall.args[0]).to.include("numJobOnLocal");
      expect(warnStub.firstCall.args[0]).to.include("numLocalJob");
    });

    it("should not modify file if no old properties are present", async function () {
      const filePath = path.resolve(testDirRoot, "nochange.json");
      const original = { numLocalJob: 2, port: 9090 };
      await fs.outputFile(filePath, JSON.stringify(original), "utf8");
      const mtime1 = (await fs.stat(filePath)).mtimeMs;
      await migrateConfigFile(filePath);
      const mtime2 = (await fs.stat(filePath)).mtimeMs;
      expect(mtime1).to.equal(mtime2);
      expect(warnStub).not.to.have.been.called;
    });

    it("should keep new property value and remove old property when both are present", async function () {
      const filePath = path.resolve(testDirRoot, "conflict.json");
      await fs.outputFile(filePath, JSON.stringify({ numJobOnLocal: 4, numLocalJob: 8 }), "utf8");
      await migrateConfigFile(filePath);
      const result = await fs.readJson(filePath);
      expect(result).to.have.property("numLocalJob", 8);
      expect(result).not.to.have.property("numJobOnLocal");
      expect(warnStub).to.have.been.calledOnce;
      expect(warnStub.firstCall.args[0]).to.include("numJobOnLocal");
      expect(warnStub.firstCall.args[0]).to.include("numLocalJob");
    });
  });

  describe("warnDeprecatedEnvVars", function () {
    it("should warn when a deprecated env var is set", function () {
      process.env.WHEEL_LOGLEVEL = "info";

      try {
        warnDeprecatedEnvVars();
      } finally {
        delete process.env.WHEEL_LOGLEVEL;
      }
      expect(warnStub).to.have.been.calledOnce;
      expect(warnStub.firstCall.args[0]).to.include("WHEEL_LOGLEVEL");
      expect(warnStub.firstCall.args[0]).to.include("WHEEL_LOG_LEVEL");
    });

    it("should not warn when no deprecated env vars are set", function () {
      delete process.env.WHEEL_LOGLEVEL;
      warnDeprecatedEnvVars();
      expect(warnStub).not.to.have.been.called;
    });
  });

  describe("runMigrations", function () {
    it("should migrate server.json in ~/.wheel and WHEEL_CONFIG_DIR", async function () {
      const homeDir = path.resolve(testDirRoot, "home");
      const configDir = path.resolve(testDirRoot, "configdir");
      const homeServerJson = path.join(homeDir, ".wheel", "server.json");
      const configDirServerJson = path.join(configDir, "server.json");

      await fs.outputFile(homeServerJson, JSON.stringify({ numJobOnLocal: 2 }), "utf8");
      await fs.outputFile(configDirServerJson, JSON.stringify({ numJobOnLocal: 3 }), "utf8");

      const origHome = os.homedir;
      os.homedir = ()=>{
        return homeDir;
      };
      process.env.WHEEL_CONFIG_DIR = configDir;

      try {
        await runMigrations();
      } finally {
        os.homedir = origHome;
        delete process.env.WHEEL_CONFIG_DIR;
      }

      const homeResult = await fs.readJson(homeServerJson);
      expect(homeResult).to.have.property("numLocalJob", 2);
      expect(homeResult).not.to.have.property("numJobOnLocal");

      const configResult = await fs.readJson(configDirServerJson);
      expect(configResult).to.have.property("numLocalJob", 3);
      expect(configResult).not.to.have.property("numJobOnLocal");
    });

    it("should warn about deprecated env vars during runMigrations", async function () {
      process.env.WHEEL_LOGLEVEL = "warn";

      try {
        await runMigrations();
      } finally {
        delete process.env.WHEEL_LOGLEVEL;
      }
      const calls = warnStub.args.map((a)=>{
        return a[0];
      });
      expect(calls.some((msg)=>{
        return msg.includes("WHEEL_LOGLEVEL");
      })).to.be.true;
    });
  });
});
