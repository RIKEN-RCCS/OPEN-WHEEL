<template>
  <v-dialog
    v-model="openDialog"
    :max-width="maxWidth"
  >
    <v-card>
      <v-card-title>
        {{ title }}
      </v-card-title>
      <v-text-field
        v-model="password"
        class="mx-6"
        autofocus
        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
        :type="showPassword ? 'text' : 'password'"
        @click:append="showPassword = !showPassword"
      />
      <v-card-actions>
        <buttons
          :buttons="buttons"
          @ok="submitPassword"
          @cancel="closeDialog"
        />
      </v-card-actions>
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
          this.$emit("input", value);
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
