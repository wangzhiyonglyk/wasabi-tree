

/**  
    * 格式化数据 tree treepicker treegrid
    * date:2020-11-06
    * wangzhiyong
    * @param {string|number} value 选择的值,处理勾选情况
    * @param {Array} realData 数据
    * @param {string } idOrValueField id或value对应的字段名
    * @param {string} textField  文本对应的字段名
    * @param {*} parentField 父节点对应字段名
    * @param {*} simpleData 是否是简单数据格式
    * @returns 
    */
   import func from "./func"
let formatterData = function (type, value, data = [], idOrValueField = "value", textField = "text", parentField = "pId", simpleData = true) {
    if (!data) {
        return data;
    }
    let realData = func.clone(data);//复制,否则影响父节点，导致重复更新
    if (realData && realData instanceof Array && realData.length > 0) {
        for (let i = 0; i < realData.length; i++) {
            if (type == "tree" || type == "treepicker" || type == "treegrid") {
                realData[i].id = realData[i].id || realData[i][idOrValueField];//追加这个属性
            }
            else {

                realData[i].value = realData[i].value || realData[i][idOrValueField];//追加这个属性
            }

            realData[i].text = realData[i].text || realData[i][textField];//追加这个属性
            if (value && ("," + (value) + ",").indexOf("," + ((type == "tree" || type == "treepicker") ? realData[i].id : realData[i].value) + ",") > -1) {
                realData[i].checked = true;//节点选中，专门用于树组件
            }
            else {
                //不处理，不影响原因的
            }
            //如果有子节点的时候.tree,treepicker,picker
            if (realData[i].children && realData[i].children.length > 0) {
                realData[i].children = propsTran.formatterData(type, value, realData[i].children, idOrValueField, textField, parentField, simpleData);
            }
        }
    }
    if ((type === "tree" || type === "treepicker" || type === "treegrid") && simpleData) {//格式化树型结构
        realData = func.toTreeData(realData, idOrValueField, parentField, textField);
    }
    return realData;
}
export default formatterData;