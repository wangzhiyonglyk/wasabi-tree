/**
 * Created by zhiyongwang on 2016-06-08.
 * 将独立于项目的公共函数分享出来
 *2020-11-06，重新规划
 2021-09-10添加新功能
 2022-01-27 本项目除去多余的函数
 */

/**
 * 对象的深复制
 * @param {*} obj 源对象
 * @returns 
 */
export function clone(obj) {
    let o;
    switch (typeof obj) {
        case 'object':
            if (obj === null) {
                o = null;
            } else {
                if (obj instanceof Array) {
                    o = [];
                    //o= obj.slice(0)， 注意了这里不能直接使用这个复制，如果数组中的元素为对象
                    for (let i = 0; i < obj.length; i++) {
                        o.push(clone(obj[i]));
                    }
                } else if (obj instanceof Date) {//对日期的复制
                    o = new Date(obj.valueOf())
                }
                else if (obj instanceof Map) {
                    o = new Map(obj);
                }
                else if (obj instanceof Set) {
                    o = new Set(obj);
                }
                else {//普通对象
                    o = {};
                    for (let k in obj) {
                        o[k] = clone(obj[k]);
                    }
                }
            }
            break;
        default://其他类型
            o = obj;
            break;
    }
    return o;
}
/**
 * 对象的浅复制
 * @param {*} obj 源对象
 * @returns 
 */
export function shallowClone(obj) {
    let o;
    switch (typeof obj) {
        case 'object':
            if (obj === null) {
                o = null;
            } else {
                if (obj instanceof Array) {
                    o = obj.slice(0);
                } else if (obj instanceof Date) {//对日期的复制
                    o = new Date(obj.valueOf())
                }
                else if (obj instanceof Map) {
                    o = new Map(obj);
                }
                else if (obj instanceof Set) {
                    o = new Set(obj);
                }
                else {//普通对象
                    o = { ...obj };
                }
            }
            break;
        default://其他类型
            o = obj;
            break;
    }
    return o;

}

/**
 * 获取真正的数据源
 * @param {*} data  数据
 * @param {*} source 
 * @returns 
 */
export function getSource(data, source = "data") {
    if (typeof data === "object" && !(Array.isArray(data))) {
        let sourceArr = new Array();
        let returnData = data;

        if (source.indexOf(".") > -1) {
            sourceArr = source.split(".");
        }
        else {
            sourceArr.push(source);
        }
        let i = 0;
        try {
            while (i < sourceArr.length) {
                returnData = returnData[sourceArr[i]];
                if (returnData == null) {
                    return null;//直接返回
                }
                i++;

            }
        }
        catch (e) {
            return null;
        }

        return returnData;
    }
    else {
        return data;
    }

}

/**
 * 生成uuid
 */
export function uuid() {
    let s = [];
    let hexDigits = "0123456789abcdef";
    for (let i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    let uuid = s.join("");
    return uuid;
}

/**
 * 判断两个对象是相同
 * @param {*} objA 
 * @param {*} objB  
 *  @param {bool} deep 是否深层遍历  
 * @returns 
 */
export function diff(objA = null, objB = null, deep = true) {//
    if (objA === objB) {//直接相等，返回
        return false;
    }
    if (Object.prototype.toString.call(objA) !== Object.prototype.toString.call(objB)) {//类型不同
        return true;
    }
    if (typeof objA === "function") {//函数
        return objA.toString() !== objB.toString();
    }
    else if (typeof objA === "object") {//对象
        //先拿所有的属性 
        try {

            if (Object.prototype.toString.call(objA).indexOf("Map") > -1 || Object.prototype.toString.call(objA).indexOf("Set") > -1) {
                //如果是Map与Set则直接判断即可，因为两者的无法像普通对象遍历
                return objA !== objB;
            }
            let oldProps = Object.getOwnPropertyNames(objA);
            let newProps = Object.getOwnPropertyNames(objB);
            if (oldProps.length !== newProps.length) {
                return true;//不相同
            }

            for (let i = 0; i < oldProps.length; i++) {
                let propName = oldProps[i];//属性名
                //值
                let propA = objA[propName]
                let propB = objB[propName]
                if (deep) {//注意条件不能合并
                    //深比较
                    if (diff(propA, propB, deep)) {
                        return true;
                    }
                }
                else {
                    //浅比较
                    if (typeof propA === "function"&& propA.toString() !== propB.toString()) {//如果属性是函数
                        return true;
                    }
                    else if (propA !== propB) {
                        return true;
                    }
                }


            }
        } catch (e) {
            console.log(objA, objB)
        }
    } else {//其他类型
        return objA !== objB;
    }

    return false;
}

/**
 * 将二维数据转树型结构
 * @param {Array} data 数据
 * @param {string } idField 节点key
 * @param {string } parentField 父节点key
 * @param {string } textField 文本key
 */
export function toTreeData(data, idField = "id", parentField = "pId", textField = "text") {
    let tree = [];//最终树数据
    let pos = {};//临时节点对象
    let count = 0;//总次数，防止死循环
    let pId = "";//一级父节点pid值
    let ids = "";//所有id值
    for (let i = 0; i < data.length; i++) {
        ids += "," + (data[i][idField] ?? "") + ","
    }
    for (let i = 0; i < data.length; i++) {
        if (ids.indexOf("," + (data[i][parentField] ?? "") + ",") <= -1) {//属于一级节点的pid值
            pId += "," + (data[i][parentField] ?? "") + ",";
        }
    }
    let index = 0;
    while (data.length !== 0 && count < 2000000) {
        count++;
        if (pId.indexOf("," + (data[index][parentField] ?? "") + ",") > -1 || !(data[index][parentField] ?? "")) {
            //一级节点
            let item = {
                ...data[index],
                id: (data[index][idField] ?? ""),
                pId: (data[index][parentField] ?? ""),
                text: data[index][textField],
                children: []


            }
            tree.push(item);
            pos[data[index][idField]] = [tree.length - 1];//节点路径
            item._path = [tree.length - 1]//保存路径,
            data.splice(index, 1);
            index--;
        } else {
            //非一级节点
            let posArr = pos[(data[index][parentField] ?? "")];//拿出父节点的路径
            if (posArr) {
                let currentNode = tree[posArr[0]];//找到在树中的位置
                for (let j = 1; j < posArr.length; j++) {
                    currentNode = currentNode.children[posArr[j]];
                }
                let item = {
                    ...data[index],
                    id: data[index][idField],
                    pId: (data[index][parentField] ?? ""),
                    text: data[index][textField],
                    children: (data[index].children ?? []),
                }
                currentNode.children.push(item);
                pos[data[index][idField]] = posArr.concat([currentNode.children.length - 1]);
                item._path = pos[data[index][idField]];//保存路径
                data.splice(index, 1);
                index--;
            }
        }
        index++;
        if (index > data.length - 1) {
            index = 0;//归零
        }
    }
    if (data.length > 0) {
        console.error("数据格式不正确，或者是数据量过大，请使用异步请求");
    }
    return tree;
}

/**
 * 将树型结构的数据扁平化
 * @param {*} data 数据
 * @returns 
 */
 export  function treeDataToFlatData(data) {
    let result = [];
    if (data && data instanceof Array) {
        for (let i = 0; i < data.length; i++) {
                data[i]._isLast = i === data.length - 1 ? true : false//目的为了画向下的虚线最一个不需要
                result.push(data[i])
            if (data[i].children && data[i].children.length > 0 && data[i].open === true) {
              result= result.concat(treeDataToFlatData(data[i].children));
            }
        }
    }
    return result;
}
