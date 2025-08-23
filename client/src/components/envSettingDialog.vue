/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-dialog
    v-model="openDialog"
    persistent
    scrollable
    width="80vw"
  >
    <v-card>
      <v-card-title>
        user defined envirionment variables
      </v-card-title>
      <v-card-text>
        <v-data-table
          :items="env"
          :headers="headers"
        >
          <template #item.name="props">
            <inline-editor
              :current-value="props.item.name"
              data-cy-prefix="env_setting-name"
              :additional-rules="[required]"
              @confirmed="(newVal)=>{props.item.name = newVal}"
            />
          </template>
          <template #item.value="props">
            <inline-editor
              :current-value="props.item.value"
              data-cy-prefix="env_setting-value"
              :additional-rules="[required]"
              @confirmed="(newVal)=>{props.item.value= newVal}"
            />
          </template>
          <template #item.actions="{ item }">
            <action-row
              :item="item"
              :can-edit="false"
              :readonly="readOnly"
              @delete="deleteEnv"
            />
          </template>
          <template #bottom>
            <v-row>
              <v-col cols="5">
                <v-text-field
                  v-model="newKey"
                  label="name"
                  variant="outlined"
                  density="compact"
                  clearable
                  :rules="[noDuplicatedName]"
                />
              </v-col>
              <v-col cols="5">
                <v-text-field
                  v-model="newValue"
                  variant="outlined"
                  density="compact"
                  label="value"
                  clearable
                />
              </v-col>
              <v-col cols="auto">
                <v-btn
                  icon="mdi-plus"
                  @click="addEnv"
                />
              </v-col>
            </v-row>
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <buttons
          :buttons="[
            {label: 'save', icon: 'mdi-check'},
            {label: 'cancel', icon: 'mdi-close'},
          ]"
          @save="saveEnv"
          @cancel="closeEnvironmentVariableSetting"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
import { toRaw, nextTick } from "vue";
import { mapState, mapMutations } from "vuex";
import SIO from "../lib/socketIOWrapper.js";
import actionRow from "../components/common/actionRow.vue";
import buttons from "../components/common/buttons.vue";
import { removeFromArray } from "../lib/clientUtility.js";
import { required } from "../lib/validationRules.js";
import inlineEditor from "./common/inlineEditor.vue";

export default {
  name: "EnvSettingDialog",
  components: {
    actionRow,
    buttons,
    inlineEditor
  },
  emits: [
    "update:modelValue"
  ],
  data: function () {
    return {
      env: [],
      editKeyDialog: [],
      editValueDialog: [],
      newKey: null,
      newValue: null,
      headers: [
        { title: "name", key: "name" },
        { title: "value", key: "value" },
        { title: "", key: "actions" }
      ],
      itemRefs: {},
      itemWidths: {}
    };
  },
  computed: {
    openDialog: {
      get() {
        return this.modelValue;
      },
      set(v) {
        this.$emit("update:modelValue", v);
      }
    },
    ...mapState(["projectState", "currentComponent", "projectRootDir", "rootComponentID", "readOnly"])
  },
  mounted() {
    this.commitWaitingEnv(true);
    SIO.emitGlobal("getEnv", this.projectRootDir, this.rootComponentID, (data)=>{
      //this determination does not work
      if (data instanceof Error) {
        console.log("getEnv API return error", data);
        this.commitWaitingEnv(false);
        return;
      }
      const env = Object.entries(data).map(([k, v])=>{
        return { name: k, value: v };
      });
      this.env.splice(0, this.env.length, ...env);
      this.commitWaitingEnv(false);
      nextTick(()=>{
        for (const id in this.itemRefs) {
          if (this.itemRefs[id]) {
            this.itemWidths[id] = this.itemRefs[id].offsetWidth;
          }
        }
      });
    });
  },
  methods: {
    setItemRef(id, el) {
      if (el) {
        this.itemRefs[id] = el;
      }
    },
    required,
    ...mapMutations(
      {
        commitComponentTree: "componentTree",
        commitWaitingEnv: "waitingEnv"
      }),
    noDuplicatedName(newName) {
      const hasDup = this.env.some((e)=>{
        return e.name === newName;
      });
      return hasDup ? "duplicated name is not allowed" : true;
    },
    closeEnvironmentVariableSetting() {
      this.newKey = null;
      this.newValue = null;
      this.$emit("update:modelValue", false);
    },
    addEnv() {
      this.env.push({ name: this.newKey, value: this.newValue });
      this.newKey = null;
      this.newValue = null;
    },
    deleteEnv(e) {
      removeFromArray(this.env, toRaw(e), "name");
    },
    saveEnv() {
      const env = this.env.reduce((a, e)=>{
        a[e.name] = e.value;
        return a;
      }, {});
      SIO.emitGlobal("updateEnv", this.projectRootDir, this.rootComponentID, env, this.currentComponent.ID, SIO.generalCallback);
      this.closeEnvironmentVariableSetting();
    }
  }
};
</script>
