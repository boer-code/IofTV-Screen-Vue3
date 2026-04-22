<script setup lang="ts">
import { rightBottom } from "@/api";
import SeamlessScroll from "@/components/seamless-scroll";
import { computed, onMounted, reactive } from "vue";
import { useSettingStore } from "@/stores";
import { storeToRefs } from "pinia";
import EmptyCom from "@/components/empty-com";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";

const settingStore = useSettingStore();
const { defaultOption, indexConfig } = storeToRefs(settingStore);
const state = reactive<any>({
  list: [],
  defaultOption: {
    ...defaultOption.value,
    singleHeight: 252,
    limitScrollNum: 3,
    // step:3
  },
  scroll: true,
});

const getData = () => {
  rightBottom({ limitNum: 20 })
    .then((res) => {
      console.log("右下", res);
      if (res?.success === true || res?.code === 0) {
        state.list = res?.data?.list || [];
      } else {
        ElMessage({
          message: res?.msg || "获取告警消息失败",
          type: "warning",
        });
      }
    })
    .catch((err) => {
      ElMessage.error(err);
    });
};

const comName = computed(() => {
  if (indexConfig.value.rightBottomSwiper) {
    return SeamlessScroll;
  } else {
    return EmptyCom;
  }
});
const formatValue = (val: any) => (val !== undefined && val !== null && val !== "" ? String(val) : "--");
const formatTime = (val: any) => (val ? dayjs(val).format("YYYY-MM-DD HH:mm:ss") : "--");
const handleAddress = (item: any) => item.address || item.siteName || "--";
const handleDevice = (item: any) => item.deviceName || "--";
const handleLevel = (item: any) => item.alertLevel ?? "--";
const handleContent = (item: any) => item.alertDetail || item.alertName || "--";
onMounted(() => {
  getData();
});
</script>

<template>
  <div class="right_bottom_wrap beautify-scroll-def" :class="{ 'overflow-y-auto': !indexConfig.rightBottomSwiper }">
    <component
      :is="comName"
      :list="state.list"
      v-model="state.scroll"
      :singleHeight="state.defaultOption.singleHeight"
      :step="state.defaultOption.step"
      :limitScrollNum="state.defaultOption.limitScrollNum"
      :hover="state.defaultOption.hover"
      :singleWaitTime="state.defaultOption.singleWaitTime"
      :wheel="state.defaultOption.wheel"
    >
      <ul class="right_bottom">
        <li class="right_center_item" v-for="(item, i) in state.list" :key="i">
          <span class="orderNum">{{ i + 1 }}</span>
          <div class="inner_right">
            <div class="dibu"></div>
            <div class="flex">
              <div class="info">
                <span class="labels">设备ID：</span>
                <span class="text-content zhuyao"> {{ handleDevice(item) }}</span>
              </div>
              <div class="info">
                <span class="labels">级别：</span>
                <span class="text-content"> {{ handleLevel(item) }}</span>
              </div>
              <div class="info">
                <span class="labels">告警值：</span>
                <span class="text-content warning"> {{ formatValue(item.alertValue) }}</span>
              </div>
            </div>

            <div class="flex">
              <div class="info">
                <span class="labels shrink-0"> 站点：</span>
                <span class="ciyao truncate" style="font-size: 12px; width: 220px" :title="handleAddress(item)">
                  {{ handleAddress(item) }}</span
                >
              </div>
              <div class="info time shrink-0">
                <span class="labels">时间：</span>
                <span class="text-content" style="font-size: 12px"> {{ formatTime(item.createTime) }}</span>
              </div>
            </div>
            <div class="flex">
              <div class="info">
                <span class="labels">报警内容：</span>
                <span class="text-content ciyao" :class="{ warning: item.alertDetail }">
                  {{ handleContent(item) }}</span
                >
              </div>
            </div>
          </div>
        </li>
      </ul>
    </component>
  </div>
</template>

<style scoped lang="scss">
.right_bottom {
  width: 100%;
  height: 100%;

  .right_center_item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: auto;
    padding: 10px;
    font-size: 14px;
    color: #fff;

    .orderNum {
      margin: 0 20px 0 -20px;
    }

    .inner_right {
      position: relative;
      height: 100%;
      width: 400px;
      flex-shrink: 0;
      line-height: 1.5;

      .dibu {
        position: absolute;
        height: 2px;
        width: 104%;
        background-image: url("@/assets/img/zuo_xuxian.png");
        bottom: -12px;
        left: -2%;
        background-size: cover;
      }
    }

    .info {
      margin-right: 10px;
      display: flex;
      align-items: center;

      .labels {
        flex-shrink: 0;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
      }

      .zhuyao {
        color: $primary-color;
        font-size: 15px;
      }

      .ciyao {
        color: rgba(255, 255, 255, 0.8);
      }

      .warning {
        color: #e6a23c;
        font-size: 15px;
      }
    }
  }
}

.right_bottom_wrap {
  overflow: hidden;
  width: 100%;
  height: 252px;
}

.overflow-y-auto {
  overflow-y: auto;
}
</style>
