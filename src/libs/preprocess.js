import {toTreeData} from "../libs/func"
/**
 * * 对数据进行预处理 方便后期操作 
    * date:2020-11-06 edit 2022-10-27 重写
    * 王志勇
 * @param {*} data 数据
 * @param {*} pId 父节点
 * @param {*} path 初始化路径
 * @param {*} idField id字段
 * @param {*} parentField 父节点字段
 * @param {*} textField 文本字段
 * @param {*} childrenField 子节点字段
 * @param {*} simpleData 是否简单数据
 * @returns 
 */

let preprocess = function (data = [], pId = "", path = [], idField = "id", parentField = "pId", textField = "text", childrenField = "children", simpleData) {
    let result=[];
    if (Array.isArray(data)) {
        data = simpleData ? toTreeData(data, idField, parentField, textField) : data;
         result= data.map((item, index) => {
             item.id=item[idField];
             item.pId=pId;
             item._path=[...path, index];
             item.text=item[textField]
             item.children=(Array.isArray(item[childrenField])&&item[childrenField].length>0)? preprocess(item[childrenField], item[idField], [...path, index], idField, parentField, textField, childrenField,false):[];
            return item;
        })
    }
    return result;
}
export default preprocess;