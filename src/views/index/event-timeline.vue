<script setup lang="ts">
import { computed, onMounted, reactive } from "vue";
import dayjs from "dayjs";
import { leftBottom, rightBottom } from "@/api";
import { ElMessage } from "element-plus";

type TimelineEventType = "alert" | "online" | "offline";

type TimelineEvent = {
  key: string;
  eventType: TimelineEventType;
  eventTypeLabel: string;
  occurredAt: string;
  title: string;
  meta: string;
  timestamp: number;
};

type TimelineMarker = TimelineEvent & {
  percent: number;
  lane: number;
};

const RANGE_DAYS = 30;
const ALERT_LIMIT = 10;
const DEVICE_STATE_LIMIT = 5;

const state = reactive({
  loading: true,
  markers: [] as TimelineMarker[],
  alertCount: 0,
  onlineCount: 0,
  offlineCount: 0,
});

const rangeStart = computed(() =>
  dayjs().subtract(RANGE_DAYS - 1, "day").startOf("day")
);
const rangeEnd = computed(() => dayjs().endOf("day"));
const totalRangeMs = computed(() => Math.max(rangeEnd.value.valueOf() - rangeStart.value.valueOf(), 1));

const baseTimeRangeParams = computed(() => ({
  startTime: rangeStart.value.format("YYYY-MM-DD HH:mm:ss"),
  endTime: rangeEnd.value.format("YYYY-MM-DD HH:mm:ss"),
}));

const isSuccess = (res: any) => res?.success === true || res?.code === 0;
const getPayload = (res: any) => res?.data ?? {};
const getSiteName = (item: any) => item.siteName || "未绑定站点";
const getDeviceName = (item: any) => item.nickname || item.deviceName || "未命名设备";

const clampPercent = (percent: number) => Math.min(96, Math.max(4, percent));

const buildAlertEvents = (list: any[]): TimelineEvent[] =>
  list
    .map((item) => {
      const occurredAt = item.createTime;
      const timestamp = dayjs(occurredAt).valueOf();
      return {
        key: `alert-${item.id}`,
        eventType: "alert" as const,
        eventTypeLabel: item.alertLevel != null ? `告警 L${item.alertLevel}` : "告警",
        occurredAt,
        title: getDeviceName(item),
        meta: getSiteName(item),
        timestamp,
      };
    })
    .filter((item) => Number.isFinite(item.timestamp));

const buildStateEvents = (list: any[]): TimelineEvent[] =>
  list
    .map((item) => {
      const isOnline = Number(item.onlineState) === 1;
      const occurredAt = item.createTime;
      const timestamp = dayjs(occurredAt).valueOf();
      return {
        key: `state-${item.id}`,
        eventType: isOnline ? ("online" as const) : ("offline" as const),
        eventTypeLabel: isOnline ? "设备上线" : "设备离线",
        occurredAt,
        title: getDeviceName(item),
        meta: getSiteName(item),
        timestamp,
      };
    })
    .filter((item) => Number.isFinite(item.timestamp));

const buildFlatMarkers = (events: TimelineEvent[]): TimelineMarker[] => {
  if (!events.length) {
    return [];
  }
  const span = events.length === 1 ? 0 : 92 / (events.length - 1);
  return events.map((item, index) => ({
    ...item,
    percent: events.length === 1 ? 50 : clampPercent(4 + index * span),
    lane: index % 2,
  }));
};

