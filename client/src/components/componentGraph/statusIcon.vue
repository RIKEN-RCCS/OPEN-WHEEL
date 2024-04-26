<template>
  <g>
    <circle :cx=x :cy=y :r=radius stroke=black fill="black" />
    <path :d=successCmd stroke=black fill="#88BB00" v-if=showPiChart />
    <path :d=failedCmd  stroke=black fill="#E60000" v-if=showPiChart />
    <circle :cx=x :cy=y :r=radius stroke=black fill="#88BB00" v-if="showPiChart && successRatio === 100"/>
    <circle :cx=x :cy=y :r=radius stroke=black fill="#E60000" v-if="showPiChart && failedRatio === 100"/>
    <circle :cx=x :cy=y :r=radius*0.8 stroke=black fill="black" v-if="state !== 'not-started'" />
    <image :href=iconImg :x=x-radius*0.4*2 :y=y-radius*0.4*2 :width=radius*0.8*2 :height=radius*0.8*2 v-if="state !== 'not-started'" />
 </g>
</template>
<script>
"use strict";
import { textHeight } from "@/lib/constants.json";
import imgNotStarted from "@/assets/img_stateQue.png";
import imgRunning from "@/assets/img_statePlay.png";
import imgFinished from "@/assets/img_stateDone.png";
import imgError from "@/assets/img_error.png";

const stateIcon = {
  "not-started": imgNotStarted,
  "stage-in": imgRunning,
  "running": imgRunning,
  "stage-out": imgRunning,
  "finished": imgFinished,
  "failed": imgError,
  "unknown": imgError
};

export default {
  name: "status-icon",
  props: {
    x: {
      required: true,
      type: Number
    },
    y: {
      required: true,
      type: Number
    },
    state: {
      required: true,
      type: String
    },
    numTotal: {
      type: Number
    },
    numFinished: {
      type: Number
    },
    numFailed: {
      type: Number
    }
  },
  computed: {
    successRatio() {
      return this.numFinished / this.numTotal * 100;
    },
    failedRatio() {
      return this.numFailed / this.numTotal * 100;
    },
    showPiChart() {
      return Number.isInteger(this.numTotal) && this.numTotal > 0
        && Number.isInteger(this.numFinished) && this.numFinished >= 0
        && Number.isInteger(this.numFailed) && this.numFailed >= 0;
    },
    successChartEndCoord() {
      return { x: this.x + this.radius * Math.sin(this.successRatio / 100 * Math.PI * 2),
        y: this.y - this.radius * Math.cos(this.successRatio / 100 * Math.PI * 2) };
    },
    failedChartEndCoord() {
      return { x: this.x + this.radius * Math.sin((this.successRatio + this.failedRatio) / 100 * Math.PI * 2),
        y: this.y - this.radius * Math.cos((this.successRatio + this.failedRatio) / 100 * Math.PI * 2) };
    },
    successCmd() {
      return `M ${this.x} ${this.y}
                v -${this.radius}
                A ${this.radius}  ${this.radius} 0 ${this.successRatio > 50 ? 1 : 0} 1
                  ${this.successChartEndCoord.x} ${this.successChartEndCoord.y}
                L ${this.x} ${this.y}
                Z`;
    },
    failedCmd() {
      return `M ${this.x} ${this.y}
                L ${this.successChartEndCoord.x} ${this.successChartEndCoord.y}
                A ${this.radius}  ${this.radius} 0 ${this.failedRatio > 50 ? 1 : 0} 1
                  ${this.failedChartEndCoord.x} ${this.failedChartEndCoord.y}
                L ${this.x} ${this.y}
                Z`;
    },
    iconImg() {
      return stateIcon[this.state];
    }
  },
  data() {
    return {
      radius: textHeight * 0.8 / 2
    };
  }
};

</script>
