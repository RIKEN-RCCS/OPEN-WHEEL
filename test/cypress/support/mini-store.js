// test/cypress/support/mini-store.js
import { createStore } from 'vuex'


export function createComponentTestStore(overrides = {}) {
  const comp = {
    ID: 1,
    name: 'CompA',
    type: 'task',
    indexList: [],
    inputFiles: [],
    outputFiles: [],
  }

  const baseState = {
    selectedComponent: structuredClone(comp),
    copySelectedComponent: structuredClone(comp),
    remoteHost: [{ name: 'localhost', queue: '', jobScheduler: null }],
    currentComponent: { ID: 999, descendants: [] },
    scriptCandidates: ['checkA', 'checkB', 'checkC'],
    projectRootDir: '/proj',
  }

  const state = {
    ...baseState,
    ...(overrides?.state || {}),
  }

  const getters = {
    selectedComponentAbsPath: () => '/proj/CompA',
    pathSep: () => '/',
    ...(overrides?.getters || {}),
  }

  const mutations = {
    scriptCandidates(s, payload) { s.scriptCandidates = payload },
    componentTree(s, payload) { s.componentTree = payload },
    selectedFile(s, payload) { s.selectedFile = payload },
    setSelectedComponent(s, payload) { s.selectedComponent = payload },
    ...(overrides?.mutations || {}),
  }

  const actions = {
    selectedComponent({ commit }, payload) { commit('setSelectedComponent', payload) },
    showSnackbar() { },
    ...(overrides?.actions || {}),
  }

  return createStore({ state, getters, mutations, actions })
}