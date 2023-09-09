/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-dialog
    v-model="openDialog"
    :max-width="maxWidth"
  >
    <v-card
      :title=title
      :subtitle=message
    >
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
            @cancel="closeDialog"
          />
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script>
import buttons from "@/components/common/buttons.vue";
export default {
  name: "PasswordDialog",
  components: {
    buttons,
  },
  props: {
    value: Boolean,
    title: { type: String, default: "input password" },
    maxWidth: { type: String, default: "50%" },
  },
  data: function () {
    return {
      showPassword: false,
      password: "",
      buttons: [
        { icon: "mdi-check", label: "ok" },
        { icon: "mdi-close", label: "cancel" },
      ],
    };
  },
  computed: {
    openDialog: {
      get () {
        return this.value;
      },
      set (value) {
        this.$emit("update:modelValue", value);
      },
    },
  },
  methods: {
    submitPassword () {
      this.$emit("password", this.password);
      this.closeDialog();
    },
    cancel () {
      this.$emit("cancel");
      this.closeDialog();
    },
    closeDialog () {
      this.password = "";
      this.openDialog = false;
    },
  },
};
</script>
