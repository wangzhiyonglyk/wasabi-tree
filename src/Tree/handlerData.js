import React from "react";
import {
  setChecked,
  setRadioChecked,
  clearChecked,
  checkedAll,
  removeNode,
  updateNode,
  renameNode,
  moveAterNode,
  moveBeforeNode,
  moveInNode,
  setOpen,
  setDisabled,
  appendChildren,
  filter,
  formatTreeNodeData,
  setLinkNodeOpen,
  treeDataToFlatData,
} from "./treeFunc";

/***************以下是处理数据的代码************************/

/**
统一处理数据
@param {*} gobalData 数据相关信息
@param {*} action 操作
@param dispatch 设置更新后的状态值
*/
export function handlerData(gobalData, action, dispatch) {
  const currentRef = gobalData.current;
  const payload = action.payload;
  let isChecked = false;
  switch (action.type) {
    //滚动更新可显示的数据,不需要加工数据
    case "showVisibleData":
      break;
    //勾选
    case "onChecked":
      isChecked = payload.id + "" === payload.checkValue + "";
      if (payload.checkStyle === "checkbox") {
        currentRef.data = setChecked(
          currentRef.hashData,
          currentRef.data,
          payload.id,
          isChecked,
          payload.checkType
        );
      } else if (payload.checkStyle === "radio") {
        currentRef.data = setRadioChecked(
          currentRef.hashData,
          currentRef.data,
          payload.id,
          isChecked,
          payload.radioType
        );
      }
      break;
    // 重命名
    case "onRename":
      currentRef.data = renameNode(
        currentRef.hashData,
        currentRef.data,
        payload.id,
        payload.newText,
        payload.options
      );
      break;
    // 移除
    case "onRemove":
      currentRef.data = removeNode(
        currentRef.hashData,
        currentRef.data,
        payload.id,
        payload.options
      );
      currentRef.flatData = treeDataToFlatData(currentRef.data);
      break;
    // 停靠
    case "onDrop":
      if (payload.dragType === "in") {
        currentRef.data = moveInNode(
          currentRef.hashData,
          currentRef.data,
          payload.dragNode,
          payload.dropNode,
          payload.options
        );
      } else if (payload.dragType === "before") {
        currentRef.data = moveBeforeNode(
          currentRef.hashData,
          currentRef.data,
          payload.dragNode,
          payload.dropNode,
          payload.options
        );
      } else if (payload.dragType === "after") {
        currentRef.data = moveAterNode(
          currentRef.hashData,
          currentRef.data,
          payload.dragNode,
          payload.dropNode,
          payload.options
        );
      }
      currentRef.flatData = treeDataToFlatData(currentRef.data);
      break;
    /**
     * 以下父组件调用的
     */
    //过滤
    case "filter":
      if ((payload ?? "").toStrng() !== "") {
        //查询条件不为空
        currentRef.filterData = filter(currentRef.flatData, payload);
      }
      break;
    //设置折叠或展开
    case "setOpen":
      currentRef.data = setOpen(
        currentRef.hashData,
        currentRef.data,
        payload.id,
        payload.isOpened,
        payload.foldBroAble
      );
      currentRef.flatData = treeDataToFlatData(currentRef.data);
      break;
    //设置为不可用
    case "setDisabled":
      currentRef.data = setDisabled(
        currentRef.hashData,
        currentRef.data,
        payload.id,
        payload.disabled
      );
      currentRef.flatData = treeDataToFlatData(currentRef.data);
      break;
    //设置勾选
    case "setChecked":
      if (payload.id) {
        if (payload.checkStyle === "checkbox") {
          currentRef.data = setChecked(
            currentRef.hashData,
            currentRef.data,
            payload.id,
            !!payload.isChecked,
            payload.checkType
          );
        } else if (payload.checkStyle === "radio") {
          currentRef.data = setRadioChecked(
            currentRef.hashData,
            currentRef.data,
            payload.id,
            !!payload.isChecked,
            payload.radioType
          );
        }
      }
      break;
    //全部清除
    case "clearChecked":
      currentRef.data = clearChecked(currentRef.data);
      break;
    //勾选所有
    case "checkedAll":
      currentRef.data = checkedAll(currentRef.data);
      break;
    // 追加
    case "append":
      currentRef.data = appendChildren(
        currentRef.hashData,
        currentRef.data,
        payload.pId,
        payload.children,
        payload.options
      );
      currentRef.flatData = treeDataToFlatData(currentRef.data);
      break;
    //删除节点
    case "remove":
      if (Array.isArray(payload.ids)) {
        payload.ids.forEach((item) => {
          currentRef.data = removeNode(
            currentRef.hashData,
            currentRef.data,
            item,
            payload.options
          );
        });
      } else {
        currentRef.data = removeNode(
          currentRef.hashData,
          currentRef.data,
          payload.ids,
          payload.options
        );
      }
      currentRef.flatData = treeDataToFlatData(currentRef.data);
      break;
    //删除所有
    case "removeAll":
      currentRef.data = currentRef.flatData = currentRef.filterData = null;
      currentRef.hashData = new Map(); //这个要初始化
      break;
    //更新某个，或者某一组
    case "update":
      if (Array.isArray(payload.nodes)) {
        payload.nodes.forEach((item) => {
          currentRef.data = updateNode(
            currentRef.hashData,
            currentRef.data,
            item.id,
            item,
            payload.options
          );
        });
      } else {
        currentRef.data = updateNode(
          currentRef.hashData,
          currentRef.data,
          payload.nodes.id,
          payload.nodes,
          payload.options
        );
      }
      currentRef.flatData = treeDataToFlatData(currentRef.data);
      break;
    //更新所有
    case "updateAll":
      currentRef.hashData = new Map(); //先清空hash表
      //格式化数据
      currentRef.data = formatTreeNodeData(
        currentRef.hashData,
        "",
        [],
        payload.data,
        payload.options
      ); //设置路径等信息
      currentRef.flatData = treeDataToFlatData(currentRef.data);
      break;
    //移动节点到内部
    case "moveIn":
      currentRef.data = moveInNode(
        currentRef.hashData,
        currentRef.data,
        { id: payload.dragId },
        { id: payload.dropId },
        payload.options
      );
      currentRef.flatData = treeDataToFlatData(currentRef.data);
      break;
    //移动节点到前面
    case "moveBefore":
      currentRef.data = moveBeforeNode(
        currentRef.hashData,
        currentRef.data,
        { id: payload.dragId },
        { id: payload.dropId },
        payload.options
      );
      currentRef.flatData = treeDataToFlatData(currentRef.data);
      break;
    //移动节点到后面
    case "moveAfter":
      currentRef.data = moveAterNode(
        currentRef.hashData,
        currentRef.data,
        { id: payload.dragId },
        { id: payload.dropId },
        payload.options
      );
      currentRef.flatData = treeDataToFlatData(currentRef.data);
      break;
    //展开所有父节点
    case "setLinkOpen":
      currentRef.data = setLinkNodeOpen(
        currentRef.hashData,
        currentRef.data,
        payload
      );
      currentRef.flatData = treeDataToFlatData(currentRef.data);
      break;
    default:
      break;
  }
  /**
   * 如果有dispatch,异步执行，保证多条操作合并成一个action,更新数据
   */
  if (dispatch) {
    clearTimeout(currentRef.asyncAction);
    currentRef.asyncAction = setTimeout(() => {
      dispatch({ type: "update", payload: gobalData });
    }, 10);
  }
}

