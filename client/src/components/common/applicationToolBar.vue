/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-app-bar>
    <template #prepend>
      <a
        :href="homeURL"
        data-cy="tool_bar-wheel_logo-logo"
      >
        <v-tooltip
          location="right"
          text="Go to Home Page"
        >
          <template #activator="{ props }">
            <v-img
              v-bind="props"
              height="72px"
              width="180px"
              :src="imgLogo"
              alt="wheel title logo"
            />
          </template>
        </v-tooltip>
      </a>
    </template>
    <v-app-bar-title
      class="text-lowercase text-decoration-none text-h5 white--text"
    >
      {{ title }}
    </v-app-bar-title>
    <slot name="append" />
    <template #append>
      <v-tooltip
        location="bottom"
        :text="connectionStatus"
      >
        <template #activator="{ props }">
          <v-icon
            v-bind="props"
            :color="connectionColor"
            size="small"
            data-cy="tool_bar-connection-status"
          >
            {{ connectionIcon }}
          </v-icon>
        </template>
      </v-tooltip>
      <v-app-bar-nav-icon
        data-cy="tool_bar-navi-icon"
        @click="$emit('navIconClick')"
      />
    </template>
    <template #extension>
      <slot name="extension" />
    </template>
  </v-app-bar>
</template>

<script>
import imgLogo from "../../assets/wheel_logomark.png";
import SIO from "../../lib/socketIOWrapper.js";

export default {
  props: {
    title: {
      type: String,
      required: true
    },
    baseUrl: {
      type: String,
      default: "."
    }
  },
  emits: ["navIconClick"],
  data: ()=>{
    return {
      imgLogo,
      isConnected: false,
      connectionCheckInterval: null
    };
  },
  computed: {
    homeURL() {
      return `${this.baseUrl}/home`;
    },
    connectionIcon() {
      return this.isConnected ? "mdi-lan-connect" : "mdi-lan-disconnect";
    },
    connectionColor() {
      return this.isConnected ? "success" : "error";
    },
    connectionStatus() {
      return this.isConnected ? "Connected to server" : "Disconnected from server";
    }
  },
  mounted() {
    // Update connection status immediately and on events
    const updateConnectionStatus = () => {
      this.isConnected = SIO.isConnected();
    };
    
    updateConnectionStatus();
    
    // Listen for connection events
    SIO.onConnect(() => {
      this.isConnected = true;
    });
    
    SIO.onDisconnect(() => {
      this.isConnected = false;
    });
    
    // Poll connection status every second as a fallback
    this.connectionCheckInterval = setInterval(updateConnectionStatus, 1000);
  },
  beforeUnmount() {
    // Clean up interval
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
  }
};
</script>
