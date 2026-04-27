<template>
  <ul class="user_Overview flex justify-around items-center">
    <li class="user_Overview-item" v-for="item in config" :key="item.key" :style="{ '--color': item.color }">
      <div class="user_Overview_nums">
        <div class="circle-wrap">
          <!-- 背景装饰环 -->
          <div class="ring-bg"></div>
          <!-- 呼吸发光环 -->
          <div class="ring-glow"></div>
          <!-- 扫描环 -->
          <div class="ring-scan"></div>
          <!-- 刻度环 -->
          <div class="ring-ticks"></div>
          <!-- 数字 -->
          <div class="num">
            <CountUp :endVal="state[item.key]" :duration="duration" />
          </div>
        </div>
      </div>
      <p class="label">{{ item.label }}</p>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import { countDeviceNum } from "@/api";
import CountUp from "@/components/count-up";
import { ElMessage } from "element-plus";

const duration = ref(2);
const state = reactive<Record<string, number>>({
  alarmNum: 0,
  offlineNum: 0,
  onlineNum: 0,
  totalNum: 0,
});

const config = [
  { key: "totalNum", label: "总设备数", color: "#00f2ff", rgb: "0, 242, 255" },
  { key: "onlineNum", label: "在线数", color: "#00ff95", rgb: "0, 255, 149" },
  { key: "offlineNum", label: "掉线数", color: "#ffea00", rgb: "255, 234, 0" },
  { key: "alarmNum", label: "告警次数", color: "#ff4d4d", rgb: "255, 77, 77" },
];

const isSuccess = (res: any) => res?.success === true || res?.code === 0;
const getPayload = (res: any) => res?.data || {};

const getData = () => {
  countDeviceNum()
    .then((res) => {
      if (isSuccess(res)) {
        const data = getPayload(res);
        state.alarmNum = Number(data.alertRecordCount ?? 0);
        state.offlineNum = Number(data.deviceOfflineCount ?? 0);
        state.onlineNum = Number(data.deviceOnlineCount ?? 0);
        state.totalNum = Number(data.deviceCount ?? 0);
      } else {
        ElMessage.error(res?.msg || "获取设备总览失败");
      }
    })
    .catch((err) => {
      ElMessage.error(err);
    });
};
getData();
</script>

<style scoped lang="scss">
.user_Overview {
  width: 100%;
  height: 100%;
  padding: 20px 0;

  .user_Overview-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;

    .user_Overview_nums {
      width: 120px;
      height: 120px;
      position: relative;
      margin-bottom: 15px;

      .circle-wrap {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;

        .num {
          font-size: 26px;
          font-weight: bold;
          color: var(--color);
          text-shadow: 0 0 10px var(--color);
          z-index: 2;
        }

        // 背景实线环
        .ring-bg {
          position: absolute;
          width: 80%;
          height: 80%;
          border: 2px solid rgba(255, 255, 255, 0.05);
          border-radius: 50%;
        }

        // 呼吸弧形环
        .ring-glow {
          position: absolute;
          width: 82%;
          height: 82%;
          border: 3px solid transparent;
          border-top-color: var(--color);
          border-left-color: var(--color);
          border-radius: 50%;
          opacity: 0.8;
          filter: drop-shadow(0 0 5px var(--color));

          &::after {
            content: "";
            position: absolute;
            top: 6px;
            right: 15%;
            width: 6px;
            height: 6px;
            background: #fff;
            border-radius: 50%;
            box-shadow: 0 0 10px var(--color), 0 0 20px var(--color);
          }
        }

        // 刻度装饰环 - 模拟刻度盘
        .ring-ticks {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: repeating-conic-gradient(
            from 0deg,
            var(--color) 0deg 1deg,
            transparent 1deg 4deg
          );
          mask-image: radial-gradient(transparent 48%, black 50%, black 54%, transparent 56%);
          -webkit-mask-image: radial-gradient(transparent 48%, black 50%, black 54%, transparent 56%);
          opacity: 0.4;
        }

        // 内部装饰环
        .ring-scan {
          position: absolute;
          width: 70%;
          height: 70%;
          border-radius: 50%;
          border: 1px solid var(--color);
          opacity: 0.2;
          animation: scan-breathe 3s ease-in-out infinite;
        }
      }
    }

    .label {
      font-size: 14px;
      color: #ffffff;
      font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
      font-weight: bold;
      letter-spacing: 2px;
      padding: 4px 12px;
      background: rgba(var(--color-rgb, 0, 242, 255), 0.1);
      border: 1px solid rgba(var(--color-rgb, 0, 242, 255), 0.2);
      border-radius: 4px;
      position: relative;
      transition: all 0.3s;
      text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);

      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 10px;
        background: var(--color);
        border-radius: 2px;
        box-shadow: 0 0 5px var(--color);
      }
    }
  }
}

@keyframes scan-breathe {
  0%, 100% {
    transform: scale(0.95);
    opacity: 0.1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.3;
  }
}

@keyframes breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.6;
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
