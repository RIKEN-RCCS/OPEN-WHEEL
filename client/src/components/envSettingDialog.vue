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

  export default{
    name: "envSettingDialog",
    components:{
      actionRow,
      buttons,
    },
    computed: {
      ...mapState(["projectState", "currentComponent", "projectRootDir","rootComponentID"]),
      ...mapGetters(["currentComponentAbsPath", "isEdittable"]),
    },
    data: function(){
      return {
        envSetting: false,
        env: [],
        newKey: null,
        newValue:null,
        headers:[
          {title: "name", key: "name"},
          {title: "value", key: "value" },
          {title: "" ,key: "actions"}
        ]
      }
    },
    methods:{
      ...mapMutations(
        {
          commitComponentTree: "componentTree",
          commitWaitingEnv: "waitingEnv"
        }),
      openEnvironmentVariableSetting(){
        this.commitWaitingEnv(true);
        SIO.emitGlobal("getEnv", this.projectRootDir, this.rootComponentID,  (data)=>{
            // FIXME this determination does not work
          if(data instanceof Error){
            console.log("getEnv API return error", data);
            this.commitWaitingEnv(false);
            return;
          }
          const env=Object.entries(data).map(([k,v])=>{
            return {name: k, value:v};
          });
          this.env.splice(0, this.env.length, ...env);
          this.commitWaitingEnv(false);
          this.envSetting=true;
        });
      },
      closeEnvironmentVariableSetting(){
        this.newKey=null;
        this.newValue=null;
        this.envSetting=false;
      },
      addEnv(){
        this.env.push({name: this.newKey, value: this.newValue});
        this.newKey=null;
        this.newValue=null;
      },
      deleteEnv(e){
        console.log("DEBUG DELETE", e);
        removeFromArray(this.env, e);
      },
      saveEnv(){
        const env=this.env.reduce((a, e)=>{
          a[e.name]=e.value;
          return a;
        }, {});
        SIO.emitGlobal("updateEnv", this.projectRootDir, this.rootComponentID, env, this.currentComponent.ID,  SIO.generalCallback);
      },
    }
  }
</script>