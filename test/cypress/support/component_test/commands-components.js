//以下、Vuetify + アプリ殻（App Shell）付きで mount するためのヘルパー
import { defineComponent, h, onMounted } from "vue";
import { VApp, VMain } from "vuetify/components";

//Vuetify の基本スタイル・アイコンをテスト環境にも適用する
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

//vuetify plugin を利用する
import vuetify from "@/plugins/vuetify.js";

//E2E側の流用するコマンドをインポート
import "../commands-workFlow";

//テスト向けの簡易 store（状態注入しやすい）を利用する
import { createComponentTestStore } from "./mini-store";

import { mount } from "cypress/vue";

/**
 * Vueコンポーネントを「アプリに近い環境（VApp/VMain + plugin）」で mount する。
 * @param {Component} Inner - テスト対象のコンポーネント
 * @param {object} options - cypress/vue の mount オプション
 *   - options.global: Vue Test Utils の global 設定（plugins/stubs など）
 *   - options.storeOverrides: mini-store へ注入する初期状態など
 */
export function mountComponentWithAppShell(Inner, options = {}) {
  const Wrapped = defineComponent({
    name: "WrappedWithVApp",
    setup() {
      //テストの安定化目的で、アニメーション等を無効化＆固定サイズ化する
      onMounted(()=>{
        const STYLE_ID = "ct-disable-animations-and-size";

        //複数追加防止
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.innerHTML = `
    * { transition: none !important; animation: none !important; }
    #app { min-width: 1200px; min-height: 800px; }
    html, body { margin: 0; }
  `;
        document.head.appendChild(style);
      });

      //render 関数でアプリ殻を構築し、その中に Inner を描画する
      return ()=>{
        return h("div", { id: "app" }, [
          h(VApp, null, {
            default: ()=>{ return h(VMain, null, { default: ()=>{ return h(Inner); } }); }
          })
        ]);
      };
    }
  });

  //呼び出し側が mount の global 設定を渡してきた場合に備えて取得
  const userGlobal = options.global ?? {};

  //テストの標準構成として「mini-store」と「vuetify」を必ず有効化する
  //storeOverrides により、テストケース側から状態を注入できる
  const basePlugins = [
    createComponentTestStore(options.storeOverrides),
    vuetify
  ];

  //呼び出し側が追加 plugin を指定していたら後ろに足す
  const userPlugins = userGlobal.plugins ?? [];

  //global 設定をマージ（plugins は結合、stubs は上書きマージ）
  const mergedGlobal = {
    ...userGlobal,
    plugins: [...basePlugins, ...userPlugins],
    stubs: {
      ...(userGlobal.stubs ?? {})
    }
  };

  //options.global は mergedGlobal を使うので、残りの mount オプションのみ抽出する
  const { global: _discard, ...restOptions } = options;

  //cypress/vue の mount を実行
  //attachTo: document.body により、DOM 実体として扱われやすくする（計測/フォーカス等）
  return mount(Wrapped, {
    attachTo: document.body,
    ...restOptions,
    global: mergedGlobal
  });
}

//マウント処理をCypressコマンドに追加
Cypress.Commands.add("mountComponentWithAppShell", (comp, options)=>{ return mountComponentWithAppShell(comp, options); });

//confirm the display in the property
Cypress.Commands.add("confirmDisplayInProperty_comp", (dataCyStr, visibleFlg)=>{
  if (visibleFlg) {
    cy.get(dataCyStr).should("be.visible");
  } else {
    cy.get(dataCyStr).should("be.not.visible");
  }
});

//confirmation of input value reflection
Cypress.Commands.add("confirmInputValueReflection_comp", (inputObjCy, inputVal, tagType)=>{
  cy.get(inputObjCy).find(tagType)
    .clear();
  //input
  cy.get(inputObjCy).type(inputVal);
  //comparison
  cy.get(inputObjCy).find(tagType)
    .should("have.value", inputVal);
});

//confirmation of input value not reflection
Cypress.Commands.add("confirmInputValueNotReflection_comp", (inputObjCy, inputVal, tagType)=>{
  cy.get(inputObjCy).find("input")
    .clear();
  //input
  cy.get(inputObjCy).type(inputVal);

  //comparison
  cy.get(inputObjCy).should("have.not.value", inputVal);
});
