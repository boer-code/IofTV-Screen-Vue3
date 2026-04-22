import Mock from "mockjs";
export default [
    {
        url: "/iot/statistics/get-summary",
        type: "get",
        response: () => {
            const total = 698;
            const offline = Mock.Random.integer(0, 50);
            const online = total - offline;
            return {
                code: 0,
                msg: "",
                data: {
                    deviceCount: total,
                    deviceOnlineCount: online,
                    deviceOfflineCount: offline,
                    deviceInactiveCount: 0,
                    alertRecordCount: Mock.Random.integer(10, 200),
                    productCategoryCount: 3,
                    productCount: 5,
                    deviceMessageCount: 10000,
                    productCategoryTodayCount: 0,
                    productTodayCount: 0,
                    deviceTodayCount: 0,
                    deviceMessageTodayCount: 0,
                    productCategoryDeviceCounts: {},
                },
            };
        },
    },
    {
        url: "/iot/device-group/simple-list",
        type: "get",
        response: () => ({
            code: 0,
            msg: "",
            data: [
                { id: 1, name: "站点A", deviceCount: 220 },
                { id: 2, name: "站点B", deviceCount: 180 },
                { id: 3, name: "站点C", deviceCount: 298 },
            ],
        }),
    },
    //左下
    {
        url: "/bigscreen/leftBottom",
        type: "get",
        response: () => {
            const a = Mock.mock({
                success: true,
                data: {
                    "list|20": [
                        {
                            address: "@county(true)",
                            createTime: "@datetime('yyyy-MM-dd HH:mm:ss')",
                            deviceId: "6c512d754bbcd6d7cd86abce0e0cac58",
                            deviceName: "@word(6, 12)",
                            siteName: "@city()",
                            "onlineState|1": [0, 1],

                        }
                    ]
                }
            })
            return a
        }
    },
    //右上
    {
        url: "/bigscreen/alarmNum",
        type: "get",
        response: () => {
            const a = Mock.mock({
                success: true,
                data: {
                    dateList: ['2021-11', '2021-12', '2022-01', '2022-02', '2022-03', "2022-04"],
                    "numList|6": [
                        '@integer(0, 1000)'
                    ],
                    "numList2|6": [
                        '@integer(0, 1000)'
                    ]
                }
            })
            return a
        }
    },
    //右中
    {
        url: "/bigscreen/ranking",
        type: "get",
        response: () => {
            let num = Mock.mock({ "list|80": [{ value: "@integer(50,1000)", name: "@city()" }] }).list
            //   console.log("ranking",num);
            let newNum: any = [], numObj: any = {}
            num.map((item: any) => {
                if (!numObj[item.name] && newNum.length < 8) {
                    numObj[item.name] = true
                    newNum.push(item)
                }
            })
            let arr = newNum.sort((a: any, b: any) => {
                return b.value - a.value
            })
            let a = {
                success: true,
                data: arr
            }
            return a
        }
    },
    //右下
    {
        url: "/bigscreen/rightBottom",
        type: "get",
        response: () => {
            const a = Mock.mock({
                success: true,
                data: {
                    "list|40": [{
                        alertDetail: "@csentence(5,10)",
                        "alertName|1": ["水浸告警", "位移超限"],
                        alertValue: "@float(60, 200)",
                        createTime: "2022-04-19 08:38:33",
                        deviceId: null,
                        deviceName: "@word(6, 12)",
                        alertLevel: "@integer(1,3)",
                        siteName: "@city()",
                        address: "@county(true)",
                    }],

                }
            })
            return a
        }
    }
];

