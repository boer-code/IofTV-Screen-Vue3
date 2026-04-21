<script setup lang="ts">
import { ref, reactive } from "vue";
import { graphic } from "echarts/core";
import { countDeviceNum, getSimpleDeviceGroupList } from "@/api";
import { ElMessage } from "element-plus";

/** 与 IoT 首页设备数量饼图配色接近 */
const palette = [
  ["#6A7BFF", "#9AA8FF"],
  ["#39E67A", "#7AF0B0"],
  ["#72E3FF", "#A8F0FF"],
  ["#FF5E7A", "#FFA3B0"],
  ["#FFC857", "#FFE08A"],
  ["#B37BFF", "#D4B3FF"],
];

const colors = ["#0BFC7F", "#A0A0A0", "#F48C02", "#F4023C"];

const option = ref<Record<string, unknown>>({});
const state = reactive({
  totalNum: 0,
  pieItems: [] as { name: string; value: number }[],
});

const echartsGraphic = (pair: [string, string]) =>
  new graphic.LinearGradient(1, 0, 0, 0, [
    { offset: 0, color: pair[0] },
    { offset: 1, color: pair[1] },
  ]);

const isSuccess = (res: any) => res?.success === true || res?.code === 0;
const getPayload = (res: any) => res?.data ?? {};

const getData = async () => {
  try {
    const [sumRes, groupRes] = await Promise.all([
      countDeviceNum(),
      getSimpleDeviceGroupList(),
    ]);

    if (!isSuccess(sumRes)) {
      ElMessage.error(sumRes?.msg || "获取设备统计失败");
      return;
    }
    if (!isSuccess(groupRes)) {
      ElMessage.error(groupRes?.msg || "获取站点列表失败");
      return;
    }

    const summary = getPayload(sumRes);
    const groups = getPayload(groupRes);
    state.totalNum = Number(summary.deviceCount ?? 0);

    const list = Array.isArray(groups) ? groups : [];
    let items: { name: string; value: number }[] = list.map((g: any) => ({
      name: String(g.name ?? `站点${g.id ?? ""}`),
      value: Number(g.deviceCount ?? 0),
    }));

    if (items.length === 0) {
      items = [{ name: "设备", value: state.totalNum }];
    } else {
      const sliceSum = items.reduce((s, it) => s + it.value, 0);
      if (sliceSum === 0 && state.totalNum > 0) {
        items = [{ name: "设备", value: state.totalNum }];
      }
    }

    state.pieItems = items;
    setOption();
  } catch (err: any) {
    ElMessage.error(typeof err === "string" ? err : "加载失败");
  }
};

getData();

const setOption = () => {
  const data = state.pieItems.map((item, i) => {
    const pair = palette[i % palette.length] as [string, string];
    return {
      value: item.value,
      name: item.name,
      itemStyle: {
        color: echartsGraphic(pair),
      },
    };
  });

  option.value = {
    title: {
      top: "center",
      left: "center",
      text: [`{value|${state.totalNum}}`, "{name|设备总数}"].join("\n"),
      textStyle: {
        rich: {
          value: {
            color: "#ffffff",
            fontSize: 24,
            fontWeight: "bold",
            lineHeight: 20,
            padding: [4, 0, 4, 0],
          },
          name: {
            color: "#ffffff",
            lineHeight: 20,
          },
        },
      },
    },
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(0,0,0,.6)",
      borderColor: "rgba(147, 235, 248, .8)",
      textStyle: {
        color: "#FFF",
      },
      formatter: "{b}: {c} 个 ({d}%)",
    },
    series: [
      {
        name: "设备数量统计",
        type: "pie",
        radius: ["40%", "70%"],
        itemStyle: {
          borderRadius: 6,
          borderColor: "rgba(255,255,255,0)",
          borderWidth: 2,
        },
        color: colors,
        label: {
          show: true,
          formatter: "   {b|{b}}   \n   {c|{c}个}   {per|{d}%}  ",
          rich: {
            b: {
              color: "#fff",
              fontSize: 12,
              lineHeight: 26,
            },
            c: {
              color: "#31ABE3",
              fontSize: 14,
            },
            per: {
              color: "#31ABE3",
              fontSize: 14,
            },
          },
        },
        emphasis: {
          show: false,
        },
        legend: {
          show: false,
        },
        tooltip: { show: true },
        labelLine: {
          show: true,
          length: 20,
          length2: 36,
          smooth: 0.2,
          lineStyle: {},
        },
        data,
      },
    ],
  };
};
</script>

<template>
  <v-chart class="chart" :option="option" />
</template>

<style scoped lang="scss"></style>
