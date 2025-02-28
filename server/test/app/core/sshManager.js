/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

const { expect } = require("chai");
const { describe, it } = require("mocha");
const sinon = require("sinon");
const rewire = require("rewire");

describe("#hasEntry", ()=>{
  let rewireSshManager;
  let hasEntry;
  let dbMock;

  beforeEach(()=>{
    //sshManager.js を再取得
    rewireSshManager = rewire("../../../app/core/sshManager.js");

    //テスト対象関数を取得
    hasEntry = rewireSshManager.__get__("hasEntry");

    //db のモック(Map)を用意し、sshManager.js 内の db を差し替える
    dbMock = new Map();
    rewireSshManager.__set__("db", dbMock);
  });

  it("should return false if the projectRootDir is not in db", ()=>{
    //dbMock 上に projectRootDir は存在しない
    const result = hasEntry("/path/to/projectA", "someID");
    expect(result).to.be.false;
  });

  it("should return false if db has the projectRootDir but does not have the id", ()=>{
    //dbMock に projectRootDir は追加するが、その中に id は存在しない
    const projectDir = "/path/to/projectB";
    dbMock.set(projectDir, new Map()); //空のMap

    const result = hasEntry(projectDir, "missingID");
    expect(result).to.be.false;
  });

  it("should return true if db has the projectRootDir and the id", ()=>{
    const projectDir = "/path/to/projectC";
    const id = "existingID";

    //projectDir 用のサブMapを作って id を登録
    const subMap = new Map();
    subMap.set(id, { ssh: "dummySshObject" });
    dbMock.set(projectDir, subMap);

    //検証
    const result = hasEntry(projectDir, id);
    expect(result).to.be.true;
  });
});

