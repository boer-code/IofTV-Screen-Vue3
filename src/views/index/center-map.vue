<script setup lang="ts">
import { GET } from "@/api/api";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { storeToRefs } from "pinia";
import { useSettingStore } from "@/stores";

const TIANDITU_TK = import.meta.env.VITE_TIANDITU_TK || "";
const useMock = import.meta.env.VITE_USE_MOCK === "true";
const CESIUM_PATH = "https://unpkg.com/cesium@1.91.0/Build/Cesium/Cesium.js";
const settingStore = useSettingStore();
const { showMapOverlay } = storeToRefs(settingStore);

const hasTerrainToken = computed(() => Boolean(TIANDITU_TK));
const enableTerrain = computed(() => hasTerrainToken.value && !useMock);
const showOverlayLayers = computed(() => hasTerrainToken.value && showMapOverlay.value);
const viewerReady = ref(false);
const terrainReady = ref(false);
const terrainFailed = ref(false);
const siteLoading = ref(true);
const siteLocateFailed = ref(false);
const viewerRef = ref<any>(null);
const cesiumRef = ref<any>(null);
const siteRippleSize = ref<any>(null);
const siteRippleColor = ref<any>(null);
const deviceRippleSize = ref<any>(null);
const deviceRippleColor = ref<any>(null);
let unbindCanvasEvents: (() => void) | null = null;

type SitePoint = {
  id?: number;
  name?: string;
  longitude?: number;
  latitude?: number;
  altitude?: number;
};
const siteList = ref<SitePoint[]>([]);
const deviceList = ref<any[]>([]);

withDefaults(
  defineProps<{
    title: number | string;
  }>(),
  {
    title: "地图",
  }
);

const defaultCamera = {
  lng: 117.9,
  lat: 27.2,
  height: 1600000,
};

const normalizeLonLat = (longitude: any, latitude: any) => {
  const lng = Number(longitude);
  const lat = Number(latitude);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }
  if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
    return null;
  }
  return { lng, lat };
};

const sitePoints = computed(() =>
  siteList.value
    .map((item) => {
      const point = normalizeLonLat(item.longitude, item.latitude);
      if (!point) {
        return null;
      }
      return {
        ...item,
        longitude: point.lng,
        latitude: point.lat,
      };
    })
    .filter(Boolean) as Array<SitePoint & { longitude: number; latitude: number }>
);

const siteCamera = computed(() => {
  const validSites = sitePoints.value;
  if (!validSites.length) {
    return defaultCamera;
  }

  const longitudes = validSites.map((item) => Number(item.longitude));
  const latitudes = validSites.map((item) => Number(item.latitude));
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;

  const maxSpan = Math.max(Math.abs(maxLng - minLng), Math.abs(maxLat - minLat));
  // 视角拉远：站点分散时也尽量一屏容纳
  const estimatedHeight = maxSpan > 0 ? maxSpan * 111_000 * 10 : 180_000;

  return {
    lng: centerLng,
    lat: centerLat,
    height: Math.min(Math.max(estimatedHeight, 180_000), 5_000_000),
  };
});

const selectedSiteId = ref<number | null>(null);

const devicePoints = computed(() =>
  deviceList.value.filter(
    (item: any) => item.longitude != null && item.latitude != null && item.id != null
  )
);

const normalizedDevicePoints = computed(() =>
  devicePoints.value
    .map((item: any) => {
      const point = normalizeLonLat(item.longitude, item.latitude);
      if (!point) {
        return null;
      }
      return {
        ...item,
        longitude: point.lng,
        latitude: point.lat,
      };
    })
    .filter(Boolean) as any[]
);

const viewerCamera = computed(() => ({
  position: {
    lng: siteCamera.value.lng,
    lat: siteCamera.value.lat,
    height: siteCamera.value.height,
  },
  heading: 5,
  pitch: -65,
  roll: 0,
}));

const loadingTips = computed(() => {
  if (siteLoading.value) {
    return "站点位置加载中...";
  }
  if (siteLocateFailed.value) {
    return "站点位置读取失败，已使用默认视角";
  }
  if (terrainFailed.value) {
    return "3D地形加载失败，已切换基础场景";
  }
  if (!viewerReady.value) {
    return "3D场景初始化中...";
  }
  if (enableTerrain.value && !terrainReady.value) {
    return "3D地形加载中...";
  }
  return "";
});

