/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import path from "path";
import fs from "fs-extra";
import { expect } from "chai";
import tmp from "tmp-promise";

describe("commandCheck", ()=>{
  let checkAllCommands;
  let commands;
  let testConfigDir;
  //eslint-disable-next-line no-unused-vars
  let originalNodeEnv;
  let originalWheelConfigDir;

  before(async ()=>{
    //Create a temporary directory for test configuration
    const tmpDir = await tmp.dir({ unsafeCleanup: true });
    testConfigDir = tmpDir.path;

    //Save original WHEEL_CONFIG_DIR
    originalWheelConfigDir = process.env.WHEEL_CONFIG_DIR;

    //Set WHEEL_CONFIG_DIR to our test directory
    process.env.WHEEL_CONFIG_DIR = testConfigDir;

    //for db.js - create config files in test directory
    await fs.writeJson(path.resolve(testConfigDir, "remotehost.json"), []);
    await fs.writeJson(path.resolve(testConfigDir, "server.json"), {});
    await fs.writeJson(path.resolve(testConfigDir, "jobScheduler.json"), {});
    await fs.writeJson(path.resolve(testConfigDir, "jobScriptTemplate.json"), []);
    await fs.writeJson(path.resolve(testConfigDir, "projectList.json"), []);
    await fs.writeJson(path.resolve(testConfigDir, "credentials.json"), {});
    await fs.writeFile(path.resolve(testConfigDir, "server.key"), "dummy key");
    await fs.writeFile(path.resolve(testConfigDir, "server.crt"), "dummy crt");

    const checkAllCommandsModule = await import("../../../app/core/commandCheck.js");
    checkAllCommands = checkAllCommandsModule.default;
    commands = checkAllCommandsModule._internal.commands;
  });

  after(async ()=>{
    //Restore original WHEEL_CONFIG_DIR
    if (originalWheelConfigDir === undefined) {
      delete process.env.WHEEL_CONFIG_DIR;
    } else {
      process.env.WHEEL_CONFIG_DIR = originalWheelConfigDir;
    }

    //Clean up test config directory
    await fs.remove(testConfigDir);
  });

  describe("checkAllCommands", ()=>{
    let orgPath;
    let tmpdir;

    beforeEach(async ()=>{
      tmpdir = await tmp.dir({ unsafeCleanup: true });
      orgPath = process.env.PATH;
      process.env.PATH = tmpdir.path;
    });

    afterEach(async ()=>{
      process.env.PATH = orgPath;
      await tmpdir.cleanup();
    });

    it("should be true if all commands are available", async ()=>{
      await Promise.all(
        commands.map(async (command)=>{
          const dummyCommand = path.resolve(tmpdir.path, command);
          await fs.writeFile(dummyCommand, "#!/bin/sh\nexit 0");
          await fs.chmod(dummyCommand, "755");
        })
      );
      const result = await checkAllCommands();
      expect(result).to.be.true;
    });

    it("should be false if some command is not available", async ()=>{
      const partialCommands = commands.slice(0, 2);
      await Promise.all(
        partialCommands.map(async (command)=>{
          const dummyCommand = path.resolve(tmpdir.path, command);
          await fs.writeFile(dummyCommand, "#!/bin/sh\nexit 0");
          await fs.chmod(dummyCommand, "755");
        })
      );
      const result = await checkAllCommands();
      expect(result).to.be.false;
    });
  });
});