/************************以上是处理数据的代码*************************/

/******************下面是reduce的代码******************/
/**
 * 处理可见数据 保证在滚动过程中只切割，不处理数据加工
 * @param {*} gobalDataRef 全局缓存的数据
 * @returns
 */
function getVisibleData(gobalDataRef) {
  let visibleData = [];
  try {
    if (gobalDataRef?.filterData) {
      // 有新的过滤条件
      //有旧的筛选，切割，得到可见数据
      visibleData = gobalDataRef?.filterData?.slice(
        gobalDataRef.visibleDataArgs.sliceBeginIndex,
        gobalDataRef.visibleDataArgs.sliceEndIndex
      );
    } else {
      //切割，得到可见数据
      visibleData = gobalDataRef?.flatData?.slice(
        gobalDataRef.visibleDataArgs.sliceBeginIndex,
        gobalDataRef.visibleDataArgs.sliceEndIndex
      );
    }
  } catch (e) {
    console.log("getVisibleData", e);
  }
  return visibleData;
}

/** 
注意了设置某个节点选中时，滚动事件是单独处理 因为这里只是切割数据，不用数据加工
*/
/**
 * state中包含的字段：
 * clickId：选中的节点
 * loadingId：异步加载的节点
 * visibleData：当前可见的数据
 * scrollIndex：要滚动指定节点的数据下标
 */
//防止重复执行，原因不详
let preAction;
let preState; //状态值
export function myReducer(state, action) {
  try {
    if (preAction === action) {
      return preState; // 防止重复
    }
    preAction = action; // 防止重复执行
    const payload = action.payload;
    switch (action.type) {
      //加载
      case "loading":
        preState = {
          ...state,
          loadingId: payload,
        };
        break;
      // 单击，双击
      case "onClick":
      case "onDoubleClick":
        preState = {
          ...state,
          clickId: payload,
        };
        break;

      /** 
            设置某个节点选中
            */

      case "selectNode":
        preState = {
          ...state,
          clickId: payload.id, //设置选中
          //判断是否要滚动
          scrollIndex: {
            index: payload.gobalData.current.flatData.findIndex((item) => {
              return item.id === payload.id;
            }),
          }, // 设为对象，方便判断字段更新了
        };
        break;
      /*
            更新数据
            */
      case "update":
        preState = {
          ...state,
          visibleData: getVisibleData(payload.current),
        };
        break;
      default:
        break;
    }
    return preState;
  } catch (e) {
    console.log("reduce error", e);
  }
  return state;
}
/***下面是reduce的代码******************/

/****树组件的上下文****/
export const ShareContext = React.createContext({});
