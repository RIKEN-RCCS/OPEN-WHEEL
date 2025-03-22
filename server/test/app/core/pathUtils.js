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
const path = require("path");

//testee
const { sanitizePath } = require("../../../app/core/pathUtils.js");
const { replacePathsep } = require("../../../app/core/pathUtils.js");
const { convertPathSep } = require("../../../app/core/pathUtils.js");

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
  describe("#replacePathsep", ()=>{
    it("replaces backslashes with forward slashes in Windows-style paths", ()=>{
      expect(replacePathsep("C:\\Users\\Admin\\file.txt")).to.equal("C:/Users/Admin/file.txt");
      expect(replacePathsep("C:\\Program Files\\MyApp\\app.exe")).to.equal("C:/Program Files/MyApp/app.exe");
    });
    it("does not modify already POSIX-style paths", ()=>{
      expect(replacePathsep("/home/user/file.txt")).to.equal("/home/user/file.txt");
      expect(replacePathsep("/var/log/syslog")).to.equal("/var/log/syslog");
    });
    it("converts only backslashes, keeping existing forward slashes", ()=>{
      expect(replacePathsep("C:\\Users/Admin\\Documents")).to.equal("C:/Users/Admin/Documents");
      expect(replacePathsep("/mnt\\shared\\folder")).to.equal("/mnt/shared/folder");
    });
    it("returns the original string if there are no backslashes", ()=>{
      expect(replacePathsep("no_backslashes_here")).to.equal("no_backslashes_here");
      expect(replacePathsep("just/a/normal/path")).to.equal("just/a/normal/path");
    });
    it("throws an error when input is not a string", ()=>{
      expect(()=>replacePathsep(null)).to.throw();
      expect(()=>replacePathsep(undefined)).to.throw();
      expect(()=>replacePathsep(123)).to.throw();
      expect(()=>replacePathsep({})).to.throw();
    });
  });
  describe("#convertPathSep", ()=>{
    if (path.sep === "\\") {
      it("converts POSIX-style paths to Windows-style paths on Windows", ()=>{
        expect(convertPathSep("C:/Users/Admin/file.txt")).to.equal("C:\\Users\\Admin\\file.txt");
        expect(convertPathSep("/home/user/docs")).to.equal("\\home\\user\\docs");
      });
      it("does not modify already Windows-style paths", ()=>{
        expect(convertPathSep("C:\\Users\\Admin\\file.txt")).to.equal("C:\\Users\\Admin\\file.txt");
        expect(convertPathSep("D:\\Games\\Steam")).to.equal("D:\\Games\\Steam");
      });
    }
    if (path.sep === "/") {
      it("converts Windows-style paths to POSIX-style paths on Unix", ()=>{
        expect(convertPathSep("C:\\Users\\Admin\\file.txt")).to.equal("C:/Users/Admin/file.txt");
        expect(convertPathSep("D:\\Projects\\Code")).to.equal("D:/Projects/Code");
      });
      it("does not modify already POSIX-style paths", ()=>{
        expect(convertPathSep("/home/user/docs")).to.equal("/home/user/docs");
        expect(convertPathSep("/var/log/syslog")).to.equal("/var/log/syslog");
      });
    }
    it("handles mixed separators correctly", ()=>{
      if (path.sep === "\\") {
        expect(convertPathSep("C:\\Users/Admin\\Documents")).to.equal("C:\\Users\\Admin\\Documents");
      } else {
        expect(convertPathSep("C:\\Users/Admin\\Documents")).to.equal("C:/Users/Admin/Documents");
      }
    });
    it("returns the original string if there are no path separators", ()=>{
      expect(convertPathSep("no_separators_here")).to.equal("no_separators_here");
      expect(convertPathSep("just_a_filename.txt")).to.equal("just_a_filename.txt");
    });
    it("throws an error when input is not a string", ()=>{
      expect(()=>convertPathSep(null)).to.throw();
      expect(()=>convertPathSep(undefined)).to.throw();
      expect(()=>convertPathSep(123)).to.throw();
      expect(()=>convertPathSep({})).to.throw();
    });
  });
});