const tryFlyTo = () => {
  const viewer = viewerRef.value;
  const Cesium = cesiumRef.value;
  if (!viewer || !Cesium) {
    return;
  }
  if (selectedSiteId.value == null) {
    const points = sitePoints.value;
    if (!points.length) {
      return;
    }
    const cartesians = points.map((item: any) =>
      Cesium.Cartesian3.fromDegrees(
        Number(item.longitude),
        Number(item.latitude),
        Number(item.altitude ?? 0)
      )
    );
    const sphere = Cesium.BoundingSphere.fromPoints(cartesians);
    const range = Math.max(sphere.radius * 3.6, 5000);
    viewer.camera.flyToBoundingSphere(sphere, {
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(15),
        Cesium.Math.toRadians(-50),
        range
      ),
      duration: 1.2,
    });
  } else {
    const points = normalizedDevicePoints.value;
    if (!points.length) {
      const site = sitePoints.value.find(s => s.id === selectedSiteId.value);
      if (site) {
         viewer.camera.flyTo({
           destination: Cesium.Cartesian3.fromDegrees(
             Number(site.longitude),
             Number(site.latitude),
             Number((site.altitude ?? 0) + 2500)
           ),
           orientation: {
             pitch: Cesium.Math.toRadians(-15),
             heading: Cesium.Math.toRadians(20),
             roll: 0
           },
           duration: 1.2
         });
      }
      return;
    }
    const cartesians = points.map((item: any) =>
      Cesium.Cartesian3.fromDegrees(
        Number(item.longitude),
        Number(item.latitude),
        Number(item.altitude ?? 0)
      )
    );
    const sphere = Cesium.BoundingSphere.fromPoints(cartesians);
    const minRange = 800;
    const range = Math.max(sphere.radius * 1.2, minRange);
    viewer.camera.flyToBoundingSphere(sphere, {
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(20),
        Cesium.Math.toRadians(-15),
        range
      ),
      duration: 1.2,
    });
  }
};

const onViewerReady = (ready: any) => {
  viewerReady.value = true;
  viewerRef.value = ready?.cesiumObject ?? ready?.viewer ?? ready?.viewerCesiumObject;
  cesiumRef.value = ready?.Cesium;
  const viewer = viewerRef.value;
  if (viewer && viewer.scene && viewer.scene.globe && cesiumRef.value) {
    const Cesium = cesiumRef.value;
    viewer.scene.morphTo3D(0);
    viewer.scene.mode = Cesium.SceneMode.SCENE3D;
    // 关闭深度测试，防止海拔为0或不准确的点位被3D地形遮挡导致无法点击
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.globe.dynamicAtmosphereLighting = true;

    siteRippleSize.value = new Cesium.CallbackProperty(() => {
      const t = (performance.now() % 2000) / 2000;
      return 18 + t * 40;
    }, false);
    siteRippleColor.value = new Cesium.CallbackProperty(() => {
      const t = (performance.now() % 2000) / 2000;
      return Cesium.Color.fromCssColorString("#ff9900").withAlpha(1 - t);
    }, false);

    deviceRippleSize.value = new Cesium.CallbackProperty(() => {
      const t = (performance.now() % 2000) / 2000;
      return 12 + t * 30;
    }, false);
    deviceRippleColor.value = new Cesium.CallbackProperty(() => {
      const t = (performance.now() % 2000) / 2000;
      return Cesium.Color.fromCssColorString("#00f0ff").withAlpha(1 - t);
    }, false);
  }
  bindCanvasMouseEvents();
  tryFlyTo();
};

const onTerrainReady = () => {
  terrainReady.value = true;
  terrainFailed.value = false;
  tryFlyTo();
};

const onTerrainUnready = () => {
  terrainFailed.value = true;
};

const loadSiteLocations = async () => {
  siteLoading.value = true;
  siteLocateFailed.value = false;
  try {
    const res = await GET("/iot/device-group/location-list", {});
    if (res?.code === 0 && Array.isArray(res?.data)) {
      siteList.value = res.data as SitePoint[];
      tryFlyTo();
      return;
    }
    siteLocateFailed.value = true;
  } catch (err: any) {
    siteLocateFailed.value = true;
    ElMessage.warning(err || "站点位置读取失败");
  } finally {
    siteLoading.value = false;
  }
};

