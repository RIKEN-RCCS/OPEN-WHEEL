/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

<template>
  <v-card>
  <v-card-title>
    webhook setting
  </v-card-title>
  <v-card-text>
    <v-text-field
      label="URL"
    />
    <v-checkbox
      text="project status changed"
    />
    <v-checkbox
      text="component status changed"
    />
  </v-card-text>
  </v-card>
</template>
<script>
export default {
  name: "webhookSettingDialog"
};
</script>
