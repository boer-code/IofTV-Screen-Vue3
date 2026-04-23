<script setup lang="ts">
import { ref, reactive } from "vue";
import { graphic } from "echarts/core";
import { countDeviceNum, getSimpleDeviceGroupList } from "@/api";
import { ElMessage } from "element-plus";

/** 科技风配色：青色、蓝色、紫色、绿色、橙色、红色 */
const palette = [
  ["#00f2ff", "#007eff"], // 青蓝
  ["#7300ff", "#2e35ff"], // 紫蓝
  ["#00ff95", "#00a35f"], // 绿
  ["#ff00f2", "#7300ff"], // 粉紫
  ["#ffea00", "#ff9500"], // 黄橙
  ["#ff4d4d", "#b30000"], // 红
];

const option = ref<Record<string, unknown>>({});
const state = reactive({
  totalNum: 0,
  pieItems: [] as { name: string; value: number }[],
});

const echartsGraphic = (pair: [string, string]) =>
  new graphic.LinearGradient(0, 0, 0, 1, [
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
        shadowBlur: 10,
        shadowColor: pair[0],
      },
    };
  });

  option.value = {
    title: {
      text: `{a|${state.totalNum}}\n{b|设备总数}`,
      top: "center",
      left: "center",
      textStyle: {
        rich: {
          a: {
            fontSize: 32,
            fontWeight: "bold",
            color: "#00f2ff",
            padding: [5, 0],
            textShadowBlur: 10,
            textShadowColor: "#00f2ff",
          },
          b: {
            fontSize: 14,
            color: "#ffffff",
            opacity: 0.7,
          },
        },
      },
    },
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(0,0,0,0.8)",
      borderColor: "#00f2ff",
      borderWidth: 1,
      textStyle: {
        color: "#fff",
      },
      formatter: (params: any) => {
        return `<div style="padding: 5px;">
          <span style="color:${params.color.colorStops[0].color}; font-weight:bold;">${params.name}</span><br/>
          数量：<span style="color:#00f2ff;">${params.value}</span> 个<br/>
          占比：<span style="color:#00f2ff;">${params.percent}%</span>
        </div>`;
      },
    },
    series: [
      // 背景装饰环
      {
        type: "pie",
        radius: ["38%", "40%"],
        center: ["50%", "50%"],
        silent: true,
        label: { show: false },
        data: [
          {
            value: 1,
            itemStyle: {
              color: "rgba(0, 242, 255, 0.1)",
            },
          },
        ],
      },
      // 虚线外装饰环
      {
        type: "pie",
        radius: ["68%", "69%"],
        center: ["50%", "50%"],
        silent: true,
        label: { show: false },
        data: [
          {
            value: 1,
            itemStyle: {
              color: "transparent",
              borderType: "dashed",
              borderWidth: 1,
              borderColor: "rgba(0, 242, 255, 0.3)",
            },
          },
        ],
      },
      // 主数据环
      {
        name: "设备分布",
        type: "pie",
        radius: ["45%", "60%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: "#0a1a2a",
          borderWidth: 2,
        },
        label: {
          show: true,
          position: "outside",
          formatter: "{b|{b}}\n{d|{d}%}",
          rich: {
            b: {
              color: "rgba(255, 255, 255, 0.85)", // 提高一点亮度
              fontSize: 13, // 稍微缩小一点，防止溢出
              fontWeight: "bold",
              fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
              padding: [4, 8],
              backgroundColor: "rgba(0, 242, 255, 0.1)",
              borderRadius: 4,
              borderWidth: 1,
              borderColor: "rgba(0, 242, 255, 0.2)",
            },
            d: {
              color: "#00f2ff",
              fontSize: 13,
              fontWeight: "bold",
              padding: [2, 0],
            },
          },
        },
        labelLine: {
          show: true,
          length: 25, // 缩短引线，防止超出边框
          length2: 20,
          smooth: 0.2,
          lineStyle: {
            width: 2,
            color: "rgba(0, 242, 255, 0.6)",
          },
        },
        emphasis: {
          scale: true,
          scaleSize: 5,
          itemStyle: {
            shadowBlur: 20,
            shadowColor: "rgba(0, 242, 255, 0.5)",
          },
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
