/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
import { expect } from "chai";
import sinon from "sinon";
import { createLocalVue, mount } from "@vue/test-utils";
import Vuetify from "vuetify";
import Vue from "vue";
import listForm from "@/components/common/listForm.vue";
Vue.use(Vuetify);

describe.only("listForm.vue", ()=>{
  const localVue = createLocalVue();
  it("renders ", ()=>{
    const wrapper = mount(listForm, {
      localVue,
      vuetify: new Vuetify(),
      stubs: ["VSelect"],
      propsData: {
        label: "list-form-test",
        items: [
          { name: "foo" },
          { name: "bar" },
          { name: "baz" },
        ],
      },
    });
    expect(wrapper.text()).to.much("list-form-test");
    console.log(wrapper.text());
  });
});
