import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import '@/assets/css/main.scss'
import '@/assets/css/tailwind.css'
import 'vue-cesium/theme-default/index.css'

import {registerEcharts} from "@/plugins/echarts"
import VueCesium from "vue-cesium"
import { mockXHR } from "@/mock/index";

const useMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === "true";
if (useMock) {
  mockXHR();
}

const app = createApp(App)
registerEcharts(app)
app.use(VueCesium)
app.use(createPinia())
app.use(router)

app.mount('#app')