const loadDeviceLocations = async (siteId: number) => {
  try {
    const res = await GET("/iot/device/location-list-by-group", { groupId: siteId });
    if (res?.code === 0 && Array.isArray(res?.data)) {
      deviceList.value = res.data;
      tryFlyTo();
      return;
    }
  } catch (err: any) {
    ElMessage.warning(err || "设备位置读取失败");
  }
};

const getPickedSiteFromMouseEvent = (event: MouseEvent) => {
  if (selectedSiteId.value != null) {
    return null;
  }
  const viewer = viewerRef.value;
  const Cesium = cesiumRef.value;
  const canvas = viewer?.scene?.canvas as HTMLCanvasElement | undefined;
  if (!viewer || !Cesium || !canvas) {
    return null;
  }
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }
  // 大屏容器会整体 scale，需把可见区域坐标映射回 Cesium 内部画布坐标。
  const position = new Cesium.Cartesian2(
    (event.clientX - rect.left) * (canvas.width / rect.width),
    (event.clientY - rect.top) * (canvas.height / rect.height)
  );
  const picked = viewer.scene.pick(position);
  const pickedId = picked?.id?.id ?? picked?.id?._id ?? picked?.id;
  if (typeof pickedId !== "string" || !pickedId.startsWith("site-")) {
    return null;
  }
  const siteId = Number(pickedId.replace("site-", ""));
  return sitePoints.value.find(item => Number(item.id) === siteId) ?? null;
};

const setViewerCursor = (cursor: string) => {
  const viewer = viewerRef.value;
  const container = viewer?.container as HTMLElement | undefined;
  if (container) {
    container.style.cursor = cursor;
  }
};

const handleSiteMouseOver = () => {
  setViewerCursor("pointer");
};

const handleSiteMouseOut = () => {
  setViewerCursor("default");
};

const bindCanvasMouseEvents = () => {
  unbindCanvasEvents?.();
  const viewer = viewerRef.value;
  const canvas = viewer?.scene?.canvas as HTMLCanvasElement | undefined;
  if (!canvas) {
    return;
  }

  const handleMouseMove = (event: MouseEvent) => {
    const site = getPickedSiteFromMouseEvent(event);
    if (site) {
      handleSiteMouseOver();
      return;
    }
    handleSiteMouseOut();
  };

  const handleCanvasClick = (event: MouseEvent) => {
    const site = getPickedSiteFromMouseEvent(event);
    if (site) {
      void handleSiteClick(site);
    }
  };

  const handleMouseLeave = () => {
    handleSiteMouseOut();
  };

  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("click", handleCanvasClick);
  canvas.addEventListener("mouseleave", handleMouseLeave);

  unbindCanvasEvents = () => {
    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("click", handleCanvasClick);
    canvas.removeEventListener("mouseleave", handleMouseLeave);
  };
};

const handleSiteClick = async (site: SitePoint) => {
  const siteId = Number(site.id);
  if (!Number.isFinite(siteId)) {
    ElMessage.warning("站点编号无效，无法加载设备");
    return;
  }
  setViewerCursor("default");
  selectedSiteId.value = siteId;
  deviceList.value = [];
  await loadDeviceLocations(siteId);
};

const handleBackClick = () => {
  setViewerCursor("default");
  selectedSiteId.value = null;
  deviceList.value = [];
  tryFlyTo();
};

const toggleMapOverlay = () => {
  settingStore.setShowMapOverlay(!showMapOverlay.value);
};

onMounted(() => {
  loadSiteLocations();
});

onUnmounted(() => {
  unbindCanvasEvents?.();
  unbindCanvasEvents = null;
});
</script>

