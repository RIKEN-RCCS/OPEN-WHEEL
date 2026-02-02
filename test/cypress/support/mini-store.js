// test/cypress/support/mini-store.js
import { createStore } from 'vuex'


export function createMiniStore(overrides = {}) {
  const comp = {
    ID: 1,
    name: 'CompA',
    type: 'task',
    host: '',
    useJobScheduler: false,
    description: '',
    script: null,
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
  }

  const baseState = {
    selectedComponent: comp,
    copySelectedComponent: comp,
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
    showSnackbar() { },
    ...(overrides?.actions || {}),
  }

  return createStore({ state, getters, mutations, actions })
}