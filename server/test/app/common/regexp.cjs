/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

//setup test framework
const { expect } = require("chai");

//testee
const { isValidOutputFilename } = require("../../../../common/regexp.cjs");
const { isValidInputFilename } = require("../../../../common/regexp.cjs");

describe("UT for regexp class", () => {
  describe("#isValidOutputFilename", () => {
      it("should return false for empty string", () => {
          expect(isValidOutputFilename("")).to.be.false;
      });
      it("should return false for only whitespace", () => {
          expect(isValidOutputFilename("   ")).to.be.false;
      });
      it("should return false for reserved names in Windows", () => {
          expect(isValidOutputFilename("CON.txt")).to.be.false;
          expect(isValidOutputFilename("PRN.txt")).to.be.false;
          expect(isValidOutputFilename("AUX.txt")).to.be.false;
      });
      it("should return false for invalid characters", () => {
          expect(isValidOutputFilename("invalid|name.txt")).to.be.false;
          expect(isValidOutputFilename("invalid<name>.txt")).to.be.false;
      });
      it("should return true for valid filenames", () => {
          expect(isValidOutputFilename("valid_name.txt")).to.be.true;
          expect(isValidOutputFilename("valid-name_123.txt")).to.be.true;
          expect(isValidOutputFilename("valid.name.txt")).to.be.true;
      });
      it("should return true for valid filenames with path separators", () => {
          expect(isValidOutputFilename("dir/valid_name.txt")).to.be.true;
          expect(isValidOutputFilename("dir\\valid_name.txt")).to.be.true;
      });
      it("should return true for valid filenames with meta characters", () => {
          expect(isValidOutputFilename("file*name?.txt")).to.be.true;
          expect(isValidOutputFilename("file[1-9].txt")).to.be.true;
      });
      it("should return true for filenames with {{ and }}", () => {
          expect(isValidOutputFilename("file_{{var}}.txt")).to.be.true;
      });
      it("should return false for filenames with forbidden characters after removing {{ }}", () => {
          expect(isValidOutputFilename("file_{{var}}|.txt")).to.be.false;
      });
  });
});
