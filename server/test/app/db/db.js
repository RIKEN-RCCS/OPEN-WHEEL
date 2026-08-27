/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import os from "os";
import path from "path";
import fs from "fs-extra";

import * as chai from "chai";
const expect = chai.expect;

import { _internal } from "../../../app/db/db.js";
const { loadWheelConfig, coerce } = _internal;

/**
 * Write a JSON file to a temp path and return the path.
 * @param {string} dir - directory to write to
 * @param {string} filename - file name
 * @param {object} data - data to serialize
 * @returns {string} full file path
 */
async function writeJson(dir, filename, data) {
  await fs.ensureDir(dir);
  const filepath = path.join(dir, filename);
  await fs.writeJson(filepath, data);
  return filepath;
}

describe("loadWheelConfig", function () {
  let savedWheelEnv;
  let tmpDir;

  beforeEach(async function () {
    //Snapshot and clear every WHEEL_* env var. loadWheelConfig() now gives non-empty
    //WHEEL_* env vars top priority, so a stray one inherited from the CI / docker-compose
    //environment (e.g. WHEEL_LOG_LEVEL=OFF, or a WHEEL_PORT) would otherwise leak in and
    //perturb the file-vs-file precedence assertions below.
    savedWheelEnv = {};

    for (const key of Object.keys(process.env)) {
      if (key.startsWith("WHEEL_")) {
        savedWheelEnv[key] = process.env[key];
        delete process.env[key];
      }
    }
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "wheel-db-test-"));
  });

  afterEach(async function () {
    //Restore the exact WHEEL_* env snapshot (drop any a test added, re-add any it deleted).
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("WHEEL_")) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, savedWheelEnv);
    await fs.remove(tmpDir);
  });

  it("returns server.json package defaults when no config files exist", async function () {
    const config = await loadWheelConfig("server.json");
    expect(config).to.be.an("object");
    expect(config.port).to.equal(8089);
  });

  it("applies WHEEL_CONFIG_DIR/server.json as highest priority override", async function () {
    const configDir = path.join(tmpDir, "config");
    await writeJson(configDir, "server.json", { port: 7777 });
    process.env.WHEEL_CONFIG_DIR = configDir;

    const config = await loadWheelConfig("server.json");
    expect(config.port).to.equal(7777);
  });

  it("WHEEL_CONFIG_DIR/server.json overrides ~/.wheel/server.json", async function () {
    const dotWheelDir = path.join(os.homedir(), ".wheel");
    const dotWheelConfig = path.join(dotWheelDir, "server.json");

    let existed = false;
    let originalContent;
    try {
      originalContent = await fs.readFile(dotWheelConfig, "utf-8");
      existed = true;
    } catch (e) {
      if (e.code !== "ENOENT") {
        throw e;
      }
    }

    try {
      await fs.ensureDir(dotWheelDir);
      await fs.writeJson(dotWheelConfig, { port: 5555 });

      const configDir = path.join(tmpDir, "envconfig");
      await writeJson(configDir, "server.json", { port: 6543 });
      process.env.WHEEL_CONFIG_DIR = configDir;

      const config = await loadWheelConfig("server.json");
      expect(config.port).to.equal(6543);
    } finally {
      if (existed) {
        await fs.writeFile(dotWheelConfig, originalContent);
      } else {
        await fs.remove(dotWheelConfig);
      }
    }
  });

  it("uses ~/.wheel/server.json as defaults when no WHEEL_CONFIG_DIR is set", async function () {
    const dotWheelDir = path.join(os.homedir(), ".wheel");
    const dotWheelConfig = path.join(dotWheelDir, "server.json");

    let existed = false;
    let originalContent;
    try {
      originalContent = await fs.readFile(dotWheelConfig, "utf-8");
      existed = true;
    } catch (e) {
      if (e.code !== "ENOENT") {
        throw e;
      }
    }

    try {
      await fs.ensureDir(dotWheelDir);
      await fs.writeJson(dotWheelConfig, { port: 5432 });

      const config = await loadWheelConfig("server.json");
      expect(config.port).to.equal(5432);
    } finally {
      if (existed) {
        await fs.writeFile(dotWheelConfig, originalContent);
      } else {
        await fs.remove(dotWheelConfig);
      }
    }
  });

  it("non-port fields from server.json package defaults are preserved", async function () {
    const config = await loadWheelConfig("server.json");
    expect(config).to.include.keys("numLogFiles");
  });

  it("returns jobScheduler.json package defaults when no config files exist", async function () {
    const config = await loadWheelConfig("jobScheduler.json");
    expect(config).to.be.an("object");
    expect(config).to.include.keys("PBSPro", "SLURM");
  });

  it("applies WHEEL_CONFIG_DIR/jobScheduler.json as highest priority override", async function () {
    const configDir = path.join(tmpDir, "config");
    await writeJson(configDir, "jobScheduler.json", { PBSPro: { submit: "custom-qsub" } });
    process.env.WHEEL_CONFIG_DIR = configDir;

    const config = await loadWheelConfig("jobScheduler.json");
    expect(config.PBSPro.submit).to.equal("custom-qsub");
  });

  it("uses ~/.wheel/jobScheduler.json as defaults when no WHEEL_CONFIG_DIR is set", async function () {
    const dotWheelDir = path.join(os.homedir(), ".wheel");
    const dotWheelConfig = path.join(dotWheelDir, "jobScheduler.json");

    let existed = false;
    let originalContent;
    try {
      originalContent = await fs.readFile(dotWheelConfig, "utf-8");
      existed = true;
    } catch (e) {
      if (e.code !== "ENOENT") {
        throw e;
      }
    }

    try {
      await fs.ensureDir(dotWheelDir);
      await fs.writeJson(dotWheelConfig, { PBSPro: { submit: "user-qsub" } });

      const config = await loadWheelConfig("jobScheduler.json");
      expect(config.PBSPro.submit).to.equal("user-qsub");
    } finally {
      if (existed) {
        await fs.writeFile(dotWheelConfig, originalContent);
      } else {
        await fs.remove(dotWheelConfig);
      }
    }
  });

  /**
   * Run fn with a temporary ~/.wheel/server.json, restoring the previous state afterwards.
   * @param {object} data - JSON contents to write to ~/.wheel/server.json for the duration of fn
   * @param {()=>Promise<void>} fn - async test body
   * @returns {Promise<void>}
   */
  async function withDotWheelServerJson(data, fn) {
    const dotWheelDir = path.join(os.homedir(), ".wheel");
    const dotWheelConfig = path.join(dotWheelDir, "server.json");
    let existed = false;
    let originalContent;
    try {
      originalContent = await fs.readFile(dotWheelConfig, "utf-8");
      existed = true;
    } catch (e) {
      if (e.code !== "ENOENT") {
        throw e;
      }
    }
    try {
      await fs.ensureDir(dotWheelDir);
      await fs.writeJson(dotWheelConfig, data);
      await fn();
    } finally {
      if (existed) {
        await fs.writeFile(dotWheelConfig, originalContent);
      } else {
        await fs.remove(dotWheelConfig);
      }
    }
  }

  it("a non-empty WHEEL_* env var overrides ~/.wheel/server.json", async function () {
    await withDotWheelServerJson({ port: 5555 }, async function () {
      process.env.WHEEL_PORT = "39999";
      const config = await loadWheelConfig("server.json");
      expect(config.port).to.equal(39999);
    });
  });

  it("a non-empty WHEEL_* env var overrides WHEEL_CONFIG_DIR/server.json", async function () {
    const configDir = path.join(tmpDir, "envconfig");
    await writeJson(configDir, "server.json", { port: 6543 });
    process.env.WHEEL_CONFIG_DIR = configDir;
    process.env.WHEEL_PORT = "39999";

    const config = await loadWheelConfig("server.json");
    expect(config.port).to.equal(39999);
  });

  it("a falsy-but-non-empty WHEEL_* env var (0) still overrides a config file", async function () {
    await withDotWheelServerJson({ port: 5555 }, async function () {
      process.env.WHEEL_PORT = "0";
      const config = await loadWheelConfig("server.json");
      expect(config.port).to.equal(0);
    });
  });

  it("a blank WHEEL_* env var does not override WHEEL_CONFIG_DIR/server.json", async function () {
    const configDir = path.join(tmpDir, "envconfig");
    await writeJson(configDir, "server.json", { port: 6543 });
    process.env.WHEEL_CONFIG_DIR = configDir;
    process.env.WHEEL_PORT = "";

    const config = await loadWheelConfig("server.json");
    expect(config.port).to.equal(6543);
  });

  it("a whitespace-only WHEEL_* env var does not override ~/.wheel/server.json", async function () {
    await withDotWheelServerJson({ port: 5555 }, async function () {
      process.env.WHEEL_PORT = "   ";
      const config = await loadWheelConfig("server.json");
      expect(config.port).to.equal(5555);
    });
  });

  it("WHEEL_BASE_URL maps to config.baseURL (not baseUrl)", async function () {
    process.env.WHEEL_BASE_URL = "/node/host/39999/";
    const config = await loadWheelConfig("server.json");
    expect(config.baseURL).to.equal("/node/host/39999/");
    expect(config).to.not.have.property("baseUrl");
  });

  it("WHEEL_USE_HTTP / WHEEL_ENABLE_AUTH coerce to booleans and override defaults", async function () {
    process.env.WHEEL_USE_HTTP = "true";
    process.env.WHEEL_ENABLE_AUTH = "false";
    const config = await loadWheelConfig("server.json");
    expect(config.useHttp).to.equal(true);
    expect(config.enableAuth).to.equal(false);
  });
});

describe("coerce", function () {
  it("should return true for string 'true'", function () {
    expect(coerce("true")).to.equal(true);
  });
  it("should return false for string 'false'", function () {
    expect(coerce("false")).to.equal(false);
  });
  it("should return a number for a numeric string", function () {
    expect(coerce("8089")).to.equal(8089);
  });
  it("should return 0 for string '0'", function () {
    expect(coerce("0")).to.equal(0);
  });
  it("should return undefined for an empty string", function () {
    expect(coerce("")).to.be.undefined;
  });
  it("should return undefined for a whitespace-only string", function () {
    expect(coerce("   ")).to.be.undefined;
  });
  it("should return the original string for a non-boolean, non-numeric string", function () {
    expect(coerce("hello")).to.equal("hello");
  });
  it("should return a number for a string with leading/trailing spaces", function () {
    expect(coerce("  42  ")).to.equal(42);
  });
});
