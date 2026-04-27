<script setup lang="ts">
import { ref } from "vue";
import CapsuleChart from "@/components/datav/capsule-chart";
import { ranking } from "@/api";
import { ElMessage } from "element-plus";

const config = ref({
  showValue: true,
  unit: "次",
  colors: ["#00f2ff", "#007eff", "#7300ff", "#2e35ff", "#00ff95", "#00a35f", "#ffea00", "#ff9500"],
  textColor: "rgba(255, 255, 255, 0.7)",
  valueColor: "#00f2ff",
});
const data = ref([]);
const isSuccess = (res: any) => res?.success === true || res?.code === 0;
const getPayload = (res: any) => res?.data ?? [];
const getData = () => {
  ranking({ limitNum: 8 })
    .then((res) => {
      console.log("右中--站点告警排名", res);
      if (isSuccess(res)) {
        data.value = Array.isArray(getPayload(res)) ? getPayload(res) : [];
      } else {
        ElMessage({
          message: res?.msg || "获取站点告警排名失败",
          type: "warning",
        });
      }
    })
    .catch((err) => {
      ElMessage.error(err);
    });
};
getData();
</script>

<template>
  <div class="right_center_wrap">
    <CapsuleChart :config="config" style="width: 100%; height: 230px" :data="data" />
  </div>
</template>

<style scoped lang="scss">
.right_center_wrap {
  box-sizing: border-box;
  padding: 10px 16px;
  width: 100%;
  height: 100%;

  :deep(.capsule-container) {
    .label-column {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8) !important;
      font-weight: bold;
    }
    .unit {
      color: rgba(255, 255, 255, 0.4);
      font-size: 11px;
    }
    .capsule-item {
      box-shadow: 0 0 10px rgba(0, 242, 255, 0.2);
    }
  }
}
</style>
