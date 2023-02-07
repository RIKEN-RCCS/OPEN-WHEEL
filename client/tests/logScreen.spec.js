/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License.txt in the project root for the license information.
 */
"use strict";
import { expect } from "chai";
import { shallowMount } from "@vue/test-utils";
import LogScreen from "@/components/logScreen.vue";

describe("logScreen.vue", ()=>{
  it("renders clearlog button and logscreen tab", ()=>{
    const wrapper = shallowMount(LogScreen);
    expect(wrapper.text()).to.include("clear all log");
    expect(wrapper.text()).to.include("debug");
    expect(wrapper.text()).to.include("info");
    expect(wrapper.text()).to.include("stdout");
    expect(wrapper.text()).to.include("stderr");
    expect(wrapper.text()).to.include("stdout(SSH)");
    expect(wrapper.text()).to.include("stderr(SSH)");
  });
});
