// test/cypress/support/mini-store.js
import Vuex from 'vuex'
import { createStore } from 'vuex'


export function createMiniStore(overrides = {}) {
  const baseState = {
    selectedComponent: {
      ID: 1,
      name: 'CompA',
      type: 'task', 
      outputFiles: [],
      inputFiles: [],
      host: 'localhost',
      useJobScheduler: false,
      condition: null,
      retryCondition: null,
    },
    copySelectedComponent: {
      name: '',
      description: '',
      script: null,
      host: 'localhost',
      useJobScheduler: false,
      queue: '',
      submitOption: '',
      storagePath: '',
      ignoreFailure: false,
      retry: 0,
      retryCondition: null,
      indexList: [],
      keep: null,
      include: [],
      exclude: [],
      inputFiles: [],
      outputFiles: [],
      cleanupFlag: 2,
      uploadOnDemand: false,
      parameterFile: null,
      forceOverwrite: false,
      deleteLoopInstance: false,
      useDependency: false,
      stepnum: 0,
      dependencyForm: '',
      usePSSettingFile: false,
      manualFinishCondition: false,
      condition: null,
    },
    remoteHost: [{ name: 'localhost', queue: '', jobScheduler: null }],
    currentComponent: { ID: 999, descendants: [] },
    scriptCandidates: ['checkA', 'checkB', 'checkC'], 
    projectRootDir: '/proj',
    jobScheduler: {},
    readOnly: false,
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
    showSnackbar() {},
    ...(overrides?.actions || {}),
  }

  return createStore({ state, getters, mutations, actions })
}