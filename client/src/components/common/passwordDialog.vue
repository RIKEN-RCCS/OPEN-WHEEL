/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-dialog
    v-model="openDialog"
    persistent
    :max-width="maxWidth"
  >
    <v-card
      :title="title"
    >
      <template
        v-if="jwtServerURL"
        #prepend
      >
        <v-avatar
          rounded="0"
          :image="img"
        />
      </template>
      <template
        v-if="jwtServerURL"
        #subtitle
      >
        if you forgot passphrase, go to <a
          target="_blank"
          :href="jwtServerURL"
        >{{ jwtServerURL }}</a> and generate JWT
      </template>
      <v-card-text>
        <v-form @submit.prevent>
          <v-text-field
            v-model="password"
            class="mx-6"
            autofocus
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPassword ? 'text' : 'password'"
            @click:append="showPassword = !showPassword"
          />
        </v-form>
        <v-card-actions>
          <buttons
            :buttons="buttons"
            @ok="submitPassword"
            @cancel="cancel"
          />
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script>
import buttons from "../../components/common/buttons.vue";
import loadComponentDefinition from "../../lib/componentDefinision.js";
const componentDefinitionObj = loadComponentDefinition();
export default {
  name: "PasswordDialog",
  components: {
    buttons
  },
  props: {
    value: Boolean,
    mode: { type: String, required: true },
    hostname: { type: String, required: true },
    jwtServerURL: { type: String, default: null },
    maxWidth: { type: String, default: "50%" }
  },
  emits: ["update:modelValue", "password", "cancel"],
  data: function () {
    return {
      img: componentDefinitionObj["hpciss"].img,
      showPassword: false,
      password: "",
      buttons: [
        { icon: "mdi-check", label: "ok" },
        { icon: "mdi-close", label: "cancel" }
      ]
    };
  },
  computed: {
    title() {
      return this.jwtServerURL === null ? `input ${this.mode} for ${this.hostname}` : `input JWT-server passphrase for ${this.jwtServerURL}`;
    },
    openDialog: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      }
    }
  },
  methods: {
    submitPassword() {
      this.$emit("password", this.password);
      this.closeDialog();
    },
    cancel() {
      this.$emit("cancel");
      this.closeDialog();
    },
    closeDialog() {
      this.password = "";
      this.openDialog = false;
    }
  }
};
</script>
