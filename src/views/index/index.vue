<script setup lang="ts">
import ItemWrap from "@/components/item-wrap";
import LeftTop from "./left-top.vue";
import LeftCenter from "./left-center.vue";
import CenterMap from "./center-map.vue";
import RightTop from "./right-top.vue";
import RightCenter from "./right-center.vue";
import EventTimeline from "./event-timeline.vue";
</script>

<template>
  <div class="index-shell">
    <div class="index-box">
      <div class="contetn_left">
        <ItemWrap class="contetn_lr-item" title="设备总览">
          <LeftTop />
        </ItemWrap>
        <ItemWrap class="contetn_lr-item contetn_left-center" title="设备数量统计">
          <LeftCenter />
        </ItemWrap>
      </div>

      <div class="contetn_center">
        <CenterMap class="contetn_center_top" title="设备分布图" />
      </div>

      <div class="contetn_right">
        <ItemWrap class="contetn_lr-item" title="消息统计">
          <RightTop />
        </ItemWrap>
        <ItemWrap class="contetn_lr-item contetn_right-center" title="站点告警排名(TOP8)" style="padding: 0 10px 16px 10px">
          <RightCenter />
        </ItemWrap>
      </div>
    </div>

    <ItemWrap class="timeline-overlay" title="">
      <EventTimeline />
    </ItemWrap>
  </div>
</template>

<style scoped lang="scss">
.index-shell {
  position: relative;
  width: 100%;
  min-height: calc(100% - 64px);
}

.index-box {
  width: 100%;
  min-height: calc(100% - 64px);
  display: flex;
  justify-content: space-between;
}

.contetn_left,
.contetn_right {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  width: 520px;
  box-sizing: border-box;
  flex-shrink: 0;
  z-index: 9;
  pointer-events: none;
}

.contetn_center {
  flex: 1;
  min-height: 920px;
  margin: 0 -100px;
  position: relative;
  z-index: 1;
}

.contetn_lr-item {
  height: 310px;
  pointer-events: auto;
}

.contetn_left-center,
.contetn_right-center {
  margin-top: 16px;
}

.timeline-overlay {
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  width: clamp(1920px, 64vw, 1280px);
  max-width: calc(100% - 120px);
  height: 280px;
  z-index: 12;
  pointer-events: auto;
}
</style>