const fetchData = async () => {
  state.loading = true;
  try {
    const [alertRes, stateRes] = await Promise.all([
      rightBottom({
        ...baseTimeRangeParams.value,
        limitNum: ALERT_LIMIT,
      }),
      leftBottom({
        ...baseTimeRangeParams.value,
        limitNum: DEVICE_STATE_LIMIT,
      }),
    ]);

    if (!isSuccess(alertRes)) {
      throw new Error(alertRes?.msg || "获取告警事件失败");
    }
    if (!isSuccess(stateRes)) {
      throw new Error(stateRes?.msg || "获取设备状态事件失败");
    }

    const alertList = Array.isArray(getPayload(alertRes).list) ? getPayload(alertRes).list : [];
    const stateList = Array.isArray(getPayload(stateRes).list) ? getPayload(stateRes).list : [];
    const merged = [...buildAlertEvents(alertList), ...buildStateEvents(stateList)]
      .sort((a, b) => a.timestamp - b.timestamp);

    state.markers = buildFlatMarkers(merged);
    state.alertCount = Number(getPayload(alertRes).total ?? alertList.length);
    state.onlineCount = Number(getPayload(stateRes).totalOnline ?? stateList.filter((item: any) => Number(item.onlineState) === 1).length);
    state.offlineCount = Number(getPayload(stateRes).totalOffline ?? stateList.filter((item: any) => Number(item.onlineState) !== 1).length);
  } catch (error: any) {
    ElMessage.error(error?.message || error || "加载关键事件失败");
  } finally {
    state.loading = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="axis-wrap">
    <div class="axis-head">
      <div class="axis-title-group">
        <span class="axis-title">近期关键事件</span>
        <span class="axis-subtitle">时间轴仅展示告警10条 + 上下线5条</span>
      </div>
      <div class="axis-legend">
        <span class="legend-item alert">告警 {{ state.alertCount }}</span>
        <span class="legend-item online">上线 {{ state.onlineCount }}</span>
        <span class="legend-item offline">离线 {{ state.offlineCount }}</span>
      </div>
    </div>

    <div class="axis-stage">
      <div class="axis-baseline"></div>
      <div class="axis-scale start">30天前</div>
      <div class="axis-scale end">现在</div>

      <template v-if="state.markers.length">
        <div
          v-for="item in state.markers"
          :key="item.key"
          class="axis-marker"
          :class="[item.eventType, `lane-${item.lane}`]"
          :style="{ left: `${item.percent}%` }"
        >
          <div class="marker-note">
            <div class="note-date">{{ dayjs(item.occurredAt).format("MM-DD") }}</div>
            <div class="note-time">{{ dayjs(item.occurredAt).format("HH:mm") }}</div>
            <div class="note-type">{{ item.eventTypeLabel }}</div>
            <div class="note-title" :title="item.title">{{ item.title }}</div>
            <div class="note-meta" :title="item.meta">{{ item.meta }}</div>
          </div>
          <div class="marker-stick"></div>
          <div class="marker-dot"></div>
        </div>
      </template>

      <div v-else class="axis-empty">
        <span>{{ state.loading ? "关键事件加载中..." : "近30天暂无关键事件" }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.axis-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 6px 10px 0;
  box-sizing: border-box;
}

.axis-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.axis-title-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.axis-title {
  font-size: 16px;
  font-weight: bold;
  color: #00f2ff;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.5);
}

.axis-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.axis-legend {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.legend-item {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.05);
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;

  &.alert {
    color: #ff4d4d;
    border-color: rgba(255, 77, 77, 0.3);
    background: rgba(255, 77, 77, 0.1);
  }

  &.online {
    color: #00ff95;
    border-color: rgba(0, 255, 149, 0.3);
    background: rgba(0, 255, 149, 0.1);
  }

  &.offline {
    color: #ffea00;
    border-color: rgba(255, 234, 0, 0.3);
    background: rgba(255, 234, 0, 0.1);
  }
}

.axis-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 14px 28px 20px;
  overflow: hidden;
}

.axis-baseline {
  position: absolute;
  left: 28px;
  right: 28px;
  bottom: 24px;
  height: 1px;
  background: linear-gradient(90deg, 
    rgba(0, 242, 255, 0) 0%, 
    rgba(0, 242, 255, 0.5) 20%, 
    rgba(0, 242, 255, 0.5) 80%, 
    rgba(0, 242, 255, 0) 100%
  );
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 4px;
    transform: translateY(-50%);
    background: radial-gradient(ellipse at center, rgba(0, 242, 255, 0.15) 0%, transparent 70%);
  }
}

