/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <versatile-dialog
    v-model="openDialog"
    max-width="60vw"
    title="Hostmapping"
    data-cy="hostmap_dialog-dialog"
    @ok="ok"
    @cancel="cancel"
  >
    <template #message>
      <v-row>
        <v-col cols="6">
          <p
            data-cy="hostmap_dialog-header_oldname-text_field"
          >
            hostname in project archive
          </p>
        </v-col>
        <v-col cols="6">
          <p
            data-cy="hostmap_dialog-header_newname-text_field"
          >
            newly assigned host
          </p>
        </v-col>
      </v-row>
      <v-divider class="border-opacity-100 mb-6" />
      <v-row
        v-for="(item,index) in hosts"
        :key="item.hostname"
      >
        <v-col cols="6">
          <v-text-field
            variant="underlined"
            :model-value="item.hostname"
            readonly
          />
        </v-col>
        <v-col cols="6">
          <v-combobox
            v-model="newHosts[index]"
            :items="hostCandidates"
            label="select or input host label"
            clearable
          />
        </v-col>
      </v-row>
    </template>
  </versatile-dialog>
</template>
<script>
import { mapState } from "vuex";
import versatileDialog from "../components/versatileDialog.vue";

export default {
  name: "HostMapDialog",
  components: {
    versatileDialog
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    hosts: {
      type: Array,
      required: true
    }
  },
  emits: [
    "update:modelValue",
    "ok",
    "cancel"
  ],
  data: function () {
    return {
      newHosts: []
    };
  },
  computed: {
    ...mapState(["remoteHost"]),
    hostCandidates() {
      const hostInRemoteHost = this.remoteHost.map((e)=>{
        return e.name;
      });
      return ["localhost", ...hostInRemoteHost];
    },
    openDialog: {
      get() {
        return this.modelValue;
      },
      set(v) {
        this.$emit("update:modelValue", v);
      }
    }
  },
  watch: {
    hosts() {
      const length = this.hosts.length;
      const localhosts = new Array(length);

      for (let i; i < length; i++) {
        localhosts[i] = "localhost";
      }
      this.newHosts.splice(0, this.hosts.length, ...localhosts);
    }
  },
  methods: {
    ok() {
      this.openDialog = false;
      const hostMap = {};
      for (let index = 0; index < this.hosts.length; index++) {
        hostMap[this.hosts[index].hostname] = this.newHosts[index];
      }
      this.$emit("ok", hostMap);
      this.newHosts.splice(0, this.newHosts.length);
    },
    cancel() {
      this.openDialog = false;
      this.$emit("cancel");
      this.newHosts.splice(0, this.newHosts.length);
    }
  }
};
</script>