<template>
  <div class="centermap">
    <div class="maptitle">
      <span class="titletext">{{ title }}</span>
    </div>
    <div v-if="selectedSiteId != null" class="back-btn" @click="handleBackClick">
      返回全局
    </div>
    <div class="mapwrap">
      <vc-viewer
        class="viewer"
        :animation="false"
        :base-layer-picker="false"
        :fullscreen-button="false"
        :geocoder="false"
        :home-button="false"
        :info-box="false"
        :scene-mode-picker="false"
        :scene-mode="3"
        :scene3-d-only="true"
        :selection-indicator="false"
        :timeline="false"
        :navigation-help-button="false"
        :should-animate="true"
        :camera="viewerCamera"
        :cesium-path="CESIUM_PATH"
        :terrain-exaggeration="1.25"
        @ready="onViewerReady"
        >
          <vc-layer-imagery v-if="hasTerrainToken">
            <vc-imagery-provider-tianditu map-style="img_w" :token="TIANDITU_TK" />
          </vc-layer-imagery>
          <vc-layer-imagery v-if="showOverlayLayers">
            <vc-imagery-provider-tianditu map-style="cia_w" :token="TIANDITU_TK" />
          </vc-layer-imagery>
          <vc-layer-imagery v-if="showOverlayLayers">
            <vc-imagery-provider-tianditu map-style="ibo_w" :token="TIANDITU_TK" />
          </vc-layer-imagery>
          <vc-terrain-provider-tianditu
            v-if="enableTerrain"
            :token="TIANDITU_TK"
            @ready="onTerrainReady"
            @unready="onTerrainUnready"
          />
        <template v-if="selectedSiteId == null">
          <template v-for="site in sitePoints" :key="'site-wrapper-' + site.id">
            <vc-entity
              :position="{
                lng: Number(site.longitude),
                lat: Number(site.latitude),
                height: Number(site.altitude ?? 0),
              }"
            >
              <vc-graphics-point v-if="siteRippleSize" :pixel-size="siteRippleSize" :color="siteRippleColor" :outline-width="0" />
            </vc-entity>
            <vc-entity
              :id="'site-' + site.id"
              :position="{
                lng: Number(site.longitude),
                lat: Number(site.latitude),
                height: Number(site.altitude ?? 0),
              }"
            >
              <vc-graphics-point :pixel-size="18" color="#ff9900" :outline-width="4" outline-color="rgba(255, 255, 255, 0.6)" />
              <vc-graphics-label
                :text="site.name || '站点'"
                :font="'bold 16px Microsoft YaHei'"
                :pixel-offset="{ x: 0, y: -30 }"
                fill-color="#ffffff"
                outline-color="#804d00"
                :outline-width="3"
                :show-background="true"
                background-color="rgba(0, 0, 0, 0.5)"
                :background-padding="{ x: 10, y: 6 }"
                :style="2"
              />
            </vc-entity>
          </template>
        </template>
        <template v-else>
          <template v-for="device in normalizedDevicePoints" :key="'device-wrapper-' + device.id">
            <vc-entity
              :position="{
                lng: Number(device.longitude),
                lat: Number(device.latitude),
                height: Number(device.altitude ?? 0),
              }"
            >
              <vc-graphics-point v-if="deviceRippleSize" :pixel-size="deviceRippleSize" :color="deviceRippleColor" :outline-width="0" />
            </vc-entity>
            <vc-entity
              :id="'device-' + device.id"
              :position="{
                lng: Number(device.longitude),
                lat: Number(device.latitude),
                height: Number(device.altitude ?? 0),
              }"
            >
              <vc-graphics-point :pixel-size="12" color="#00f0ff" :outline-width="3" outline-color="rgba(255, 255, 255, 0.6)" />
              <vc-graphics-label
                :text="device.nickname || device.deviceName || '设备'"
                :font="'bold 14px Microsoft YaHei'"
                :pixel-offset="{ x: 0, y: -24 }"
                fill-color="#ffffff"
                outline-color="#004a5c"
                :outline-width="3"
                :show-background="true"
                background-color="rgba(0, 0, 0, 0.5)"
                :background-padding="{ x: 8, y: 5 }"
                :style="2"
              />
            </vc-entity>
          </template>
        </template>
      </vc-viewer>
      <button
        class="overlay-switch"
        type="button"
        :class="{ active: showMapOverlay, disabled: !hasTerrainToken }"
        :disabled="!hasTerrainToken"
        @click="toggleMapOverlay"
      >
        <span class="switch-label">地图注记</span>
        <span class="switch-track">
          <span class="switch-thumb"></span>
        </span>
      </button>
      <div v-if="loadingTips" class="map-loading">{{ loadingTips }}</div>
      <div class="map-shadow"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.centermap {
  position: relative;
  margin-bottom: 0px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  .maptitle {
    display: flex;
    position: absolute;
    top: 20px;
    z-index: 10;
    height: 42px;
    justify-content: center;
    align-items: center;
    pointer-events: none;

    .titletext {
      // 地图上方标题字号
      font-size: 28px;
      font-weight: 800;
      // 标题字间距
      letter-spacing: 4px;
      color: #b8e9ff;
      text-shadow: 0 0 8px rgba(12, 138, 255, 0.75);
    }
  }

  .mapwrap {
    position: relative;
    // 地图整体显示高度；越大地图主体越高
    height: 900px;
    width: 150%;
    border: none;
    // 地图遮罩外轮廓圆角；越大四角越圆
    border-radius: 5%;
    overflow: hidden;
    background: transparent;
    // 地图四周透明过渡范围：
    // 这里的 6% / 94% 控制左右两侧不透明可视区域大小
    // 这里的 10% / 90% 控制上下两侧不透明可视区域大小
    // 越靠近 0% 和 100%，中间清晰可见区域越大
    -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent),
                        linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
    -webkit-mask-composite: source-in;
    mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent),
                linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
    mask-composite: intersect;

    .viewer {
      height: 100%;
      width: 100%;
      border: none;
      background: transparent;
    }

    .map-loading {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #d9f2ff;
      font-size: 16px;
      letter-spacing: 1px;
      background: rgba(0, 0, 0, 0.26);
      z-index: 3;
      pointer-events: none;
    }

    .map-shadow {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      z-index: 2;
    }

  }

  .back-btn {
    position: absolute;
    top: 30px;
    right: 250px;
    z-index: 11; // 往上抬一层，且放到 mapwrap 外避免被 mask 影响“发透明”
    padding: 8px 18px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: #eaf7ff;
    background: rgba(0, 162, 255, 0.78);
    border: 1px solid rgba(0, 205, 255, 0.95);
    border-radius: 6px;
    cursor: pointer;
    user-select: none;
    backdrop-filter: blur(6px);
    box-shadow: 0 10px 26px rgba(0, 162, 255, 0.28);
    transition: background 0.2s, box-shadow 0.2s, transform 0.2s;

    &:hover {
      background: rgba(0, 162, 255, 0.92);
      box-shadow: 0 14px 34px rgba(0, 162, 255, 0.38);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 10px 26px rgba(0, 162, 255, 0.28);
    }
  }

  .overlay-switch {
    position: absolute;
    top: 66px;
    right: 340px;
    z-index: 3;
    height: 34px;
    padding: 0 6px 0 12px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border: 1px solid rgba(126, 195, 255, 0.94);
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(7, 24, 46, 0.28), rgba(4, 14, 28, 0.44));
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03), 0 4px 14px rgba(0, 0, 0, 0.14);
    color: rgba(224, 244, 255, 0.84);
    cursor: pointer;
    user-select: none;
    backdrop-filter: blur(6px);
    transition: background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.2s;

    &:hover:not(.disabled) {
      background: linear-gradient(180deg, rgba(8, 31, 58, 0.4), rgba(5, 18, 35, 0.56));
      border-color: rgba(126, 195, 255, 0.38);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04), 0 6px 18px rgba(0, 0, 0, 0.18);
    }

    &:active:not(.disabled) {
      transform: scale(0.98);
    }

    &.disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .switch-label {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.3px;
      white-space: nowrap;
      text-shadow: 0 0 8px rgba(44, 156, 255, 0.15);
    }

    .switch-track {
      position: relative;
      width: 42px;
      height: 20px;
      padding: 2px;
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      background: rgba(102, 120, 145, 0.42);
      transition: background 0.2s ease;
    }

    .switch-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: rgba(241, 248, 255, 0.96);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.24);
      transform: translateX(0);
      transition: transform 0.2s ease;
    }

    &.active {
      background: linear-gradient(180deg, rgba(7, 39, 72, 0.42), rgba(3, 25, 48, 0.58));
      border-color: rgba(86, 203, 255, 0.42);
      color: rgba(233, 249, 255, 0.96);
      box-shadow: inset 0 0 0 1px rgba(64, 214, 255, 0.08), 0 8px 20px rgba(0, 79, 133, 0.16);

      .switch-track {
        background: linear-gradient(90deg, rgba(27, 140, 218, 0.82), rgba(57, 213, 232, 0.88));
      }

      .switch-thumb {
        transform: translateX(22px);
      }
    }
  }
}
</style>
