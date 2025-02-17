/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

//setup test framework
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-fs"));

//testee
const { sanitizePath } = require("../../app/core/pathUtils.js");

describe("UT for pathUtils class", function () {
  describe("#sanitizePath", ()=>{
    it("replaces special characters with the default replacer (_)", ()=>{
      expect(sanitizePath("test/path?name=sample*file.txt")).to.equal("test_path_name_sample_file_txt");
      expect(sanitizePath("C:\\Users\\Admin\\file?.txt")).to.equal("C:_Users_Admin_file__txt");
    });
    it("allows custom replacer instead of _", ()=>{
      expect(sanitizePath("test/path?name=sample*file.txt", "-")).to.equal("test-path-name-sample-file-txt");
      expect(sanitizePath("C:\\Users\\Admin\\file?.txt", "+")).to.equal("C:+Users+Admin+file++txt");
    });
    it("replaces Win32 reserved names with replacer", ()=>{
      expect(sanitizePath("CON")).to.equal("CON"); //拡張子の無いwin32予約名は変換されない
      expect(sanitizePath("AUX.txt")).to.equal("AUX_txt"); //拡張子があっても、先に.が変換されるので拡張子無しと同様、変換できない
      expect(sanitizePath("NUL.txt", ".")).to.equal(""); //win32予約名かつ第二引数に.を渡す場合、endsWith変換で全て消失
    });
    it("removes trailing replacer", ()=>{
      expect(sanitizePath("test/path?", "-")).to.equal("test-path");
      expect(sanitizePath("sample*", "_")).to.equal("sample");
      expect(sanitizePath("file?.txt", "_")).to.equal("file__txt");
    });
    it("does not modify already safe paths", ()=>{
      expect(sanitizePath("valid_filename.txt")).to.equal("valid_filename_txt");
      expect(sanitizePath("folder/subfolder/file")).to.equal("folder_subfolder_file");
    });
    it("throws an error when target is not a string", ()=>{
      expect(()=>sanitizePath(null)).to.throw();
      expect(()=>sanitizePath(undefined)).to.throw();
    });
  });
});