.axis-scale {
  position: absolute;
  bottom: 2px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  font-family: "PingFang SC", sans-serif;
  letter-spacing: 1px;

  &.start {
    left: 28px;
  }

  &.end {
    right: 28px;
  }
}

.axis-marker {
  position: absolute;
  bottom: 24px;
  transform: translateX(-50%);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 5;
  animation: marker-float 8s ease-in-out infinite;

  // 增加动画随机性
  &:nth-child(3n) {
    animation-duration: 7s;
    animation-delay: -1s;
  }
  &:nth-child(3n+1) {
    animation-duration: 9s;
    animation-delay: -3s;
  }
  &:nth-child(3n+2) {
    animation-duration: 10s;
    animation-delay: -5s;
  }

  &:hover {
    z-index: 10;
    animation-play-state: paused;
    .marker-note {
      background: rgba(10, 24, 43, 0.98);
      border-color: #00f2ff;
      transform: translateX(-50%) scale(1.1);
      box-shadow: 0 0 30px rgba(0, 242, 255, 0.3), inset 0 0 10px rgba(0, 242, 255, 0.1);
    }
    .marker-dot {
      transform: scale(1.3);
      border-color: #fff;
    }
  }

  &.alert {
    animation-name: marker-float-alert;
    .marker-dot {
      background: #ff4d4d;
      box-shadow: 0 0 15px rgba(255, 77, 77, 0.6);
    }
    .marker-stick {
      background: linear-gradient(to top, #ff4d4d, transparent);
      width: 2px;
    }
    .note-type {
      color: #ff4d4d;
      background: rgba(255, 77, 77, 0.1);
    }
  }

  &.online {
    .marker-dot {
      background: #00ff95;
      box-shadow: 0 0 15px rgba(0, 255, 149, 0.6);
    }
    .marker-stick {
      background: linear-gradient(to top, #00ff95, transparent);
    }
    .note-type {
      color: #00ff95;
      background: rgba(0, 255, 149, 0.1);
    }
  }

  &.offline {
    .marker-dot {
      background: #ffea00;
      box-shadow: 0 0 15px rgba(255, 234, 0, 0.6);
    }
    .marker-stick {
      background: linear-gradient(to top, #ffea00, transparent);
    }
    .note-type {
      color: #ffea00;
      background: rgba(255, 234, 0, 0.1);
    }
  }
}

.marker-note {
  position: absolute;
  left: 50%;
  width: 100px;
  padding: 8px 6px;
  transform: translateX(-50%);
  border-radius: 13px; // 略微减小圆角，更紧凑
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(7, 18, 34, 0.85);
  backdrop-filter: blur(8px);
  text-align: center;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 12px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent, rgba(255, 255, 255, 0.1));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

.note-date {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 0px; // 压缩间距
  font-family: "DIN Alternate", sans-serif;
}

.note-time {
  font-size: 13px; // 缩小字号
  font-weight: 900;
  color: #fff;
  margin-bottom: 2px; // 压缩间距
  font-family: "DIN Alternate", sans-serif;
  letter-spacing: 0.5px;
}

.note-type {
  font-size: 10px; // 缩小字号
  font-weight: bold;
  margin-bottom: 2px; // 压缩间距
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
}

.note-title {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  margin-bottom: 2px;
}

.note-meta {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lane-0 {
  .marker-note {
    bottom: 20px;
  }
  .marker-stick {
    height: 10px;
  }
}

.lane-1 {
  .marker-note {
    bottom: 50px;
  }
  .marker-stick {
    height: 40px;
  }
}

.marker-stick {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 1px;
  transform: translateX(-50%);
  opacity: 0.4;
}

.marker-dot {
  position: relative;
  z-index: 1;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
}

@keyframes marker-float {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-6px);
  }
}

@keyframes marker-float-alert {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-8px);
  }
}

.axis-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(219, 235, 255, 0.64);
  font-size: 14px;
}
</style>
