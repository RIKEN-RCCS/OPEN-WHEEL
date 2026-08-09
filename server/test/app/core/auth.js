/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

import { expect } from "chai";
import sinon from "sinon";
import { initialize,
  getHashedPassword,
  addUser,
  getUserData,
  isValidUser,
  listUser,
  delUser,
  _internal } from "../../../app/core/auth.js";

describe("#initialize", ()=>{
  let openStub;
  let dbMock;

  beforeEach(()=>{
    dbMock = {
      exec: sinon.stub().resolves()
    };
    openStub = sinon.stub(_internal, "open").resolves(dbMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should open the database, create the table, set initialized to true, and return db", async ()=>{
    const result = await initialize();

    expect(openStub.calledOnce).to.be.true;
    const initSQL = `CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY,
  username TEXT UNIQUE,
  hashed_password BLOB,
  salt BLOB)`;
    expect(dbMock.exec.calledWith(initSQL)).to.be.true;
    expect(_internal.initialized).to.be.true;
    expect(result).to.equal(dbMock);
  });
});

describe("#getHashedPassword", ()=>{
  let pbkdf2Stub;

  beforeEach(()=>{
    pbkdf2Stub = sinon.stub(_internal.crypto, "pbkdf2");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return a Buffer with hashed password if pbkdf2 succeeds", async ()=>{
    pbkdf2Stub.callsFake((password, salt, iterations, keylen, digest, callback)=>{
      callback(null, Buffer.from("fake hashed password"));
    });

    const password = "testPassword";
    const salt = "testSalt";

    const result = await getHashedPassword(password, salt);

    expect(pbkdf2Stub.calledOnce).to.be.true;
    expect(result).to.be.instanceOf(Buffer);
    expect(result.toString()).to.equal("fake hashed password");
  });

  it("should throw an error if pbkdf2 fails", async ()=>{
    pbkdf2Stub.callsFake((password, salt, iterations, keylen, digest, callback)=>{
      callback(new Error("pbkdf2 error"));
    });

    const password = "testPassword";
    const salt = "testSalt";

    try {
      await getHashedPassword(password, salt);
      expect.fail("Expected getHashedPassword to throw an error, but it did not");
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.equal("pbkdf2 error");
    }
  });
});

describe("#addUser", ()=>{
  let initializeStub;
  let getUserDataStub;
  let randomUUIDStub;
  let randomBytesStub;
  let getHashedPasswordStub;
  let dbRunStub;

  beforeEach(()=>{
    dbRunStub = sinon.stub();
    const dbMock = {
      run: dbRunStub
    };
    sinon.stub(_internal, "db").value(dbMock);
    sinon.stub(_internal, "open").resolves(dbMock);
    initializeStub = sinon.stub(_internal, "initialize");
    getUserDataStub = sinon.stub(_internal, "getUserData");
    randomUUIDStub = sinon.stub(_internal.crypto, "randomUUID");
    randomBytesStub = sinon.stub(_internal.crypto, "randomBytes");
    getHashedPasswordStub = sinon.stub(_internal, "getHashedPassword");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should initialize if not initialized, then insert user if the user does not exist", async ()=>{
    _internal.initialized = false;
    initializeStub.resolves();
    getUserDataStub.resolves(null);
    randomUUIDStub.returns("unique-id-123");
    randomBytesStub.returns(Buffer.from("salt123"));
    getHashedPasswordStub.resolves(Buffer.from("hashed123"));
    dbRunStub.resolves();

    await addUser("john", "secret");

    expect(initializeStub.calledOnce).to.be.true;
    expect(getUserDataStub.calledOnceWithExactly("john")).to.be.true;
    expect(randomUUIDStub.calledOnce).to.be.true;
    expect(randomBytesStub.calledOnceWithExactly(16)).to.be.true;
    expect(getHashedPasswordStub.calledOnceWithExactly("secret", Buffer.from("salt123"))).to.be.true;
    expect(dbRunStub.calledOnce).to.be.true;

    const [sql, id, username, hashedPw, salt] = dbRunStub.firstCall.args;
    expect(sql).to.include("INSERT OR IGNORE INTO users");
    expect(id).to.equal("unique-id-123");
    expect(username).to.equal("john");
    expect(hashedPw).to.deep.equal(Buffer.from("hashed123"));
    expect(salt).to.deep.equal(Buffer.from("salt123"));
  });

  it("should skip initialize if already initialized is true and user does not exist", async ()=>{
    _internal.initialized = true;
    initializeStub.resolves();
    getUserDataStub.resolves(null);
    randomUUIDStub.returns("unique-id-abc");
    randomBytesStub.returns(Buffer.from("saltABC"));
    getHashedPasswordStub.resolves(Buffer.from("hashedABC"));
    dbRunStub.resolves();

    await addUser("alice", "mypassword");

    expect(initializeStub.notCalled).to.be.true;
    expect(getUserDataStub.calledOnceWithExactly("alice")).to.be.true;
    expect(randomUUIDStub.calledOnce).to.be.true;
    expect(randomBytesStub.calledOnce).to.be.true;
    expect(getHashedPasswordStub.calledOnce).to.be.true;
    expect(dbRunStub.calledOnce).to.be.true;
  });

  it("should throw an error if user already exists", async ()=>{
    _internal.initialized = false;
    initializeStub.resolves();
    getUserDataStub.resolves({ username: "bob" });

    try {
      await addUser("bob", "secret2");
      expect.fail("Expected addUser to throw an error, but it did not");
    } catch (err) {
      expect(err.message).to.equal("user already exists");
      expect(err).to.have.property("username", "bob");
    }

    expect(initializeStub.calledOnce).to.be.true;
    expect(dbRunStub.notCalled).to.be.true;
  });
});

describe("#getUserData", ()=>{
  let dbGetStub;

  beforeEach(()=>{
    dbGetStub = sinon.stub();
    const dbMock = {
      get: dbGetStub
    };
    sinon.stub(_internal, "db").value(dbMock);
  });

  it("should return null if user does not exist in DB", async ()=>{
    dbGetStub.resolves(undefined);

    const result = await getUserData("nonexistentUser");
    expect(result).to.be.null;
    expect(dbGetStub.calledOnceWithExactly(
      "SELECT * FROM users WHERE username = ?",
      "nonexistentUser"
    )).to.be.true;
  });

  it("should return null if DB row exists but row.username does not match", async ()=>{
    dbGetStub.resolves({
      username: "anotherUser",
      hashed_password: Buffer.from("someHash"),
      salt: Buffer.from("someSalt"),
      id: "userID999"
    });

    const result = await getUserData("testUser");
    expect(result).to.be.null;
  });

  it("should return the row if DB row exists and row.username matches", async ()=>{
    const fakeRow = {
      username: "testUser",
      hashed_password: Buffer.from("someHash"),
      salt: Buffer.from("someSalt"),
      id: "userID123"
    };
    dbGetStub.resolves(fakeRow);

    const result = await getUserData("testUser");
    expect(result).to.deep.equal(fakeRow);
  });
});

describe("#isValidUser", ()=>{
  let initializeStub;
  let getUserDataStub;
  let getHashedPasswordStub;
  let loggerTraceStub;
  let timingSafeEqualStub;

  beforeEach(()=>{
    initializeStub = sinon.stub(_internal, "initialize");
    getUserDataStub = sinon.stub(_internal, "getUserData");
    getHashedPasswordStub = sinon.stub(_internal, "getHashedPassword");
    loggerTraceStub = sinon.stub(_internal.logger, "trace");
    timingSafeEqualStub = sinon.stub(_internal.crypto, "timingSafeEqual");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should call initialize if not initialized", async ()=>{
    _internal.initialized = false;
    getUserDataStub.resolves(null);

    const result = await isValidUser("testUser", "testPassword");

    expect(initializeStub.calledOnce).to.be.true;
    expect(result).to.be.false;
    expect(loggerTraceStub.calledWith("user: testUser not found")).to.be.true;
  });

  it("should return false if user does not exist", async ()=>{
    _internal.initialized = true;
    getUserDataStub.resolves(null);

    const result = await isValidUser("notExisting", "somePassword");
    expect(result).to.be.false;
    expect(loggerTraceStub.calledWith("user: notExisting not found")).to.be.true;
  });

  it("should return false if password is wrong", async ()=>{
    _internal.initialized = true;
    getUserDataStub.resolves({
      username: "someUser",
      hashed_password: Buffer.from("correctHash"),
      salt: Buffer.from("saltValue")
    });
    getHashedPasswordStub.resolves(Buffer.from("wrongHash"));
    timingSafeEqualStub.returns(false);

    const result = await isValidUser("someUser", "badPassword");

    expect(getHashedPasswordStub.calledOnceWithExactly("badPassword", Buffer.from("saltValue"))).to.be.true;
    expect(timingSafeEqualStub.calledOnce).to.be.true;
    expect(result).to.be.false;
    expect(loggerTraceStub.calledWith("wrong password")).to.be.true;
  });

  it("should return the user row if password is correct", async ()=>{
    _internal.initialized = true;
    const userRow = {
      username: "someUser",
      hashed_password: Buffer.from("correctHash"),
      salt: Buffer.from("saltValue")
    };
    getUserDataStub.resolves(userRow);
    getHashedPasswordStub.resolves(Buffer.from("correctHash"));
    timingSafeEqualStub.returns(true);

    const result = await isValidUser("someUser", "correctPassword");

    expect(getHashedPasswordStub.calledOnceWithExactly("correctPassword", Buffer.from("saltValue"))).to.be.true;
    expect(timingSafeEqualStub.calledOnce).to.be.true;
    expect(result).to.equal(userRow);
    expect(loggerTraceStub.notCalled).to.be.true;
  });
});

describe("#listUser", ()=>{
  let dbAllStub;
  let initializeStub;

  beforeEach(()=>{
    dbAllStub = sinon.stub().resolves([]);
    sinon.stub(_internal, "db").value({ all: dbAllStub });
    initializeStub = sinon.stub(_internal, "initialize");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should call initialize if not yet initialized (db is not ready yet)", async ()=>{
    _internal.initialized = false;

    const result = await listUser();

    expect(initializeStub.calledOnce).to.be.true;
    expect(dbAllStub.calledOnce).to.be.true;
    expect(result).to.be.an("array").that.is.empty;
  });

  it("should not call initialize if already initialized", async ()=>{
    _internal.initialized = true;

    const result = await listUser();

    expect(initializeStub.notCalled).to.be.true;
    expect(dbAllStub.calledOnce).to.be.true;
    expect(result).to.be.an("array").that.is.empty;
  });

  it("should return empty array if db has no users", async ()=>{
    const result = await listUser();

    expect(result).to.deep.equal([]);
  });

  it("should return array of usernames if db has data", async ()=>{
    dbAllStub.resolves([
      { username: "Alice" },
      { username: "Bob" }
    ]);

    const result = await listUser();

    expect(result).to.deep.equal(["Alice", "Bob"]);
  });
});

describe("#delUser", ()=>{
  let dbRunStub;
  let initializeStub;

  beforeEach(()=>{
    initializeStub = sinon.stub(_internal, "initialize");
    dbRunStub = sinon.stub();
    const dbMock = {
      run: dbRunStub
    };
    sinon.stub(_internal, "db").value(dbMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should call initialize if not initialized", async ()=>{
    _internal.initialized = false;
    dbRunStub.resolves({ changes: 1 });

    await delUser("testUserA");

    expect(initializeStub.calledOnce).to.be.true;
    expect(dbRunStub.calledOnceWithExactly(
      "DELETE FROM users WHERE username = 'testUserA'"
    )).to.be.true;
  });

  it("should not call initialize if already initialized", async ()=>{
    _internal.initialized = true;
    dbRunStub.resolves({ changes: 1 });

    await delUser("testUserB");

    expect(initializeStub.notCalled).to.be.true;
    expect(dbRunStub.calledOnceWithExactly(
      "DELETE FROM users WHERE username = 'testUserB'"
    )).to.be.true;
  });

  it("should return statement object if user exists (changes=1)", async ()=>{
    const statement = { changes: 1 };
    dbRunStub.resolves(statement);

    const result = await delUser("existingUser");
    expect(result).to.equal(statement);
  });

  it("should return statement object if user does not exist (changes=0)", async ()=>{
    const statement = { changes: 0 };
    dbRunStub.resolves(statement);

    const result = await delUser("nonExistingUser");
    expect(result).to.equal(statement);
  });
});
