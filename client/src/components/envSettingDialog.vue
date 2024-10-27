/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-btn
    :disabled="! isEdittable"
    @click.stop="openEnvironmentVariableSetting"
    icon="mdi-cog"
  />
  <v-dialog
    v-model="envSetting"
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
          <v-menu
            location="bottom"
            v-model="editKeyDialog[props.index]"
            :close-on-content-click="false"
            min-width="auto"
            max-width="50vw"
          >
            <template v-slot:activator="{ props: menuProps }">
              <v-btn
                variant="text"
                v-bind="menuProps"
                block
                class="justify-start"
                :text=props.item.columns.name
              />
            </template>
            <v-sheet
            min-width="auto"
            max-width="50vw"
            >
              <v-text-field
                v-model="props.item.raw.name"
                :rules="[required]"
                clearable
                @keyup.enter="editKeyDialog[props.index]=false"
              />
            </v-sheet>
          </v-menu>
        </template>
        <template #item.value="props">
          <v-menu
            location="bottom"
            v-model="editValueDialog[props.index]"
            :close-on-content-click="false"
            min-width="auto"
            max-width="50vw"
          >
            <template v-slot:activator="{ props: menuProps }">
              <v-btn
                variant="text"
                v-bind="menuProps"
                block
                class="justify-start"
                :text=props.item.columns.value
              />
            </template>
            <v-sheet
            min-width="auto"
            max-width="50vw"
            >
              <v-text-field
                v-model="props.item.raw.value"
                :rules="[required]"
                clearable
                @keyup.enter="editValueDialog[props.index]=false"
              />
            </v-sheet>
          </v-menu>
        </template>
          <template #item.actions="{ item }">
            <action-row
              :item="item"
              :can-edit="false"
              @delete="deleteEnv"
            />
          </template>
          <template #bottom >
            <v-row>
              <v-col cols="5">
                <v-text-field
                  v-model="newKey"
                  label="name"
                  variant=outlined
                  density=compact
                  clearable
                  :rules="[noDuplicatedName]"
                />
              </v-col>
              <v-col cols="5">
                <v-text-field
                  v-model="newValue"
                  variant=outlined
                  density=compact
                  label="value"
                  clearable
                />
              </v-col>
              <v-col cols="auto">
                <v-btn
                  @click="addEnv"
                  icon="mdi-plus"
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
import { mapState, mapMutations, mapGetters } from "vuex";
import SIO from "@/lib/socketIOWrapper.js";
import actionRow from "@/components/common/actionRow.vue";
import buttons from "@/components/common/buttons.vue";
import { removeFromArray } from "@/lib/clientUtility.js";
import { required } from "@/lib/validationRules.js";

export default {
  name: "envSettingDialog",
  components: {
    actionRow,
    buttons
  },
  computed: {
    ...mapState(["projectState", "currentComponent", "projectRootDir", "rootComponentID"]),
    ...mapGetters(["currentComponentAbsPath", "isEdittable"])
  },
  data: function () {
    return {
      envSetting: false,
      env: [],
      editKeyDialog: [],
      editValueDialog: [],
      newKey: null,
      newValue: null,
      headers: [
        { title: "name", key: "name" },
        { title: "value", key: "value" },
        { title: "", key: "actions" }
      ]
    };
  },
  methods: {
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
    openEnvironmentVariableSetting() {
      this.commitWaitingEnv(true);
      SIO.emitGlobal("getEnv", this.projectRootDir, this.rootComponentID, (data)=>{
        //FIXME this determination does not work
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
        this.envSetting = true;
      });
    },
    closeEnvironmentVariableSetting() {
      this.newKey = null;
      this.newValue = null;
      this.envSetting = false;
    },
    addEnv() {
      this.env.push({ name: this.newKey, value: this.newValue });
      this.newKey = null;
      this.newValue = null;
    },
    deleteEnv(e) {
      console.log("DEBUG DELETE", e);
      removeFromArray(this.env, e.raw);
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
