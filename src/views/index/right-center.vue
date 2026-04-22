<script setup lang="ts">
import { ref } from "vue";
import CapsuleChart from "@/components/datav/capsule-chart";
import { ranking } from "@/api";
import { ElMessage } from "element-plus";

const config = ref({
  showValue: true,
  unit: "次",
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
  <div class="right_bottom">
    <CapsuleChart :config="config" style="width: 100%; height: 260px" :data="data" />
  </div>
</template>

<style scoped lang="scss">
.right_bottom {
  box-sizing: border-box;
  padding: 0 16px;
}
</style>
