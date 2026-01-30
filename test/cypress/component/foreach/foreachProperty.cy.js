import Vuex from 'vuex';
import ComponentProperty from '@/components/componentProperty.vue';
import SIO from '../../../../client/src/lib/socketIOWrapper.js';

describe('04:コンポーネントの基本機能動作確認', () => {
    const TAG_TYPE_INPUT = "input";
    const TAG_TYPE_OUTPUT = "output";
    const TAG_TYPE_TEXT_AREA = "textarea";
    const PANEL_INPUT_OUTPUT = "[data-cy=\"component_property-in_out_files-panel_title\"]";
    const PANEL_CONDITION_SETTING = "[data-cy=\"component_property-condition-setting_title\"]";
    const selectedWhile = {
        ID: 'comp-while-1',
        type: 'while',
        name: 'while0',
        description: '',
        inputFiles: [],
        outputFiles: [],
        indexList: [],
        include: [],
        exclude: [],
        host: 'localhost',
    };

    const makeStore = () => {
        const state = {
        selectedComponent: selectedWhile,
        copySelectedComponent: structuredClone(selectedWhile),
        currentComponent: { ID: 'root', descendants: [] },
        remoteHost: [],
        jobScheduler: {},
        scriptCandidates: [],
        projectRootDir: '/project',
        readOnly: false,
        };
        const mutations = {
        selectedComponent: (s, v) => { s.selectedComponent = v; },
        copySelectedComponent: (s, v) => { s.copySelectedComponent = v; },
        scriptCandidates: (s, v) => { s.scriptCandidates = v; },
        componentTree: (s, v) => { s.componentTree = v; },
        selectedFile: (s, v) => { s.selectedFile = v; },
        };
        const actions = {
        selectedComponent: ({ commit }, v) => commit('selectedComponent', v),
        showSnackbar: () => {},
        };
        const getters = {
        selectedComponentAbsPath: () => '/project',
        pathSep: () => '/',
        };
        return new Vuex.Store({ state, mutations, actions, getters });
    };

    beforeEach(() => {
    const store = makeStore(); 
    cy.stub(SIO, 'emitGlobal')
        .callsFake((event, _root, _payload, maybeCbOrId, maybeCb) => {
        const cb = typeof maybeCbOrId === 'function' ? maybeCbOrId : maybeCb;
        if (event === 'getFileList' && typeof cb === 'function') cb([]);
        });
    cy.mount(ComponentProperty, {
      storeOverrides: {
        state: {
          selectedComponent: {
            ID: 1, name: 'CompA', type: 'task',
            outputFiles: [], inputFiles: [], host: 'localhost',
            useJobScheduler: false, condition: null, retryCondition: null,
          },
          scriptCandidates: ['checkA', 'checkB', 'checkC'],
        }
      }
    });
    });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  試験確認内容：name入力テキストエリアが表示されていることを確認
   */
  it("04-01-131:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", ()=>{
    const DATA_CY_STR = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmDisplayInProperty(DATA_CY_STR, true);
  });

  /**
  コンポーネントの基本機能動作確認
  foreachコンポーネント共通機能確認
  name入力
  試験確認内容：nameが入力できることを確認
   */
  it("04-01-132:コンポーネントの基本機能動作確認-foreachコンポーネント共通機能確認-name入力-nameが入力できることを確認", ()=>{
    const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
    cy.confirmInputValueReflection_comp(INPUT_OBJ_CY, "-Test_Task", TAG_TYPE_INPUT, "-Test_Task");
  });
});