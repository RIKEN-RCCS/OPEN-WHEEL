/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-sheet
    class="text-center"
  >
    <v-toolbar
      dense
    >
      <v-btn
        outlined
        @click="clearAllLog"
      >
        clear all log
      </v-btn>
      <v-tabs
        v-model="currentTab"
        @change="onChange"
      >
        <v-tab
          v-for="item in items"
          :key="item.id"
          :class="{'success--text': item.unread }"
        >
          {{ item.label }}
        </v-tab>
      </v-tabs>
    </v-toolbar>
    <v-tabs-items
      v-model="currentTab"
    >
      <v-tab-item
        v-for="item of items"
        :key="item.id"
        eager
        :transition="false"
        :reverse-transition="false"
      >
        <xterm
          :clear="item.clear"
          :log="item.log"
        />
      </v-tab-item>
    </v-tabs-items>
  </v-sheet>
</template>

<script>
  import xterm from "@/components/xterm.vue";
  export default {
    name: "LogScreen",
    components: {
      xterm,
    },
    props:{
      show: Boolean
    },
    data: ()=>{
      return {
        currentTab: 0,
        items: [
          { label: "info", id: "info",          clear: 0, log: "",unread: false, eventNames: ["logINFO", "logWARN", "logERR"] },
          { label: "stdout", id: "stdout",      clear: 0, log: "", unread: false, eventNames: ["logStdout"] },
          { label: "stderr", id: "stderr",      clear: 0, log: "", unread: false, eventNames: ["logStderr"] },
          { label: "output(SSH)", id: "sshout", clear: 0, log: "", unread: false, eventNames: ["logSSHout","logSSHerr"] },
        ],
      };
    },
    watch:{
      show(){
        if(!this.show){
          return;
        }
        this.onChange(this.currentTab);
      }
    },
    methods: {
      getItemByEventName(eventName){
        return this.items.find((item)=>{
          return item.eventNames.some((e)=>{return e=== eventName;});
        });
      },
      logRecieved(eventName, data){
        const item=this.getItemByEventName(eventName);
        this.newlog(item);
        item.log=data;
      },
      newlog: function(item){
        item.unread = item.id !== this.items[this.currentTab].id;
      },
      onChange: function(n){
        this.items[n].unread = false;
      },
      clearAllLog: function () {
        // $refsでxtermコンポーネントのclear()を呼び出す方法を使うと
        // Vue2 -> Vue3の移行時に作業量が増えるため、workaroundとしてclear propに変更があったら
        // xtermコンポーネントでclearを実行するようにしている。
        for (const item of this.items) {
          item.unread=false;
          item.clear = (item.clear+1)%2;
        }
      },
    },
  };
</script>
