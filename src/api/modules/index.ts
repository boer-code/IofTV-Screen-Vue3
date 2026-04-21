import {GET,POST,FILE,FILEPOST,PUT,GETNOBASE} from "../api";
const indexUrl=  {
    'leftTop':'/iot/statistics/get-summary',//左上-复用IoT统计汇总
    /** 站点精简列表（与 IoT 首页设备数量饼图同源） */
    'deviceGroupSimple':'/iot/device-group/simple-list',

    'leftBottom':"/bigscreen/leftBottom", //坐下
    'rightTop':"/bigscreen/alarmNum", //报警次数
    'rightBottom':'/bigscreen/rightBottom',//右下 
    'rightCenter':'/bigscreen/ranking',// 报警排名
}

export default indexUrl

/**左上--设备内总览 */
export const countDeviceNum=(param:any={})=>{
    return GET(indexUrl.leftTop,param)
}

/** 左中--站点设备数量（与后台 IoT 首页 DeviceCountCard 同源） */
export const getSimpleDeviceGroupList = (param: any = {}) => {
    return GET(indexUrl.deviceGroupSimple, param);
};

/**左下--设备提醒 */
export const leftBottom=(param:any={})=>{
    return GET(indexUrl.leftBottom,param)
}

/**右上--报警次数 */
export const alarmNum=(param:any={})=>{
    return GET(indexUrl.rightTop,param)
}

/**右中--报警排名 */
export const ranking=(param:any={})=>{
    return GET(indexUrl.rightCenter,param)
}

/**右下--设备状态 */
export const rightBottom=(param:any={})=>{
    return GET(indexUrl.rightBottom,param)
}