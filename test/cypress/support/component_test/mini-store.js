/**
 * Cypress Component Testing 用の最小 Vuex Store 生成ユーティリティ。
 * 本番Storeを持ち込まず、mount に必要な state/getters/mutations/actions だけを用意する。
 * テストケース側から overrides で差分注入できる。
 */
import { createStore } from "vuex";

/**
 * Cypress Component Testing 用の最小 Vuex Storeを生成する。
 * @param {object} overrides - 既定定義に対する上書き差分
 * @param {object} [overrides.state] - state の上書き
 * @param {object} [overrides.getters] - getters の上書き/追加
 * @param {object} [overrides.mutations] - mutations の上書き/追加
 * @param {object} [overrides.actions] - actions の上書き/追加
 * @returns {import('vuex').Store<any>} Vuex Store インスタンス
 */
export function createComponentTestStore(overrides = {}) {
  /**
   * テスト対象コンポーネントが参照する「選択中コンポーネント」相当のダミー。
   * 表示中心の想定なので、参照される可能性が高い最低限のキーだけ持たせる。
   *
   */
  const comp = {
    ID: 1,
    name: "CompA",
    type: "task",
    indexList: [],
    inputFiles: [],
    outputFiles: []
  };

  /**
   * Store のデフォルト state。
   * Component Test では「マウントに必要な値が揃っている」ことが最重要なので、
   * 本番Storeの代わりにここで最低限を初期化する。
   *
   */
  const baseState = {
    selectedComponent: structuredClone(comp),
    copySelectedComponent: structuredClone(comp),

    //プロパティ部分には特にかかわらないので仮の値を設定
    remoteHost: [{ name: "localhost", queue: "", jobScheduler: null }],
    currentComponent: { ID: 999, descendants: [] },
    scriptCandidates: ["checkA", "checkB", "checkC"],
    projectRootDir: "/proj"
  };

  /**
   * テストケース側から state を差分注入できるように
   */
  const state = {
    ...baseState,
    ...(overrides?.state || {})
  };

  /**
   * getters 固定値を返す
   */
  const getters = {
    selectedComponentAbsPath: ()=>{ return "/proj/CompA"; },
    pathSep: ()=>{ return "/"; },
    ...(overrides?.getters || {})
  };

  /**
   * コンポーネントが commit する前提の mutation を最低限用意。
   */
  const mutations = {
    scriptCandidates(s, payload) { s.scriptCandidates = payload; },
    componentTree(s, payload) { s.componentTree = payload; },
    selectedFile(s, payload) { s.selectedFile = payload; },
    setSelectedComponent(s, payload) { s.selectedComponent = payload; },
    ...(overrides?.mutations || {})
  };

  /**
   * dispatch される action を最低限用意。
   * UIテストでは副作用は不要なことが多いので showSnackbar は 空実装
   */
  const actions = {
    selectedComponent({ commit }, payload) { commit("setSelectedComponent", payload); },
    showSnackbar() {},
    ...(overrides?.actions || {})
  };

  return createStore({ state, getters, mutations, actions });
}