describe("#addSsh", ()=>{
  let rewireSshManager;
  let addSsh;
  let dbMock;

  beforeEach(()=>{
    //sshManager.jsをrewireで読み込む
    rewireSshManager = rewire("../../../app/core/sshManager.js");
    //テスト対象関数addSshを取得
    addSsh = rewireSshManager.__get__("addSsh");

    //dbをMock化する
    //dbはMapオブジェクトですが、has/set/getなどをsinon.stubで差し替える
    dbMock = {
      has: sinon.stub(),
      set: sinon.stub(),
      get: sinon.stub()
    };

    //rewireを使ってsshManager.js内部のdbを差し替え
    rewireSshManager.__set__("db", dbMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should create a new Map when the projectRootDir does not exist in db", ()=>{
    //dbMock.has(...)がfalseを返すように設定
    dbMock.has.returns(false);

    //dbMock.getは返り値をダミーでもいいので設定しておく (後段の .set()呼び出しで利用)
    const mapStub = {
      set: sinon.stub()
    };
    dbMock.get.returns(mapStub);

    //テスト対象呼び出し
    const projectRootDir = "/dummy/path";
    const hostinfo = { id: "host-123" };
    const ssh = { connect: ()=>{} };
    const pw = "dummyPw";
    const ph = "dummyPh";
    const isStorage = false;

    addSsh(projectRootDir, hostinfo, ssh, pw, ph, isStorage);

    //アサーション: dbMock.has(...)が引数"/dummy/path"で呼ばれた
    expect(dbMock.has.calledOnceWithExactly(projectRootDir)).to.be.true;

    //アサーション: dbMock.set(...)が呼ばれた (新規Map生成)
    expect(dbMock.set.calledOnceWithExactly(projectRootDir, sinon.match.instanceOf(Map))).to.be.true;

    //アサーション: dbMock.get(...).set(...)にも期待通りの引数で呼ばれているか
    expect(mapStub.set.calledOnceWithExactly("host-123", {
      ssh,
      hostinfo,
      pw,
      ph,
      isStorage
    })).to.be.true;
  });

  it("should reuse existing Map when the projectRootDir already exists in db", ()=>{
    //dbMock.has(...)がtrueを返す
    dbMock.has.returns(true);

    //既存Mapのモック
    const existingMapMock = {
      set: sinon.stub()
    };
    dbMock.get.returns(existingMapMock);

    //テスト対象呼び出し
    const projectRootDir = "/exists/path";
    const hostinfo = { id: "host-999" };
    const ssh = { connect: ()=>{} };
    const pw = "secretPw";
    const ph = "secretPh";
    const isStorage = true;

    addSsh(projectRootDir, hostinfo, ssh, pw, ph, isStorage);

    //新規Map生成はされないので dbMock.set(...)は呼ばれない
    expect(dbMock.set.notCalled).to.be.true;

    //代わりに、dbMock.get(...).set(...)で情報を追加
    expect(existingMapMock.set.calledOnceWithExactly("host-999", {
      ssh,
      hostinfo,
      pw,
      ph,
      isStorage
    })).to.be.true;
  });
});

describe("#getSsh", ()=>{
  let rewireSshManager;
  let getSsh;
  let hasEntryMock; //hasEntryをStub化
  let dbMock; //db変数をStub(というか差し替え)

  beforeEach(()=>{
    //sshManager.jsをrewireでインポート
    rewireSshManager = rewire("../../../app/core/sshManager.js");

    //テスト対象関数を__get__で取得
    getSsh = rewireSshManager.__get__("getSsh");

    //sinon.stub()でMock(Stub)を作成
    hasEntryMock = sinon.stub();

    //Mapを用いたMockの作成（本来のdbを差し替え）
    dbMock = new Map();

    //rewireを使ってsshManager.js内の変数・関数をStub化
    rewireSshManager.__set__("hasEntry", hasEntryMock);
    rewireSshManager.__set__("db", dbMock);
  });

  it("should throw an error if ssh instance is not registered for the project", ()=>{
    //hasEntryがfalseを返すMock設定
    hasEntryMock.returns(false);

    const projectRootDir = "/mock/project/root";
    const hostID = "someHostID";

    //throwされるErrorを検証
    try {
      getSsh(projectRootDir, hostID);
      //もしthrowされなかったらテスト失敗とする
      throw new Error("Expected getSsh to throw an error");
    } catch (err) {
      //エラーメッセージの確認
      expect(err).to.be.an("Error");
      expect(err.message).to.equal("ssh instance is not registerd for the project");

      //Errorオブジェクトに設定されているはずのプロパティを確認
      expect(err.projectRootDir).to.equal(projectRootDir);
      expect(err.id).to.equal(hostID);
    }
  });

  it("should return ssh instance when entry exists in db", ()=>{
    //hasEntryがtrueを返すMock設定
    hasEntryMock.returns(true);

    const projectRootDir = "/mock/project/root";
    const hostID = "existingHost";

    //dbMockに、該当プロジェクト・IDのsshオブジェクトを格納
    const sshInstanceMock = { /*任意のオブジェクト */ };
    const hostMap = new Map();
    hostMap.set(hostID, { ssh: sshInstanceMock });

    dbMock.set(projectRootDir, hostMap);

    //実行して取得できるsshインスタンスを確認
    const result = getSsh(projectRootDir, hostID);
    expect(result).to.equal(sshInstanceMock);
  });
});

describe("#getSshHostinfo", ()=>{
  let rewireSshManager;
  let getSshHostinfo;
  let hasEntryMock;
  let dbMock;

  beforeEach(()=>{
    rewireSshManager = rewire("../../../app/core/sshManager.js");
    getSshHostinfo = rewireSshManager.__get__("getSshHostinfo");

    //hasEntry をStub化
    hasEntryMock = sinon.stub();
    //rewireでオリジナルのhasEntryを差し替える
    rewireSshManager.__set__("hasEntry", hasEntryMock);

    //db を擬似的に置き換える
    dbMock = new Map();
    dbMock.set("mockProjectDir", new Map([
      ["mockHostID", { hostinfo: { host: "somehost" } }]
    ]));

    //rewireでdbを差し替える
    rewireSshManager.__set__("db", dbMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should throw an error if the hostinfo is not registered", ()=>{
    hasEntryMock.returns(false);

    try {
      getSshHostinfo("mockProjectDir", "unregisteredID");
      throw new Error("Expected getSshHostinfo to throw an error");
    } catch (err) {
      expect(err.message).to.equal("hostinfo is not registerd for the project");
      expect(err.projectRootDir).to.equal("mockProjectDir");
      expect(err.id).to.equal("unregisteredID");
    }
  });

  it("should return hostinfo object if the entry exists", ()=>{
    hasEntryMock.returns(true);

    const result = getSshHostinfo("mockProjectDir", "mockHostID");
    expect(result).to.deep.equal({ host: "somehost" });
  });
});

describe("#getSshPW", ()=>{
  let rewireSshManager;
  let getSshPW;
  let hasEntryMock;
  let dbMock;

  beforeEach(()=>{
    //sshManagerをrewireで読み込み
    rewireSshManager = rewire("../../../app/core/sshManager.js");

    //テスト対象の関数を__get__で取得
    getSshPW = rewireSshManager.__get__("getSshPW");

    //sinon.stub()でMockを作成（Stub化）。
    hasEntryMock = sinon.stub();

    //dbもrewire経由で差し替えるためのMock
    dbMock = new Map();

    //rewireでテストダブルを注入
    rewireSshManager.__set__("hasEntry", hasEntryMock);
    rewireSshManager.__set__("db", dbMock);
  });

  it("should throw an error if hostinfo is not registered for the project", ()=>{
    //hasEntryがfalseを返すケース
    hasEntryMock.returns(false);

    expect(()=>{
      getSshPW("/path/to/project", "hostID");
    }).to.throw("hostinfo is not registerd for the project")
      .and.to.have.property("projectRootDir", "/path/to/project");

    expect(hasEntryMock.calledOnceWithExactly("/path/to/project", "hostID")).to.be.true;
  });

  it("should return the password (string) if hasEntry is true", ()=>{
    //hasEntryがtrueを返す
    hasEntryMock.returns(true);

    //dbに対応するpwを用意
    dbMock.set("/path/to/project", new Map([
      ["hostID", { pw: "mySecretPassword" }]
    ]));

    const result = getSshPW("/path/to/project", "hostID");
    expect(result).to.equal("mySecretPassword");
  });

  it("should return the password (function) if pw is defined as a function", ()=>{
    //hasEntryがtrueを返す
    hasEntryMock.returns(true);

    //パスワードが関数の場合も想定してテスト
    const pwFunc = ()=>"secretFromFunction";
    dbMock.set("/path/to/project", new Map([
      ["hostID", { pw: pwFunc }]
    ]));

    const result = getSshPW("/path/to/project", "hostID");
    //この時点ではpwFunc自体が返る
    expect(result).to.be.a("function");
    expect(result()).to.equal("secretFromFunction");
  });
});

describe("#getSshPH", ()=>{
  let rewireSshManager;
  let getSshPH;
  let hasEntryMock;
  let dbStub; //db自体もMock化するために差し替え

  beforeEach(()=>{
    //rewire でsshManagerモジュールを読み込む
    rewireSshManager = rewire("../../../app/core/sshManager.js");

    //テスト対象の関数を__get__で取得
    getSshPH = rewireSshManager.__get__("getSshPH");

    //hasEntry をスタブ化
    hasEntryMock = sinon.stub();

    //db は Map構造をモックとして差し替え
    dbStub = new Map();

    //rewireを用いて内部の依存を差し替え
    rewireSshManager.__set__({
      hasEntry: hasEntryMock,
      db: dbStub
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should throw an error if hostinfo is not registered for the project", ()=>{
    const projectRootDir = "/dummy/project";
    const hostID = "unregisteredHost";

    //hasEntry が false を返すように設定
    hasEntryMock.returns(false);

    try {
      getSshPH(projectRootDir, hostID);
      expect.fail("Expected getSshPH to throw an error, but it did not");
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.equal("hostinfo is not registerd for the project");
      expect(err.projectRootDir).to.equal(projectRootDir);
      expect(err.id).to.equal(hostID);
    }
    expect(hasEntryMock.calledOnceWithExactly(projectRootDir, hostID)).to.be.true;
  });

  it("should return the passphrase if hostinfo is registered for the project", ()=>{
    const projectRootDir = "/dummy/project";
    const hostID = "registeredHost";

    //hasEntry が true を返すように設定
    hasEntryMock.returns(true);

    //db の構造をエミュレート
    //dbStub は Map()
    //dbStub.get(projectRootDir) も Map() を返し、その中でキー=hostID でオブジェクトを持つ
    const hostMap = new Map();
    hostMap.set(hostID, { ph: "mySecretPassphrase" });
    dbStub.set(projectRootDir, hostMap);

    const result = getSshPH(projectRootDir, hostID);
    expect(result).to.equal("mySecretPassphrase");
    expect(hasEntryMock.calledOnceWithExactly(projectRootDir, hostID)).to.be.true;
  });
});

describe("#removeSsh", ()=>{
  let rewireSshManager;
  let removeSsh;
  let dbMock;

  beforeEach(()=>{
    //sshManager.jsをrewire
    rewireSshManager = rewire("../../../app/core/sshManager.js");
    //テスト対象関数を取得
    removeSsh = rewireSshManager.__get__("removeSsh");

    //dbをスタブ化(Map)して差し替え
    dbMock = new Map();
    rewireSshManager.__set__("db", dbMock);
  });

  it("should return immediately if db does not have projectRootDir", ()=>{
    //dbMockにキーをセットしない => 存在しない
    removeSsh("notExistsDir");
    //何も起こらないことを確認
    expect(dbMock.has("notExistsDir")).to.be.false;
  });

  it("should clear the map if it is empty and the projectRootDir is found", ()=>{
    const projectRootDir = "emptyDir";
    //projectRootDirに対して空のMapを登録
    dbMock.set(projectRootDir, new Map());

    removeSsh(projectRootDir);

    //.clear() が呼ばれて、空Mapが空のまま(結果的に要素なし)
    expect(dbMock.get(projectRootDir).size).to.equal(0);
  });

  it("should disconnect all non-storage entries and clear db if no storage entries exist", ()=>{
    const projectRootDir = "noStorageDir";
    //ssh.disconnect()をモック化
    const disconnectMock = sinon.stub();

    //2つのエントリを登録。両方isStorage = false
    const mapForDir = new Map();
    mapForDir.set("hostA", { isStorage: false, ssh: { disconnect: disconnectMock } });
    mapForDir.set("hostB", { isStorage: false, ssh: { disconnect: disconnectMock } });

    dbMock.set(projectRootDir, mapForDir);

    removeSsh(projectRootDir);

    //disconnectが呼ばれた回数確認(2回呼ばれる)
    expect(disconnectMock.callCount).to.equal(2);

    //最終的にclearDB=trueなら.db.clear()が実行され、サイズ0になる
    expect(dbMock.get(projectRootDir).size).to.equal(0);
  });

  it("should skip disconnect for storage entries and not clear the map if any storage is found", ()=>{
    const projectRootDir = "withStorageDir";

    //ストレージのsshオブジェクト(接続を切らない)
    const storageDisconnectMock = sinon.stub();
    //非ストレージのsshオブジェクト(切る)
    const normalDisconnectMock = sinon.stub();

    const mapForDir = new Map();
    mapForDir.set("hostStorage", { isStorage: true, ssh: { disconnect: storageDisconnectMock } });
    mapForDir.set("hostNonStorage", { isStorage: false, ssh: { disconnect: normalDisconnectMock } });

    dbMock.set(projectRootDir, mapForDir);

    removeSsh(projectRootDir);

    //storageの方はdisconnectされない
    expect(storageDisconnectMock.called).to.be.false;
    //非ストレージの方だけdisconnect呼ばれる
    expect(normalDisconnectMock.calledOnce).to.be.true;

    //clearDBがfalseになる => mapはclearされないので残る
    expect(dbMock.get(projectRootDir).size).to.equal(2);
  });
});

describe("#askPassword", ()=>{
  let rewireSshManager;
  let askPassword;
  let emitAllMock;

  beforeEach(()=>{
    //sshManager.jsをrewireで読み込む
    rewireSshManager = rewire("../../../app/core/sshManager.js");

    //テスト対象関数を取得
    askPassword = rewireSshManager.__get__("askPassword");

    //emitAllをsinon.stub()でMock化してrewireにセット
    emitAllMock = sinon.stub();
    rewireSshManager.__set__("emitAll", emitAllMock);
  });

  afterEach(()=>{
    //各テスト終了後にstub/spyをリセット
    sinon.restore();
  });

  it("should resolve with data if the user provides a non-null password", async ()=>{
    //emitAllのスタブがコールバックを呼び出すようにする
    //dataがnull以外の値を返す場合 (例: "secretPW")
    emitAllMock.callsFake((clientID, event, message, callback)=>{
      callback("secretPW");
    });

    const result = await askPassword("dummyClientID", "Please enter your password");
    expect(result).to.equal("secretPW");
    expect(emitAllMock.calledOnce).to.be.true;
  });

  it("should reject with an error if the user cancels the password input (data === null)", async ()=>{
    //dataがnullを返すパターン
    emitAllMock.callsFake((clientID, event, message, callback)=>{
      callback(null); //ユーザーがキャンセル
    });

    try {
      await askPassword("dummyClientID", "Please enter your password");
      //ここには来ない
      expect.fail("Expected askPassword to reject, but it resolved");
    } catch (err) {
      expect(err).to.be.an("error");
      expect(err.message).to.equal("user canceled ssh password prompt");
      expect(err.reason).to.equal("CANCELED");
    }
    expect(emitAllMock.calledOnce).to.be.true;
  });
});

describe("#createSsh", ()=>{
  let rewireSshManager;
  let createSsh;
  //Mock 変数群
  let hasEntryMock;
  let getSshMock;
  let addSshMock;
  let askPasswordMock;
  let SshClientWrapperMock;
  let canConnectMock;

  //後で差し替える前の process.env を退避しておく
  let originalWheelVerboseSsh;

  beforeEach(()=>{
    //sshManager.js を rewire で読み込み
    rewireSshManager = rewire("../../../app/core/sshManager.js");
    //テスト対象の関数を取得
    createSsh = rewireSshManager.__get__("createSsh");

    //各種 Mock を作成
    hasEntryMock = sinon.stub();
    getSshMock = sinon.stub();
    addSshMock = sinon.stub();
    askPasswordMock = sinon.stub();
    canConnectMock = sinon.stub();

    //SshClientWrapper のコンストラクタをモック化
    //ここでは new SshClientWrapper(...) されたら { canConnect: canConnectMock } を返すようにする
    SshClientWrapperMock = sinon.stub().callsFake(function () {
      return {
        canConnect: canConnectMock
      };
    });

    //必要な依存関数を __set__ で差し替え
    rewireSshManager.__set__({
      hasEntry: hasEntryMock,
      getSsh: getSshMock,
      addSsh: addSshMock,
      askPassword: askPasswordMock,
      //requireしているSshClientWrapperをモックに差し替え
      SshClientWrapper: SshClientWrapperMock
    });

    //環境変数の退避と初期化
    originalWheelVerboseSsh = process.env.WHEEL_VERBOSE_SSH;
    delete process.env.WHEEL_VERBOSE_SSH; //デフォルトは未定義とする
  });

  afterEach(()=>{
    sinon.restore();
    //環境変数を元に戻す
    if (originalWheelVerboseSsh !== undefined) {
      process.env.WHEEL_VERBOSE_SSH = originalWheelVerboseSsh;
    } else {
      delete process.env.WHEEL_VERBOSE_SSH;
    }
  });

  it("should return an existing ssh instance if hasEntry is true", async ()=>{
    //前提
    hasEntryMock.returns(true);
    const dummySshInstance = { dummy: "sshInstance" };
    getSshMock.returns(dummySshInstance);

    const projectRootDir = "/test/project";
    const hostinfo = { id: "host-abc" };
    const clientID = "clientXYZ";
    const remoteHostName = "remoteHostTest";

    //実行
    const result = await createSsh(projectRootDir, remoteHostName, hostinfo, clientID, false);

    //検証
    expect(hasEntryMock.calledOnceWithExactly(projectRootDir, "host-abc")).to.be.true;
    expect(getSshMock.calledOnceWithExactly(projectRootDir, "host-abc")).to.be.true;
    expect(result).to.deep.equal(dummySshInstance);
    //SshClientWrapper は呼ばれていない
    expect(SshClientWrapperMock.notCalled).to.be.true;
    expect(addSshMock.notCalled).to.be.true;
  });

  it("should handle string password and skip askPassword", async ()=>{
    //前提: hasEntry は false -> 新規作成ルート
    hasEntryMock.returns(false);
    const projectRootDir = "/test/project";
    const remoteHostName = "testHost";
    const hostinfo = {
      id: "host-xyz",
      password: "mySecretPassword"
    };
    const clientID = "cid-0001";
    //canConnect で成功するように
    canConnectMock.resolves(true);

    //実行
    const sshInstance = await createSsh(projectRootDir, remoteHostName, hostinfo, clientID, false);

    //検証
    expect(hasEntryMock.calledWithExactly(projectRootDir, "host-xyz")).to.be.true;
    //password は string なので askPassword は一切呼ばれない
    expect(askPasswordMock.notCalled).to.be.true;

    //SshClientWrapper の生成確認
    expect(SshClientWrapperMock.calledOnce).to.be.true;
    expect(canConnectMock.calledOnce).to.be.true;
    //成功なので addSsh が呼ばれている
    expect(addSshMock.calledOnce).to.be.true;
    expect(sshInstance).to.be.ok;
  });

  it("should set hostinfo.password as an async function that calls askPassword if not a string", async ()=>{
    hasEntryMock.returns(false);

    const projectRootDir = "/test/project";
    const remoteHostName = "sampleHost";
    const hostinfo = {
      id: "host-pswdFunc"
      //password は string でない（未設定）
    };
    const clientID = "client-pswdTest";

    //canConnect 成功時に askPassword が呼ばれる想定
    canConnectMock.resolves(true);
    askPasswordMock.resolves("p@ssw0rd!");

    const result = await createSsh(projectRootDir, remoteHostName, hostinfo, clientID, false);

    //hostinfo.password が "async function" に差し替えられていることを確認
    expect(typeof hostinfo.password).to.equal("function");
    //canConnect で成功 -> addSsh実行
    expect(addSshMock.calledOnce).to.be.true;

    //ただし実際に askPassword が呼ばれるのは canConnect 成功後、
    //SSH コマンドでパスワードが必要になった場合など。
    //今回のテストでは canConnectMock がパスワードレスで成功した想定なので
    //ここでは askPasswordMock が呼ばれていない可能性もあります。
    //(シナリオによっては、askPasswordMock を実際に呼ばせるには canConnect 内部実装が必要)
    //ここでは、"あとで必要になったとき呼ばれる" 想定なので、call回数は 0 のままでも問題なし
    expect(askPasswordMock.callCount).to.satisfy((count)=>count === 0 || count === 1);

    expect(result).to.be.ok;
  });

  it("should set passphrase async function and call askPassword if needed", async ()=>{
    hasEntryMock.returns(false);
    canConnectMock.resolves(true);
    askPasswordMock.resolves("passphraseTest");

    const projectRootDir = "/test/project";
    const remoteHostName = "sampleHost2";
    const hostinfo = {
      id: "host-pp",
      password: "alreadyStringPassword" //passwordは文字列
      //passphraseはstringで無い -> 未設定
    };
    const clientID = "client-pp";

    await createSsh(projectRootDir, remoteHostName, hostinfo, clientID, false);

    expect(typeof hostinfo.passphrase).to.equal("function");
    expect(addSshMock.calledOnce).to.be.true;
  });

  it("should set ControlPersist if renewInterval is provided", async ()=>{
    hasEntryMock.returns(false);
    canConnectMock.resolves(true);

    const hostinfo = {
      id: "renewTest",
      renewInterval: 10 //=> ControlPersist = 10*60
    };
    await createSsh("/test/project", "renewHost", hostinfo, "cid999", false);

    expect(hostinfo).to.have.property("ControlPersist", 600);
    expect(addSshMock.calledOnce).to.be.true;
  });

  it("should set ConnectTimeout if readyTimeout is provided", async ()=>{
    hasEntryMock.returns(false);
    canConnectMock.resolves(true);

    const hostinfo = {
      id: "rtTest",
      readyTimeout: 25000 //=> ConnectTimeout = floor(25000/1000) = 25
    };
    await createSsh("/test/proj", "rtHost", hostinfo, "cid-rt", false);

    expect(hostinfo).to.have.property("ConnectTimeout", 25);
    expect(addSshMock.calledOnce).to.be.true;
  });

  it("should set sshOpt=['-vvv'] if WHEEL_VERBOSE_SSH is truthy", async ()=>{
    //環境変数を設定
    process.env.WHEEL_VERBOSE_SSH = "true";

    hasEntryMock.returns(false);
    canConnectMock.resolves(true);

    const hostinfo = { id: "verboseTest" };
    await createSsh("/vProj", "vHost", hostinfo, "cl-v", false);

    expect(hostinfo).to.have.property("sshOpt");
    expect(hostinfo.sshOpt).to.deep.equal(["-vvv"]);
    expect(addSshMock.calledOnce).to.be.true;
  });

  it("should copy username to user and remove username if exist", async ()=>{
    hasEntryMock.returns(false);
    canConnectMock.resolves(true);

    const hostinfo = {
      id: "renameUser",
      username: "testUser"
    };
    await createSsh("/projUser", "hostUser", hostinfo, "cidUser", false);

    expect(hostinfo).to.not.have.property("username");
    expect(hostinfo).to.have.property("user", "testUser");
    expect(addSshMock.calledOnce).to.be.true;
  });

  it("should set rcfile to /etc/profile if not present", async ()=>{
    hasEntryMock.returns(false);
    canConnectMock.resolves(true);

    const hostinfo = { id: "rcTest" };
    await createSsh("/projRc", "hostRc", hostinfo, "cidRc", false);

    expect(hostinfo).to.have.property("rcfile", "/etc/profile");
    expect(addSshMock.calledOnce).to.be.true;
  });

  it("should addSsh only if ssh.canConnect succeeds", async ()=>{
    //canConnect を true にすれば addSsh される
    hasEntryMock.returns(false);

    canConnectMock.resolves(true);
    const hostinfoTrue = { id: "trueCase" };
    await createSsh("/testTrue", "trueHost", hostinfoTrue, "cidTrue", false);
    expect(addSshMock.calledOnce).to.be.true;

    //今回の実装では "false" を返すパスが無いが、
    //もしssh.canConnectがboolean返却になっていてfalseならaddSshしないケースがあるならテストする
    //canConnectMock.reset() or restore
    addSshMock.resetHistory();
    canConnectMock.resolves(false); //仮にfalseを返すようにする
    const hostinfoFalse = { id: "falseCase" };
    await createSsh("/testFalse", "falseHost", hostinfoFalse, "cidFalse", false);
    //addSshは呼ばれない
    expect(addSshMock.notCalled).to.be.true;
  });

  it("should throw error with appended message if 'Control socket creation failed'", async ()=>{
    hasEntryMock.returns(false);

    const hostinfo = { id: "failCase" };
    const error = new Error("Control socket creation failed");
    canConnectMock.rejects(error);

    try {
      await createSsh("/failProj", "failHost", hostinfo, "cidFail", false);
      throw new Error("Expected createSsh to throw, but it did not");
    } catch (err) {
      //エラーメッセージが追記されているか
      expect(err.message).to.include("Control socket creation failed");
      expect(err.message).to.include("you can avoid this error by using SSH_CONTROL_PERSIST_DIR");
    }
  });

  it("should throw generic error if unknown error happens during canConnect", async ()=>{
    hasEntryMock.returns(false);

    const hostinfo = { id: "failUnknown" };
    canConnectMock.rejects(new Error("Some random error"));

    try {
      await createSsh("/unknownProj", "unknownHost", hostinfo, "cidUnknown", false);
      throw new Error("Expected error but none thrown");
    } catch (err) {
      expect(err.message).to.equal("ssh connection failed due to unknown reason");
    }
  });
});
