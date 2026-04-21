interface UtilVarType {
    baseUrl:string,
    code:string|number,
    noContentCode:number,
    ENC:boolean,//是否进行加密
}

const UtilVar:UtilVarType = {
    baseUrl: import.meta.env.VITE_API_BASE_URL || "",
    code:401, //登陆过期
    noContentCode:204, //请求成功但没有内容
    ENC:false,

}
const runtimeType:any = {

    production: () => {
        UtilVar.baseUrl = import.meta.env.VITE_API_BASE_URL || UtilVar.baseUrl
    },
    //开发环境
    development: () => {
        UtilVar.baseUrl = import.meta.env.VITE_API_BASE_URL || UtilVar.baseUrl
    },
    hash:()=>{

    }
    
}
// console.log(import.meta.env)
runtimeType[import.meta.env.MODE]&&runtimeType[import.meta.env.MODE]()
export default UtilVar