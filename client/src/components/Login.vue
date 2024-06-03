/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

<template>
  <v-app>
    <v-app-bar>
      <template #prepend>
        <v-img height=72px width=180px :src="imgLogo" alt="wheel title logo"/>
      </template>
      <v-app-bar-title
        class="text-lowercase text-decoration-none text-h5 white--text"
      >
        Login
      </v-app-bar-title>
    </v-app-bar>
    <v-main>
    <v-card class="mx-auto px-6 py-8" max-width=344>
      <v-form
        v-model="form"
        @submit.prevent="onSubmit"
      >
        <div data-cy="username">
        <v-text-field
          v-model="username"
          :readonly="loading"
          :rules="[required]"
          class="mb-2"
          label="username"
          clearable
        ></v-text-field>
      </div>

        <div data-cy="password">
        <v-text-field
          v-model="password"
          :readonly="loading"
          :rules="[required]"
          label="password"
          placeholder="Enter your password"
          :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          :type="showPassword ? 'text' : 'password'"
          @click:append="showPassword = !showPassword"
          clearable
        ></v-text-field>
      </div>
        <br>
        <div data-cy="submit">
        <v-btn
          :disabled="!form"
          :loading="loading"
          color="success"
          size="large"
          type="submit"
          variant="elevated"
          block
        >
          login
        </v-btn>
      </div>
      </v-form>
    </v-card>
    </v-main>
  </v-app>
</template>
<script>
import { required } from "@/lib/validationRules.js";
import imgLogo from "@/assets/wheel_logomark.png";

export default {
  name: "Login",
  data: ()=>{
    return {
      imgLogo,
      form: false,
      username: null,
      password: null,
      loading: false,
      showPassword: false
    }},

  methods: {
    async onSubmit () {
      if (!this.form) return
      this.loading = true
      const form = document.createElement("form");
      form.setAttribute("action", "./login");
      form.setAttribute("method", "post");
      form.style.display = "none";
      document.body.appendChild(form);
      const input = document.createElement("input");
      input.setAttribute("type", "hidden");
      input.setAttribute("name", "username");
      input.setAttribute("value", this.username);
      form.appendChild(input);
      const input2 = document.createElement("input");
      input2.setAttribute("type", "hidden");
      input2.setAttribute("name", "password");
      input2.setAttribute("value", this.password);
      form.appendChild(input2);
      form.submit();
    },
    required
  },
}
</script>

