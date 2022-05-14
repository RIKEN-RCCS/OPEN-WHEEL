<template>
  <div
    id="node_svg"
    @drop="onDrop($event)"
    @dragover.prevent
    @dragenter.prevent
  >
    <v-btn
      fab
      absolute
      class="mt-6 ml-2"
      :disabled="! isEdittable"
      @click.stop="openEnvironmentVariableSetting"
    >
      <v-icon>
        mdi-cog
      </v-icon>
    </v-btn>
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
            disable-filterling
            disable-pagination
            hide-default-header
            hide-default-footer
          >
            <template #item.name="props">
              <v-edit-dialog
                persistent
                :return-value.sync="props.item.name"
              >
                {{ props.item.name }}
                <template #input>
                  <v-text-field
                    v-model="props.item.name"
                    label="Edit"
                    single-line
                  />
                </template>
              </v-edit-dialog>
            </template>
            <template #item.value="props">
              <v-edit-dialog
                persistent
                :return-value.sync="props.item.value"
              >
                {{ props.item.value }}
                <template #input>
                  <v-text-field
                    v-model="props.item.value"
                    label="Edit"
                    single-line
                  />
                </template>
              </v-edit-dialog>
            </template>
            <template #item.actions="{ item }">
              <action-row
                :item="item"
                :can-edit="false"
                @delete="deleteEnv"
              />
            </template>
            <template
              #footer
            >
              <v-row>
                <v-col cols="5">
                  <v-text-field
                    v-model="newKey"
                    label="name"
                    outlined
                    dense
                    clearable
                  />
                </v-col>
                <v-col cols="5">
                  <v-text-field
                    v-model="newValue"
                    outlined
                    dense
                    label="value"
                    clearable
                  />
                </v-col>
                <v-col cols="auto">
                  <v-btn
                    @click="addEnv"
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
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
  </div>
</template>

<script>
  import { mapState, mapMutations, mapGetters } from "vuex";
  import SVG from "svgjs/dist/svg.js";
  import "svg.draggable.js/dist/svg.draggable.js";
  import SIO from "@/lib/socketIOWrapper.js";
  import drawComponents from "@/lib/oldSVG/drawComponents.js";
  import actionRow from "@/components/common/actionRow.vue";
  import buttons from "@/components/common/buttons.vue";
  import { widthComponentLibrary, heightToolbar, heightDenseToolbar, heightFooter } from "@/lib/componentSizes.json";
  import { removeFromArray } from "@/lib/clientUtility.js";

  export default {
    name: "ComponentGraph",
    components: {
      actionRow,
      buttons
    },
    data: function () {
      return {
        svg: null,
        envSetting: false,
        env: [],
        newKey: null,
        newValue:null,
        headers:[
          {text: "name", value: "name"},
          {text: "value", value: "value" },
          {text: "" ,value: "actions"}
        ]
      };
    },
    computed: {
      ...mapState(["projectState", "currentComponent", "projectRootDir","rootComponentID"]),
      ...mapGetters(["currentComponentAbsPath", "isEdittable"]),
    },
    watch: {
      currentComponent: function () {
        drawComponents(this.currentComponent,
                       this.svg,
                       this.projectState,
                       this.projectRootDir,
                       this.$store.commit.bind(this),
                       this.$store.dispatch.bind(this),
                       this.currentComponent.ID
        );
      },
    },
    mounted: function () {
      this.svg = SVG("node_svg");
      this.fit();
      window.addEventListener("resize", this.fit.bind(this));

      if(this.currentComponent !== null){
        drawComponents(this.currentComponent,
                       this.svg,
                       this.projectState,
                       this.projectRootDir,
                       this.$store.commit.bind(this),
                       this.$store.dispatch.bind(this),
                       this.currentComponent.ID 
        );
      }
    },
    beforeDestroy: function () {
      window.removeEventListener("resize", this.fit.bind(this));
    },
    methods: {
      ...mapMutations(
        {
          commitComponentTree: "componentTree",
          commitCanvasWidth: "canvasWidth",
          commitCanvasHeight: "canvasHeight",
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
        removeFromArray(this.env, e);
      },
      saveEnv(){
        const env=this.env.reduce((a, e)=>{
          a[e.name]=e.value;
          return a;
        }, {});
        SIO.emitGlobal("updateEnv", this.projectRootDir, this.rootComponentID, env, this.currentComponent.ID,  SIO.generalCallback);
      },
      onDrop (event) {
        const offsetX = event.dataTransfer.getData("offsetX");
        const offsetY = event.dataTransfer.getData("offsetY");
        const type = event.dataTransfer.getData("type");

        const payload = {
          type,
          pos: {
            x: event.clientX - widthComponentLibrary - offsetX,
            y: event.clientY - heightToolbar - heightDenseToolbar * 2 - offsetY,
          },
          path: this.currentComponentAbsPath,
        };
        if (payload.type === "parameterStudy") {
          payload.type = "PS";
        }
        // if (payload.pos.x < 0 || this.canvasWidth + widthComponentLibrary < payload.pos.x ||
        //   payload.pos.y < 0 || this.canvasHeight + heightToolbar + heightDenseToolbar * 2 < payload.pos.y) {
        //   console.log("DEUBG: out of range drop!", payload.pos);
        // }

        SIO.emitGlobal("createNode", this.projectRootDir, payload, this.currentComponent.ID, SIO.generalCallback);
      },
      fit: function () {
        const magicNumber = 17;
        const baseWidth = window.innerWidth < this.$parent.$parent.$el.clientWidth ? window.innerWidth : this.$parent.$parent.$el.clientWidth;
        const width = baseWidth - widthComponentLibrary - 1;
        const height = window.innerHeight - heightToolbar - heightDenseToolbar * 2 - heightFooter - magicNumber;

        if (width > 0 && height > 0) {
          this.commitCanvasWidth(width);
          this.commitCanvasHeight(height);
          this.svg.size(width, height);
        }
      },
    },
  };
</script>
