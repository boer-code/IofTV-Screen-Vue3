<script setup lang="ts">
import { ref, onMounted } from "vue";
import { messageSummary } from "@/api";
import { graphic } from "echarts/core";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";

const option = ref({});

const isSuccess = (res: any) => res?.success === true || res?.code === 0;
const getPayload = (res: any) => res?.data ?? [];

const getLast7DaysParams = () => ({
  interval: 1,
  "times[0]": `${dayjs().subtract(6, "day").format("YYYY-MM-DD")} 00:00:00`,
  "times[1]": `${dayjs().format("YYYY-MM-DD")} 23:59:59`,
});

const getData = () => {
  messageSummary(getLast7DaysParams())
    .then((res) => {
      console.log("右上--消息统计", res);
      if (isSuccess(res)) {
        const list = Array.isArray(getPayload(res)) ? getPayload(res) : [];
        setOption(
          list.map((item: any) => item.time),
          list.map((item: any) => Number(item.upstreamCount || 0)),
          list.map((item: any) => Number(item.downstreamCount || 0))
        );
      } else {
        ElMessage({
          message: res?.msg || "获取消息统计失败",
          type: "warning",
        });
      }
    })
    .catch((err) => {
      ElMessage.error(err);
    });
};
const setOption = async (xData: any[], yData: any[], yData2: any[]) => {
  option.value = {
    legend: {
      top: 0,
      right: 20,
      textStyle: {
        color: "#fff",
        fontSize: 12,
        opacity: 0.8,
      },
      itemWidth: 12,
      itemHeight: 4,
    },
    xAxis: {
      type: "category",
      data: xData,
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      axisLabel: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 11,
        margin: 12,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: "value",
      name: "(条)",
      nameTextStyle: {
        color: "rgba(255, 255, 255, 0.4)",
        fontSize: 10,
        align: "right",
        padding: [0, 8, 0, 0],
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: "rgba(255, 255, 255, 0.05)",
          type: "dashed",
        },
      },
      axisLine: {
        show: false,
      },
      axisLabel: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 11,
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(0,0,0,0.8)",
      borderColor: "rgba(0, 242, 255, 0.5)",
      borderWidth: 1,
      textStyle: {
        color: "#FFF",
      },
      axisPointer: {
        type: "line",
        lineStyle: {
          color: "rgba(0, 242, 255, 0.4)",
          width: 1,
          type: "dashed",
        },
      },
      formatter: (params: any) => {
        let res = `<div style="padding:4px 8px;"><div style="color:rgba(255,255,255,0.6);margin-bottom:4px;">${params[0].name}</div>`;
        params.forEach((item: any) => {
          res += `<div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${item.color};margin-right:8px;"></span>
            <span style="flex:1;margin-right:12px;">${item.seriesName}</span>
            <span style="font-weight:bold;color:#00f2ff">${item.value}</span>
          </div>`;
        });
        res += "</div>";
        return res;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "15%",
      containLabel: true,
    },
    series: [
      {
        name: "上行消息",
        type: "line",
        data: yData,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 3,
          color: "#00f2ff",
          shadowBlur: 10,
          shadowColor: "rgba(0, 242, 255, 0.5)",
        },
        itemStyle: {
          color: "#00f2ff",
        },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(0, 242, 255, 0.3)" },
            { offset: 1, color: "rgba(0, 242, 255, 0)" },
          ]),
        },
        emphasis: {
          scale: true,
          itemStyle: {
            borderWidth: 2,
            borderColor: "#fff",
          },
        },
      },
      {
        name: "下行消息",
        type: "line",
        data: yData2,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 3,
          color: "#7300ff",
          shadowBlur: 10,
          shadowColor: "rgba(115, 0, 255, 0.5)",
        },
        itemStyle: {
          color: "#7300ff",
        },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(115, 0, 255, 0.3)" },
            { offset: 1, color: "rgba(115, 0, 255, 0)" },
          ]),
        },
      },
    ],
  };
};
onMounted(() => {
  getData();
});
</script>

<template>
  <v-chart class="chart" :option="option" v-if="JSON.stringify(option) != '{}'" />
</template>

<style scoped lang="scss"></style>
