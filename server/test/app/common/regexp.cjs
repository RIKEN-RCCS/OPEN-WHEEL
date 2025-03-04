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
const { isValidName } = require("../../../../common/regexp.cjs");

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
  describe("#isValidInputFilename", () => {
    it("should return false for empty string", () => {
        expect(isValidInputFilename("")).to.be.false;
    });
    it("should return false for only whitespace", () => {
        expect(isValidInputFilename("   ")).to.be.false;
    });
    it("should return false for reserved names in Windows", () => {
        expect(isValidInputFilename("CON.txt")).to.be.false;
        expect(isValidInputFilename("PRN.txt")).to.be.false;
        expect(isValidInputFilename("AUX.txt")).to.be.false;
    });
    it("should return false for invalid characters", () => {
        expect(isValidInputFilename("invalid|name.txt")).to.be.false;
        expect(isValidInputFilename("invalid<name>.txt")).to.be.false;
    });
    it("should return true for valid filenames", () => {
        expect(isValidInputFilename("valid_name.txt")).to.be.true;
        expect(isValidInputFilename("valid-name_123.txt")).to.be.true;
        expect(isValidInputFilename("valid.name.txt")).to.be.true;
    });
    it("should return true for valid filenames with path separators", () => {
        expect(isValidInputFilename("dir/valid_name.txt")).to.be.true;
        expect(isValidInputFilename("dir\\valid_name.txt")).to.be.true;
    });
    it("should return false for invalid path separators", () => {
        expect(isValidInputFilename("dir\\invalid|name.txt")).to.be.false;
    });
    it("should return true for filenames with {{ and }}", () => {
        expect(isValidInputFilename("file_{{var}}.txt")).to.be.true;
    });
    it("should return false for filenames with forbidden characters after removing {{ }}", () => {
        expect(isValidInputFilename("file_{{var}}|.txt")).to.be.false;
    });
    it("should return true for filenames with dots and extensions", () => {
        expect(isValidInputFilename("file.name.with.dots.txt")).to.be.true;
    });
    it("should return true for filenames with nested paths", () => {
        expect(isValidInputFilename("folder/subfolder/file.txt")).to.be.true;
    });
  });
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
    it("should return false for invalid path separators", () => {
        expect(isValidOutputFilename("dir\\invalid|name.txt")).to.be.false;
    });
    it("should return true for filenames with {{ and }}", () => {
        expect(isValidOutputFilename("file_{{var}}.txt")).to.be.true;
    });
    it("should return false for filenames with forbidden characters after removing {{ }}", () => {
        expect(isValidOutputFilename("file_{{var}}|.txt")).to.be.false;
    });
    it("should return true for filenames with dots and extensions", () => {
        expect(isValidOutputFilename("file.name.with.dots.txt")).to.be.true;
    });
    it("should return true for filenames with nested paths", () => {
        expect(isValidOutputFilename("folder/subfolder/file.txt")).to.be.true;
    });
    it("should allow meta characters in filenames", () => {
        expect(isValidOutputFilename("file*?.txt")).to.be.true;
        expect(isValidOutputFilename("file[1-3].txt")).to.be.true;
    });
  });
  describe("#isValidName", () => {
    it("should return false for empty string", () => {
        expect(isValidName("")).to.be.false;
    });
    it("should return false for only whitespace", () => {
        expect(isValidName("   ")).to.be.false;
    });
    it("should return true for reserved names in Windows(dosen't have suffix)", () => {
        expect(isValidName("CON")).to.be.true;
        expect(isValidName("PRN")).to.be.true;
        expect(isValidName("AUX")).to.be.true;
    });
    it("should return false for names with invalid characters", () => {
        expect(isValidName("invalid|name")).to.be.false;
        expect(isValidName("invalid<name>")).to.be.false;
        expect(isValidName("invalid/name")).to.be.false;
        expect(isValidName("invalid\\name")).to.be.false;
    });
    it("should return true for valid alphanumeric names", () => {
        expect(isValidName("validName")).to.be.true;
        expect(isValidName("valid123")).to.be.true;
    });
    it("should return true for names with underscores and hyphens", () => {
        expect(isValidName("valid_name")).to.be.true;
        expect(isValidName("valid-name")).to.be.true;
    });
    it("should return false for names with spaces", () => {
        expect(isValidName("invalid name")).to.be.false;
    });
    it("should return false for names starting with invalid characters", () => {
        expect(isValidName("-invalid")).to.be.true;
        expect(isValidName("_invalid")).to.be.true;
    });
    it("should return false for names ending with invalid characters", () => {
        expect(isValidName("invalid-")).to.be.true;
        expect(isValidName("invalid_")).to.be.true;
    });
    it("should return false for names containing dots", () => {
        expect(isValidName("invalid.name")).to.be.false;
    });
    it("should return false for names containing special characters", () => {
        expect(isValidName("name@domain")).to.be.false;
        expect(isValidName("name#domain")).to.be.false;
    });
  });
});
