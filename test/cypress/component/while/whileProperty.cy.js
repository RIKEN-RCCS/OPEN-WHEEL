// test/cypress/component/while/whileProperty.cy.js
import Vuex from 'vuex';
import ComponentProperty from '../../../../client/src/components/componentProperty.vue';
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
        global: {
        plugins: [store],
        stubs: {
            'file-browser': { template: '<div data-cy="file-browser-stub" />' },
            'remote-file-browser': true,
            'gfarm-tar-browser': true,
                },
            },
        });
    });


    /**
     コンポーネントの基本機能動作確認
     whileコンポーネント共通機能確認
     試験確認内容：name入力テキストエリアが表示されていることを確認
    */
    it("04-01-088:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-name入力テキストエリアが表示されていることを確認", () => {
        const DATA_CY_STR = "[data-cy=\"component_property-name-text_field\"]";
        cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
     コンポーネントの基本機能動作確認
     whileコンポーネント共通機能確認
     name入力
     試験確認内容：nameが入力できることを確認
    */
    it("04-01-089:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-name入力-nameが入力できることを確認", ()=>{
        const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
        const INPUT_VAL = "-Test_Task"
        cy.get(INPUT_OBJ_CY).find(TAG_TYPE_INPUT).clear().type(INPUT_VAL);
        cy.get('body').click(0, 0)
        cy.get(INPUT_OBJ_CY).find(TAG_TYPE_INPUT).should("have.value", INPUT_VAL);
        cy.get(INPUT_OBJ_CY).find(TAG_TYPE_INPUT).closest('.v-field').should('not.have.class', 'v-field--error')
    });

      /**
     コンポーネントの基本機能動作確認
     whileコンポーネント共通機能確認
     name入力（使用可能文字確認）
     試験確認内容：nameが入力できないことを確認
    */
    it("04-01-090:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-name入力（使用可能文字確認）-nameが入力できないことを確認", ()=>{
        const INPUT_OBJ_CY = "[data-cy=\"component_property-name-text_field\"]";
        const INPUT_VAL = "Test*Task"
        cy.get(INPUT_OBJ_CY).find(TAG_TYPE_INPUT).clear().type(INPUT_VAL);
        cy.get('body').click(0, 0)
        cy.get(INPUT_OBJ_CY).find(TAG_TYPE_INPUT).should("have.value", INPUT_VAL);
        cy.get(INPUT_OBJ_CY).find(TAG_TYPE_INPUT).closest('.v-field').should('have.class', 'v-field--error');
     });

     /**
     コンポーネントの基本機能動作確認
     whileコンポーネント共通機能確認
     試験確認内容：説明入力テキストエリアが表示されていることを確認
    */
    it("04-01-091:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-description入力テキストエリアが表示されていることを確認", ()=>{
        const DATA_CY_STR = "[data-cy=\"component_property-description-textarea\"]";
        cy.confirmDisplayInProperty(DATA_CY_STR, true);
    });

    /**
     コンポーネントの基本機能動作確認
     whileコンポーネント共通機能確認
     description入力
     試験確認内容：descriptionが入力できることを確認
    */
    it("04-01-092:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-description入力-descriptionが入力できることを確認", ()=>{
        const INPUT_OBJ_CY = "[data-cy=\"component_property-description-textarea\"]";
        const INPUT_VAL = "descriptionTest"
        cy.get(INPUT_OBJ_CY).find(TAG_TYPE_TEXT_AREA).clear().type(INPUT_VAL);
        cy.get('body').click(0, 0)
        cy.get(INPUT_OBJ_CY).find(TAG_TYPE_TEXT_AREA).should("have.value", INPUT_VAL);
        cy.get(INPUT_OBJ_CY).find(TAG_TYPE_TEXT_AREA).closest('.v-field').should('not.have.class', 'v-field--error')
    });

    /**
     コンポーネントの基本機能動作確認
     whileコンポーネント共通機能確認
     input files表示
     試験確認内容：input files入力テキストエリアが表示されていることを確認
    */
    it("04-01-093:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-input files表示-input files入力テキストエリアが表示されていることを確認", ()=>{
        const DATA_CY_STR = "[data-cy=\"component_property-input_files-list_form\"]";
        cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, PANEL_INPUT_OUTPUT, null);
    });

    /**
     コンポーネントの基本機能動作確認
     whileコンポーネント共通機能確認
     input files入力
     試験確認内容：input filesが入力できることを確認
    */
    it("04-01-094:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-input files入力-input filesが入力できることを確認", ()=>{
        const DATA_CY_STR = "[data-cy=\"component_property-input_files-list_form\"]";
        const INPUT_VAL = "testInputFile"
        cy.get(PANEL_INPUT_OUTPUT, { timeout: 10000 }).scrollIntoView().click({ force: true });
        cy.get(DATA_CY_STR).find(TAG_TYPE_INPUT).type(INPUT_VAL);
        cy.get(DATA_CY_STR).find(TAG_TYPE_INPUT).should("have.value",INPUT_VAL );
    });

    /**
     コンポーネントの基本機能動作確認
     whileコンポーネント共通機能確認
     output files表示
     試験確認内容：output files入力テキストエリアが表示されていることを確認
    */
    it("04-01-096:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-output files表示-output files入力テキストエリアが表示されていることを確認", ()=>{
        const DATA_CY_STR = "[data-cy=\"component_property-output_files-list_form\"]";
        cy.confirmDisplayInPropertyByDetailsArea(DATA_CY_STR, PANEL_INPUT_OUTPUT, null);
    });

    /**
     コンポーネントの基本機能動作確認
     whileコンポーネント共通機能確認
     output files入力
     試験確認内容：output filesが入力できることを確認
    */
    it("04-01-097:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-output files入力-output filesが入力できることを確認", ()=>{
        const DATA_CY_STR = "[data-cy=\"component_property-output_files-list_form\"]";
        const INPUT_VAL = "testOutputFile"
        cy.get(PANEL_INPUT_OUTPUT, { timeout: 10000 }).scrollIntoView().click({ force: true });
        cy.get(DATA_CY_STR).find(TAG_TYPE_INPUT).type(INPUT_VAL);
        cy.get(DATA_CY_STR).find(TAG_TYPE_INPUT).should("have.value",INPUT_VAL );
    });

    /**
     コンポーネントの基本機能動作確認
     whileコンポーネント共通機能確認
     転送対象ファイル・フォルダの設定
     削除ボタン表示確認（input file）
     試験確認内容：削除ボタンが表示されることを確認
    */
    it("04-01-108:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（input file）-削除ボタンが表示されることを確認", ()=>{
        const INPUT_VAL = "testInputFile"
        const DELETE_BTN = "[data-cy=\"action_row-delete-btn\"]"
        cy.enterInputOrOutputFile(TAG_TYPE_INPUT, INPUT_VAL, true, true);
        cy.get(DELETE_BTN).should("be.visible");
    });

    /**
     コンポーネントの基本機能動作確認
     whileコンポーネント共通機能確認
     転送対象ファイル・フォルダの設定
     削除ボタン表示確認（output file）
     試験確認内容：削除ボタンが表示されることを確認
    */
    it("04-01-109:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-転送対象ファイル・フォルダの設定-削除ボタン表示確認（output file）-削除ボタンが表示されることを確認", ()=>{
        const INPUT_VAL = "testOutputFile"
        const DELETE_BTN = "[data-cy=\"action_row-delete-btn\"]"
        cy.enterInputOrOutputFile(TAG_TYPE_OUTPUT, INPUT_VAL, true, true);
        cy.get(DELETE_BTN).should("be.visible");
    });
    
    /**
     コンポーネントの基本機能動作確認
     whileコンポーネント共通機能確認
     プロパティ設定確認
     シェルスクリプト選択セレクトボックス表示確認
     試験確認内容：シェルスクリプト選択セレクトボックスが表示されていることを確認
    */
    it("04-01-121:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-プロパティ設定確認-シェルスクリプト選択セレクトボックス表示確認-シェルスクリプト選択セレクトボックスが表示されていることを確認", ()=>{
        const INPUT_OBJ_CY = "[data-cy=\"component_property-condition_use_javascript-autocomplete\"]";
        cy.get(PANEL_CONDITION_SETTING).then($t => {
            const isOpen = $t.attr('aria-expanded') === 'true'; 
            if (isOpen) cy.wrap($t).scrollIntoView().click();
        });
        cy.get(PANEL_CONDITION_SETTING).click();
        cy.get(INPUT_OBJ_CY).find(TAG_TYPE_INPUT).should("exist");
    });    

    /**
     コンポーネントの基本機能動作確認
     whileコンポーネント共通機能確認
     プロパティ設定確認
     javascriptテキストボックス表示確認
     試験確認内容：javascriptテキストボックスが表示されていることを確認
    */
    it("04-01-124:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-プロパティ設定確認-javascriptテキストボックス表示確認-javascriptテキストボックスが表示されていることを確認", ()=>{
        const INPUT_OBJ_CY = "[data-cy=\"component_property-condition_use_javascript-textarea\"]";
        const JAVASCRIPT_SWITCH = "[data-cy=\"component_property-condition_use_javascript-switch\"]";
        cy.get(PANEL_CONDITION_SETTING).then($t => {
            const isOpen = $t.attr('aria-expanded') === 'true'; 
            if (isOpen) cy.wrap($t).scrollIntoView().click();
        });
        cy.get(PANEL_CONDITION_SETTING).click();
        cy.get(JAVASCRIPT_SWITCH).click();
        cy.get(INPUT_OBJ_CY).should("be.visible");
    });

    /**
     コンポーネントの基本機能動作確認
     whileコンポーネント共通機能確認
     プロパティ設定確認
     javascriptテキストボックス入力確認
     試験確認内容：入力した値が表示されていることを確認
    */
    it("04-01-125:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-プロパティ設定確認-javascriptテキストボックス入力確認-入力した値が表示されていることを確認", ()=>{
        const INPUT_OBJ_CY = "[data-cy=\"component_property-condition_use_javascript-textarea\"]";
        const JAVASCRIPT_SWITCH = "[data-cy=\"component_property-condition_use_javascript-switch\"]";
        const INPUT_VAL = "testJavaScript";
        cy.get(PANEL_CONDITION_SETTING).then($t => {
            const isOpen = $t.attr('aria-expanded') === 'true'; 
            if (isOpen) cy.wrap($t).scrollIntoView().click();
        });
        cy.get(PANEL_CONDITION_SETTING).click();
        cy.get(JAVASCRIPT_SWITCH).click();
        cy.get(INPUT_OBJ_CY).type(INPUT_VAL);
        cy.get(INPUT_OBJ_CY).find(TAG_TYPE_TEXT_AREA)
        .should("have.value", INPUT_VAL);
    });

    /**
     コンポーネントの基本機能動作確認
     whileコンポーネント共通機能確認
     各コンポーネント特有のプロパティ確認
     number of instances to keep表示確認
     試験確認内容：number of instances to keepテキストボックスが表示されていることを確認
    */
    it("04-01-127:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-keep表示確認-keepテキストボックスが表示されていることを確認", ()=>{
        const INPUT_OBJ_CY = "[data-cy=\"component_property-keep_while-text_field\"]"; 
        cy.get(PANEL_CONDITION_SETTING).then($t => {
            const isOpen = $t.attr('aria-expanded') === 'true'; 
            if (isOpen) cy.wrap($t).scrollIntoView().click();
        });
        cy.get(PANEL_CONDITION_SETTING).click();
        cy.get(INPUT_OBJ_CY).scrollIntoView().should("be.visible");
    });

    /**
     コンポーネントの基本機能動作確認
    whileコンポーネント共通機能確認
    各コンポーネント特有のプロパティ確認
    number of instances to keep入力確認
    試験確認内容：number of instances to keepテキストボックスが入力できることを確認
    */
    it("04-01-128:コンポーネントの基本機能動作確認-whileコンポーネント共通機能確認-各コンポーネント特有のプロパティ確認-keep入力確認-keepテキストボックスが入力できることを確認", ()=>{
        const INPUT_OBJ_CY = "[data-cy=\"component_property-keep_while-text_field\"]"; 
        cy.get(PANEL_CONDITION_SETTING).then($t => {
            const isOpen = $t.attr('aria-expanded') === 'true'; 
            if (isOpen) cy.wrap($t).scrollIntoView().click();
        });
        cy.get(PANEL_CONDITION_SETTING).click();
        cy.get(INPUT_OBJ_CY).type(10);
        cy.get(INPUT_OBJ_CY).find(TAG_TYPE_INPUT).should("have.value", 10);
    });


});