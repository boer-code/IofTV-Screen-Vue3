import { ref } from 'vue'
import { defineStore } from 'pinia'
export const useSettingStore = defineStore('setting', () => {
  const settingShow = ref(false);//设置弹窗显隐
  const isScale = ref(true);//是否进行全局适配
  const showMapOverlay = ref(true);//是否显示地图地名与边界
  const setSettingShow = (flag: boolean) => {
    settingShow.value = flag
  }
  const setIsScale = (flag: boolean) => {
    isScale.value = flag
    setSettingData()
  }
  const setShowMapOverlay = (flag: boolean) => {
    showMapOverlay.value = flag
    setSettingData()
  }
  const initSetting = () => {
    let settingData: any = localStorage.getItem('loftv-settingData')
    if (settingData) {
      settingData = JSON.parse(settingData)
      setIsScale(settingData.isScale ?? true)
      setShowMapOverlay(settingData.showMapOverlay ?? true)
    }
  }
  const setSettingData = () => {
    localStorage.setItem('loftv-settingData', JSON.stringify({
      isScale: isScale.value,
      showMapOverlay: showMapOverlay.value
    }))
  }
  return { settingShow, setSettingShow, isScale, setIsScale, showMapOverlay, setShowMapOverlay, initSetting, setSettingData }
})
