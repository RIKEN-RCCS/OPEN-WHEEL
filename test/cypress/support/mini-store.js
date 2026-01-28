// test/cypress/support/mini-store.js
import Vuex from 'vuex'

export function createMiniStore () {
  return new Vuex.Store({
    state: {
      projectRootDir: '/tmp/project',
      rootComponentID: 'root',
      currentComponent: { ID: 'root' },
      selectedComponent: { ID: 'dummy' },
      componentPath: { dummy: './' },
    },
    getters: {
      pathSep: () => '/',
      selectedComponentAbsPath: (state) => state.projectRootDir,
      currentComponentAbsPath: (state) => state.projectRootDir,
      waiting: () => false,
    },
    mutations: {},
    actions: {},
  })
}
``