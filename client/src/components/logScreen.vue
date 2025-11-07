/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-sheet
    class="text-center"
    max-height="40vh"
    height="40vh"
    style="display: flex; flex-direction: column;"
  >
    <v-toolbar
      density="compact"
      color="background"
    >
      <v-btn
        variant="outlined"
        text="clear all log"
        @click="clearAllLog"
      />
      <v-menu
        v-model="categoryMenu"
        :close-on-content-click="false"
        location="bottom"
      >
        <template #activator="{ props }">
          <v-btn
            class="ml-4"
            variant="outlined"
            v-bind="props"
          >
            category
          </v-btn>
        </template>
        <v-card>
          <v-list density="compact">
            <v-list-group value="system">
              <template #activator="{ props }">
                <v-list-item
                  v-bind="props"
                  title="system"
                >
                  <template #prepend>
                    <v-checkbox
                      class="mt-5"
                      :model-value="systemChildrenSelected"
                      :indeterminate="systemChildrenPartiallySelected"
                      @click.prevent="toggleSystem"
                    />
                  </template>
                </v-list-item>
              </template>
              <v-list-item
                v-for="(item, i) in categories.system"
                :key="i"
              >
                <v-checkbox
                  v-model="selectedCategories"
                  :label="item"
                  :value="item"
                  density="compact"
                  hide-details
                />
              </v-list-item>
            </v-list-group>
            <v-list-group value="script">
              <template #activator="{ props }">
                <v-list-item
                  v-bind="props"
                  title="script"
                >
                  <template #prepend>
                    <v-checkbox
                      class="mt-5"
                      :model-value="scriptChildrenSelected"
                      :indeterminate="scriptChildrenPartiallySelected"
                      @click.prevent="toggleScript"
                    />
                  </template>
                </v-list-item>
              </template>
              <v-list-item
                v-for="(item, i) in categories.script"
                :key="i"
              >
                <v-checkbox
                  v-model="selectedCategories"
                  :label="item"
                  :value="item"
                  density="compact"
                  hide-details
                />
              </v-list-item>
            </v-list-group>
          </v-list>
        </v-card>
      </v-menu>
    </v-toolbar>
    <div
      ref="logContainer"
      style="overflow-y: scroll; flex-grow: 1; background-color: black; color: white; text-align: left; font-family: monospace; white-space: pre-wrap; padding: 5px;"
    >
      {{ filteredLogs }}
    </div>
  </v-sheet>
</template>

<script>
import { mapState } from "vuex";
import SIO from "../lib/socketIOWrapper.js";

const levelToCategoryMap = {
  INFO: "system",
  WARN: "system",
  ERROR: "system",
  FATAL: "system",
  STDOUT: "stdout",
  STDERR: "stderr",
  SSHOUT: "sshout"
};

export default {
  name: "LogScreen",
  props: {
    show: Boolean
  },
  data: ()=>{
    const categories = {
      system: ["info", "warn", "error"],
      script: ["stdout", "stderr", "sshout"]
    };
    return {
      logs: [],
      categories,
      selectedCategories: [...categories.system, ...categories.script],
      categoryMenu: false
    };
  },
  computed: {
    ...mapState(["projectRootDir"]),
    filteredLogs() {
      return this.logs
        .filter((log)=>{
          const level = log.level.toLowerCase();
          return this.selectedCategories.includes(level);
        })
        .map((log)=>{ return `[${log.timestamp}] [${log.level}] ${log.category} - ${log.message}`; })
        .join("");
    },
    systemChildrenSelected() {
      return this.categories.system.every((item)=>{ return this.selectedCategories.includes(item); }
      );
    },
    systemChildrenPartiallySelected() {
      const some = this.categories.system.some((item)=>{ return this.selectedCategories.includes(item); }
      );
      return some && !this.systemChildrenSelected;
    },
    scriptChildrenSelected() {
      return this.categories.script.every((item)=>{ return this.selectedCategories.includes(item); }
      );
    },
    scriptChildrenPartiallySelected() {
      const some = this.categories.script.some((item)=>{ return this.selectedCategories.includes(item); }
      );
      return some && !this.scriptChildrenSelected;
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.scrollToBottom();
      }
    },
    filteredLogs() {
      this.$nextTick(()=>{
        this.scrollToBottom();
      });
    }
  },
  mounted() {
    //Add a test message for debugging
    const timestamp = new Date().toISOString();
    this.logs.push({
      timestamp: timestamp,
      level: "INFO",
      category: "client",
      message: "Log screen initialized and listening for logs.\n",
      clientCategory: "system"
    });
  },
  methods: {
    toggleSystem() {
      if (this.systemChildrenSelected) {
        this.selectedCategories = this.selectedCategories.filter(
          (item)=>{ return !this.categories.system.includes(item); }
        );
      } else {
        this.selectedCategories = [
          ...this.selectedCategories,
          ...this.categories.system
        ];
      }
    },
    toggleScript() {
      if (this.scriptChildrenSelected) {
        this.selectedCategories = this.selectedCategories.filter(
          (item)=>{ return !this.categories.script.includes(item); }
        );
      } else {
        this.selectedCategories = [
          ...this.selectedCategories,
          ...this.categories.script
        ];
      }
    },
    onWheelLog(logData) {
      try {
        //log4js json layout adds a separator (e.g. comma), so we need to remove it before parsing
        const logString
          = typeof logData === "string" && logData.endsWith(",")
            ? logData.slice(0, -1)
            : logData;
        const logEvent
          = typeof logString === "string" ? JSON.parse(logString) : logString;

        const timestamp = new Date(logEvent.startTime).toISOString();
        const level = logEvent.level.levelStr;
        const category = logEvent.categoryName;
        const message = Array.isArray(logEvent.data)
          ? logEvent.data.join(" ")
          : logEvent.data;
        const clientCategory = levelToCategoryMap[level] || "system";

        this.logs.push({ timestamp, level, category, message: `${message}\n`, clientCategory });
      } catch (e) {
        //fallback for unstructured logs or parse errors
        console.error("Failed to parse log data:", logData, e);
        const message
          = typeof logData === "string" ? logData : JSON.stringify(logData);
        this.logs.push({
          timestamp: new Date().toISOString(),
          level: "INFO",
          category: "general",
          message: `${message}\n`,
          clientCategory: "system"
        });
      }
    },
    clearAllLog() {
      this.logs = [];
      this.selectedCategories = [];
      SIO.emitGlobal("aboutWheel", this.projectRootDir, ()=>{
        console.log("version info should be on INFO log");
      });
    },
    scrollToBottom() {
      const container = this.$refs.logContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }
};
</script>
