/*
create by wangzhiyonglyk 树组件业务容器
 创建 date:2022-01-06 树组件业务容器,用于tree,treegrid,pivot,操作逻辑是一样的
date :2022-01-07 修复tregrid单击联动的bug
   2022-01-18 将tree组件全部改为hook
   2022-02-10 修复bug
    2022-07-21 重新整体数据管理，修复各类函数bug
      2023-03-09 1. 添加新增与右键等功能，调整样式
   2.使用上下文，调整数据流方式
 */
import React, {
  useState,
  useReducer,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import PropTypes from "prop-types";
import api from "wasabi-api";
import { uuid, clone } from "../libs/func";
import { findNodeById, findLinkNodesByPath, getChecked } from "./treeFunc";
import { myReducer, handlerData, ShareContext } from "./handlerData";
import config from "./config";
import TreeView from "./TreeView";
import RightMenu from "./RightMenu";
import "./tree.css";
/**
 * 根据高度得到可见数及初始下标
 * @param {*} containerid 容器id
 * @param {*} rowDefaultHeight 高度
 * @returns
 */
const getVisibleCount = function (containerid, rowDefaultHeight) {
  let containerHeight = document.getElementById(containerid).clientHeight;
  let visibleDataCount = Math.ceil(containerHeight / rowDefaultHeight);
  let scrollTop = document.getElementById(containerid).scrollTop || 0;
  let startIndex = Math.floor(scrollTop / rowDefaultHeight) || 0;
  let endIndex = startIndex + config.bufferScale * visibleDataCount;

  return {
    visibleDataCount,
    startIndex,
    endIndex,
  };
};

/**
 * 请求数据
 * @param {*} url
 * @param {*} httpType
 * @param {*} contentType
 * @param {*} headers 头部
 * @param {*} params 参数
 * @param {*} loadSuccess
 * @param {*} loadError
 */
const getData = function (
  url,
  httpType,
  contentType,
  headers,
  params = {},
  loadSuccess = null,
  loadError = null
) {
  //请求数据
  let fetchmodel = {
    type: httpType || "post",
    contentType: contentType,
    url: url,
    headers: headers || {},
    data: params,
    success: loadSuccess,
    error: loadError,
  };
  api.ajax(fetchmodel);
  console.log("tree async-fetch", fetchmodel);
};
/**
 *
 * 处理请求后数据
 * @param {*} res 返回的数据
 * @param {*} props 属性
 */
const handerLoadData = function (res, dataSource, loadSuccess) {
  let realData = null; //得到最终的数据
  try {
    //异步加载时的根节点，没有则为树节点
    let row = window.sessionStorage.getItem("async-tree-node");
    row = row ? JSON.parse(row) : {}; //没有则
    if (typeof loadSuccess === "function") {
      //正确返回
      let resData = loadSuccess(res);
      realData = resData && resData instanceof Array ? resData : res;
    } else {
      //程序自行处理
      realData = getSource(res, dataSource);
    }
    return realData;
  } catch (e) {
    console.error("handerLoadData", e);
  }
  return [];
};

/*
  注意了默认值不能给对象,否则在useeffect在父组件没传值时每次都认为是最新的
  */
const TreeContainer = React.forwardRef(function (props, ref) {
  const {
    componentType = "tree",
    style,
    className,
    url,
    httpHeaders,
    httpType,
    contentType,
    params,
    data = null,
    dataSource = "data",
    idField = "id",
    parentField = "pId",
    textField = "text",
    childrenField = "children",
    isSimpleData = false,
    dottedAble = true,
    contextMenuAble,
    addAble,
    renameAble,
    renameIconAble,
    removeAble,
    removeIconAble,
    selectAble,
    draggAble,
    dropAble,
    asyncAble,
    foldBroAble,
    dropType,
    textFormatter,
    checkStyle,
    checkType,
    radioType,
    loadSuccess,
    onClick,
    onDoubleClick,
    onChecked,
    onContextMenu,
    onAdd,
    onRemove,
    onRename,
    onDrop,
    onDrag,
    onExpand,
    onAsync,
    beforeContextMenu,
    beforeAdd,
    beforeDrag,
    beforeRemove,
    beforeDrop,
    beforeRename,
  } = props;
  const rowDefaultHeight =
    componentType === "tree"
      ? config.rowDefaultHeight
      : config.gridRowDefaultHeight;
  const treegridRef = useRef(null); //树表格
  const menuRef = useRef(null); //右键菜单
  const contextMenuNode = useRef(null); //右键菜单的节点
  // 节点在树的位置映射
  const [treecontainerid] = useState(uuid());
  const [treeid] = useState(uuid());
  const [state, dispatch] = useReducer(myReducer, {});
  const [options] = useState({
    idField,
    parentField,
    textField,
    childrenField,
    isSimpleData,
  }); // 配置节点参数
  //全局参数
  const gobalData = useRef({
    visibleDataArgs: {
      startIndex: 0, //可见开始下标
      endIndex: 0, //可见结束下标］
      sliceBeginIndex: 0, //切割起始下标
      sliceEndIndex: 0, //切割的结束下标
      visibleDataCount: 0, //可见数据个数
    },
    data: null, // 原始数据
    flatData: null, // 扁平化的数据
    filterData: null, // 过滤后的数据
    hashData: new Map(), //hash路径数据
  });

  /**
   * 初始化化
   */
  const handlerInit = useCallback(
    (newData) => {
      document.getElementById(treecontainerid).scrollTop = 0; // 回归到顶部
      //处理数据
      handlerData(
        gobalData,
        {
          type: "updateAll",
          payload: { options, data: newData, containerid: treecontainerid },
        },
        dispatch
      ); //显示可见数据
      onScroll(); //重新渲染
    },
    [treecontainerid, options, onScroll, dispatch]
  );
  /**
   * 右键菜单事件
   * @param {*} id
   * @param {*} text
   * @param {*} row 节点
   * @param {*} power 节点的增删改权限
   * @param {*} beforeNodeRename 节点的重命名前事件，保留好，方便右键点击时回调
   * @param {*} event 事件源，用于自定义右键菜单面板时使用
   */
  const onTreeContextMenu = useCallback(
    (id, text, row, power, beforeNodeRename, event) => {
      contextMenuNode.current = {
        parentNode: row,
        power,
        beforeNodeRename,
      };
      if (onContextMenu) {
        //自定义右键菜单事件
        onContextMenu(id, text, row, power, event);
      } else {
        //只有在新增的才有右键菜单
        menuRef.current.open(power, event);
      }
    },
    []
  );
  /**
   * 右键菜单单击事件
   */
  const onTreeMenuClick = useCallback(
    (name) => {
      let { parentNode, power, beforeNodeRename } = contextMenuNode.current; //找到节点;
      if (name === "remove" && power.removeAble) {
        //先判断是否有权限
        let isAble = true;
        if (beforeRemove) {
          isAble = beforeRemove(parentNode.id, parentNode.text, parentNode);
        }
        if (isAble) {
          //允许才调用树组件的
          onTreeRemove(parentNode?.id, parentNode?.text, parentNode);
        }
      } else if (name === "rename" && power.renameAble) {
        let isAble = true;
        if (beforeRename) {
          isAble = beforeRename(parentNode.id, parentNode.text, parentNode);
        }
        if (isAble) {
          //允许才调用树组件的
          beforeNodeRename(parentNode?.id, parentNode?.text, parentNode);
        }
      } else if ((name === "add" || name === "sub-add") && power.addAble) {
        //添加兄弟节点，找到父节点
        parentNode =
          name === "add"
            ? findNodeById(
                gobalData.current.hashData,
                gobalData.current.data,
                parentNode.pId
              )
            : parentNode;
        //添加子节点
        let isaddAble = true;
        if (typeof beforeAdd === "function") {
          isaddAble = beforeAdd(parentNode?.id, parentNode?.text, parentNode);
        }
        isaddAble &&
          onAdd &&
          onAdd(parentNode?.id, parentNode?.text, parentNode);
      }
    },
    [onTreeRemove]
  );
  /**
   * 单击事件
   */
  const onTreeClick = useCallback(
    (id, text, node) => {
      if (componentType === "treegrid") {
        try {
          treegridRef.current?.setFocus();
        } catch (e) {
          console.log("treegrid error", e);
        }
      }
      dispatch({ type: "onClick", payload: id }); //延迟响应，方便获取所有勾选节点
      setTimeout(() => {
        onClick && onClick(id, text, node);
      }, 100);
    },
    [onClick]
  );
  /**
   * 双击事件
   */
  const onTreeDoubleclick = useCallback(
    (id, text, node) => {
      if (componentType === "treegrid") {
        try {
          treegridRef.current?.setFocus();
        } catch (e) {
          console.log("treegrid error", e);
        }
      }
      dispatch({ type: "onDoubleClick", payload: id });
      onDoubleClick && onDoubleClick(id, text, node);
    },
    [onDoubleClick]
  );
  /**
   * 勾选事件
   */
  const onTreeChecked = useCallback(
    (id, text, node, checkValue) => {
      handlerData(
        gobalData,
        {
          type: "onChecked",
          payload: {
            id,
            text,
            node: node,
            checkValue,
            checkType: checkType,
            checkStyle: checkStyle,
            radioType: radioType,
          },
        },
        dispatch
      );
      const isChecked = (id ?? "").toString() === (checkValue ?? "").toString();
      //延迟响应，方便获取所有勾选节点
      setTimeout(() => {
        onChecked && onChecked(isChecked, id, text, node);
      }, 100);
    },
    [onChecked, checkType, checkStyle, radioType]
  );
  /**
   * 删除事件
   */
  const onTreeRemove = useCallback(
    (id, text, row) => {
      if (window.$message) {
        window.$message.confirm("您确定删除[" + text + "］吗", () => {
          handlerData(
            gobalData,
            {
              type: "onRemove",
              payload: { id, options },
            },
            dispatch
          );
          onRemove && onRemove(id, text, row);
        });
      } else if (window.confirm("您确定删除[" + text + "］吗")) {
        handlerData(
          gobalData,
          {
            type: "onRemove",
            payload: { id, options },
          },
          dispatch
        );
        onRemove && onRemove(id, text, row);
      }
    },
    [onRemove]
  );
  /**
   * 重命名
   */
  const onTreeRename = useCallback(
    (id, text, node, newText) => {
      handlerData(
        gobalData,
        {
          type: "onRename",
          payload: { id, newText, options },
        },
        dispatch
      );
      onRename && onRename(id, text, node, newText);
    },
    [onRename]
  );
  /**
   * 停靠
   */
  const onTreeDrop = useCallback(
    (e_dragNode, e_dropNode, e_dragType) => {
      handlerData(
        gobalData,
        {
          type: "onDrop",
          payload: {
            dragNode: e_dragNode,
            dropNode: e_dropNode,
            dragType: e_dragType,
            options: options,
          },
        },
        dispatch
      );
      onDrop && onDrop(e_dragNode, e_dropNode, e_dragType);
    },
    [onDrop]
  );

  /**
   *展开节点
   */
  const onTreeExpand = useCallback(
    (isOpened, id, text, node) => {
      // 先设置折叠或者展开
      handlerData(
        gobalData,
        { type: "setOpen", payload: { id, isOpened, foldBroAble } },
        dispatch
      );
      if (asyncAble && (!node.children || node.children.length === 0)) {
        //没有数据
        let asyncChildrenData = [];
        if (onAsync && typeof onAsync === "function") {
          //自行处理
          asyncChildrenData = onAsync(id, text, node); //得到数据
          if (Array.isArray(asyncChildrenData)) {
            handlerData(
              gobalData,
              {
                type: "append",
                payload: { asyncChildrenData, id, options },
              },
              dispatch
            );
          }
        } else if (url) {
          //没有设置异步函数
          dispatch({
            type: "loading",
            payload: id,
          }); //
          //先保存节点数据
          window.sessionStorage.setItem(
            "async-tree-node",
            JSON.stringify(node)
          );
          //请求数据
          let newParams = clone(params) || {};
          newParams[idField || "id"] = id;
          getData(url, httpType, contentType, httpHeaders, newParams, (res) => {
            asyncChildrenData = onAsync(id, text, node); //得到数据
            if (Array.isArray(asyncChildrenData)) {
              handlerData(
                gobalData,
                {
                  type: "append",
                  payload: { asyncChildrenData, id, options },
                },
                dispatch
              );
            }
          });
        }
      }

      onExpand && onExpand(isOpened, id, text, node);
    },
    [idField, parentField, textField, childrenField, isSimpleData, onExpand]
  );
  /** 
    滚动事件
    */
  const onScroll = useCallback(() => {
    const vis = getVisibleCount(treecontainerid, rowDefaultHeight);

    showVisibleData(vis.startIndex, vis.endIndex, vis.visibleDataCount);
  }, [treecontainerid]);

  /**
     * 渲染当前可见数据
     @param {*} startIndex 可见区数据的开始下标
     @param {*} endIndex 可见区数据的结束下标
     @param {*} visibleDataCount 可见区数据的数量
     */
  const showVisibleData = useCallback(
    (startIndex, endIndex, visibleDataCount) => {
      let startOffset;
      if (startIndex >= 1) {
        // 减去上部预留的高度
        const size =
          startIndex * rowDefaultHeight -
          (startIndex - config.bufferScale * visibleDataCount >= 0
            ? (startIndex - config.bufferScale * visibleDataCount) *
              rowDefaultHeight
            : 0);
        startOffset = startIndex * rowDefaultHeight - size;
      } else {
        startOffset = 0;
      }
      let treeDom = document.getElementById(treeid);
      if (treeDom) {
        treeDom.style.transform = `translate3d(0,${startOffset}px,0)`;
      }

      // 当前切割的数据开始下标
      let sliceBeginIndex = startIndex - config.bufferScale * visibleDataCount;
      sliceBeginIndex = sliceBeginIndex < 0 ? 0 : sliceBeginIndex;
      // //当前切割的数据结束下标
      const sliceEndIndex = endIndex + config.bufferScale * visibleDataCount;
      gobalData.current.visibleDataArgs = { sliceBeginIndex, sliceEndIndex };
      //更新数据
      handlerData(
        gobalData,
        {
          type: "showVisibleData",
        },
        dispatch
      );
    },
    [treecontainerid]
  );
  // 对外接口
  useImperativeHandle(ref, () => ({
    /** 
      获取某个节点
      @param {*} id
      @returns
    */
    findNode(id) {
      return findNodeById(
        gobalData.current.hashData,
        gobalData.current.data,
        id
      );
    },
    /** 
    获取某个节点整个链路树
    * @param {*} id
    */
    findParents(id) {
      const node = findNodeById(
        gobalData.current.hashData,
        gobalData.current.data,
        id
      );
      return node && node._path
        ? findLinkNodesByPath(gobalData.current.data, node._path)
        : [];
    },
    /*获取所有节点
    @returns
    */
    getData() {
      return gobalData.current.data;
    },
    /*获取勾选的值
     */
    getChecked() {
      return getChecked(gobalData.current.data, checkStyle, radioType);
    },
    /**
     * 设置节点是否可用
     * @param {*} id
     * @param {*} disabled
     */
    setDisabled(id, disabled) {
      handlerData(
        gobalData,
        {
          type: "setDisabled",
          payload: {
            id,
            disabled: disabled,
          },
        },
        dispatch
      );
    },
    /**
        设置勾选
        @param {*} id
        @param {*}  isChecked 是否勾选
      
    */
    setChecked(id, isChecked) {
      handlerData(
        gobalData,
        {
          type: "setChecked",
          payload: {
            id,
            isChecked: isChecked,
            checkType: checkType,
            checkStyle: checkStyle,
            radioType: radioType,
          },
        },
        dispatch
      );
    },
    /*** 
    清除勾选
    */
    clearChecked() {
      handlerData(gobalData, { type: "clearChecked" }, dispatch);
    },
    /*** 
    全部勾选
    */
    checkedAll() {
      handlerData(gobalData, { type: "checkedAll" }, dispatch);
    },
    /*选中节点
     */
    selectNode(id) {
      //先将父节点全部展开
      handlerData(gobalData, { type: "setLinkOpen", payload: id }, dispatch);
      //再设置选中
      dispatch({ type: "selectNode", payload: { gobalData, id } });
    },
    /*
    展开所有父节点
    @param {*} id
    */
    setLinkOpen(id) {
      handlerData(gobalData, { type: "setLinkOpen", payload: id }, dispatch);
    },
    /**
     * 设置某个节点正在加载状态
     * @param {*} id
     */
    setLoading(id) {
      dispatch({
        type: "loading",
        payload: id,
      }); //
    },

    /**
     * 清除加载状态
     */
    clearLoading() {
      dispatch({
        type: "loading",
        payload: null,
      }); //
    },
    /** 
    移除某个／多个节点[数组]
    
    @param {string,array} ids
    */
    remove(ids) {
      handlerData(
        gobalData,
        { type: "remove", payload: { ids, options } },
        dispatch
      );
    },
    /**
    移除所有
    
    */
    removeAll() {
      handlerData(gobalData, { type: "removeAll" }, dispatch);
    },

    /**
         * 筛选
    @param {*} value
    */
    filter(value) {
      document.getElementById(treecontainerid).scrollTop = 0; //回归到顶部
      //处理数据
      handlerData(gobalData, { type: "filter", payload: value });
      onScroll();
    },
    /**
    追加节点
    @param {*} children
    @param {*} pId 父节点为空，即更新所有
    */
    append(children, pId) {
      if (Array.isArray(children)) {
        if (!pId) {
          document.getElementById(treecontainerid).scrollTop = 0; // 回归到顶部
        }
        handlerData(
          gobalData,
          {
            type: "append",
            payload: { children, pId, options },
          },
          dispatch
        );
        onScroll(); //重新渲染
      }
    },
    /** 
    更新节点,不会更新节点id，父id
    @param {*} nodes  一个或多个(数组)
    */
    update(nodes) {
      if (nodes) {
        //格式化节点防止有些属性没传而影响后
        handlerData(
          gobalData,
          { type: "update", payload: { nodes: nodes, options } },
          dispatch
        );
      }
    },
    /**
    更新所有
    */
    updateAll(newData) {
      handlerInit(newData);
    },
    /**
     * 移动到节点内部
     * @param {*} dragId 移动节点
     * @param {*} dropId 停靠节点
     */
    moveIn(dragId, dropId) {
      handlerData(
        gobalData,
        {
          type: "moveIn",
          payload: { dragId, dropId, options },
        },
        dispatch
      );
    },
    /**
     * 移动到节点前面
     * @param {*} dragId 移动节点
     * @param {*} dropId 停靠节点
     */
    moveBefore(dragId, dropId) {
      handlerData(
        gobalData,
        {
          type: "moveBefore",
          payload: { dragId, dropId, options },
        },
        dispatch
      );
    },
    /**
     * 移动到节点后面
     * @param {*} dragId 移动节点
     * @param {*} dropId 停靠节点
     */
    moveAfter(dragId, dropId) {
      handlerData(
        gobalData,
        {
          type: "moveAfter",
          payload: { dragId, dropId, options },
        },
        dispatch
      );
    },
    /**
     * 调整容器 用于容器高度发生变化
     */
    adjust() {
      onScroll();
    },
  }));
  //加载数据
  useEffect(() => {
    if (url) {
      //第一次初始化 请求数据
      getData(url, httpType, contentType, httpHeaders, params, (res) => {
        //格式化，注意了，空数据也可以
        const newData = handerLoadData(res, dataSource, loadSuccess);

        handlerInit(newData);
      });
    } else {
      //格式化与打平数据

      handlerInit(data);
    }
  }, [data, url, options]);

  /**
   *滚动到指定位置
   */
  useEffect(() => {
    if (state.scrollIndex && state.scrollIndex.index >= 0) {
      const vis = getVisibleCount(treecontainerid, rowDefaultHeight);
      if (
        state.scrollIndex.index > vis.endIndex ||
        state.scrollIndex.index < vis.startIndex
      ) {
        //不在可见范围内,自动调用onscroll事件
        document.getElementById(treecontainerid).scrollTop =
          (state.scrollIndex.index - 1) * rowDefaultHeight;
      }
    }
  }, [state.scrollIndex]);
  /**
   * 需要传下去的属性
   */
  const treeProps = {
    treeid,
    componentType,
    clickId: state.clickId,
    loadingId: state.loadingId,
    dottedAble,
    selectAble,
    checkStyle,
    contextMenuAble,
    addAble,
    renameAble,
    renameIconAble,
    removeAble,
    removeIconAble,
    draggAble,
    dropAble,
    dropType,
    textFormatter,
  };
  //需要下传的事件
  const treeEvents = {
    beforeContextMenu,
    beforeDrag,
    beforeRemove,
    beforeDrop,
    beforeRename,
    onDrag,
    onClick: onTreeClick,
    onDoubleClick: onTreeDoubleclick,
    onChecked: onTreeChecked,
    onRemove: onTreeRemove,
    onExpand: onTreeExpand,
    onRename: onTreeRename,
    onDrop: onTreeDrop,
    onContextMenu: onTreeContextMenu,
  };
  let control;
  if (!componentType || componentType === "tree") {
    control = <TreeView></TreeView>;
  } else if (componentType === "treegrid") {
    control = <div>未实现</div>;
  }
  return (
    <ShareContext.Provider
      value={{
        treeProps,
        treeEvents,
        visibleData: state.visibleData, //可见数据单独
      }}
    >
      <div
        id={treecontainerid}
        onScroll={onScroll}
        className={"wasabi-tree-parent " + (className ?? "")}
        style={style}
      >
        {control}
        <div
          style={{
            left: 0,
            top: 0,
            height:
              gobalData.current.flatData &&
              gobalData.current.flatData.length * rowDefaultHeight,
            position: "absolute",
            width: 1,
            opacity: 0,
          }}
        ></div>
        <RightMenu ref={menuRef} onClick={onTreeMenuClick}></RightMenu>
      </div>
    </ShareContext.Provider>
  );
});
TreeContainer.propTypes = {
  componentType: PropTypes.oneOf(["tree", "treegrid"]), //类型
  name: PropTypes.string, //树名称
  style: PropTypes.object, //style,
  className: PropTypes.string, //
  idField: PropTypes.string, //数据字段值名称
  parentField: PropTypes.string, //数据字段父节点名称
  textField: PropTypes.string, //数据字段文本名称
  childrenField: PropTypes.string, //字节点字段
  dottedAble: PropTypes.bool, //是否有虚线
  /**
   * ajax请求参数
   */
  url: PropTypes.string, //ajax地址
  httpType: PropTypes.string, //请求类型
  contentType: PropTypes.string, //请求的参数传递类型
  httpHeaders: PropTypes.object, //请求的头部
  params: PropTypes.object, //查询条件
  /**
   * 数据源
   */
  dataSource: PropTypes.string, //ajax的返回的数据源中哪个属性作为数据源
  footerSource: PropTypes.string, //页脚数据源,
  totalSource: PropTypes.string, //ajax的返回的数据源中哪个属性作为总记录数源

  data: PropTypes.array, //节点数据
  isSimpleData: PropTypes.bool, //是否使用简单的数据格式
  selectAble: PropTypes.bool, //是否允许勾选
  checkStyle: PropTypes.oneOf(["checkbox", "radio", PropTypes.func]), //单选还是多选
  checkType: PropTypes.object, //勾选对于父子节点的关联关系
  radioType: PropTypes.oneOf(["level", "all"]), //单选时影响的层级
  addAble: PropTypes.bool, //是否允许新增
  renameAble: PropTypes.bool, //是否允许重命名
  renameIconAble: PropTypes.bool, //是否允许重命名图标
  removeAble: PropTypes.bool, //是否允许移除
  removeIconAble: PropTypes.bool, //是否允许移除图标
  draggAble: PropTypes.bool, //是否允许拖动，
  dropAble: PropTypes.bool, //是否允许停靠
  contextMenuAble: PropTypes.bool, //是否允许有右键功能
  dropType: PropTypes.array, //停靠的模式["before","in","after"]
  asyncAble: PropTypes.bool, //是否可以异步加载数据
  foldBroAble: PropTypes.bool, //展开节点时是否折叠兄弟节点
  textFormatter: PropTypes.func, //自定义显示的文本格式
  //after事件
  onClick: PropTypes.func, //单击的事件
  onDoubleClick: PropTypes.func, //双击事件
  onCheck: PropTypes.func, //勾选/取消勾选事件
  onExpand: PropTypes.func, //展开事件
  onRename: PropTypes.func, //重命名事件
  onRemove: PropTypes.func, //删除事件
  onContextMenu: PropTypes.func, //自定义右键菜单组件
  onDrag: PropTypes.func, //拖动事件
  onDrop: PropTypes.func, //停靠事件
  onAsync: PropTypes.func, //异步查询
  loadSuccess: PropTypes.func, //查询数据后的成功事件

  //before 事件
  beforeContextMenu: PropTypes.func, //右键菜单打开前事件
  beforeAdd: PropTypes.func, //添加前事件
  beforeDrag: PropTypes.func, //拖动前事件
  beforeDrop: PropTypes.func, //停靠前事件
  beforeRemove: PropTypes.func, //删除前事件
  beforeRename: PropTypes.func, //重命名前事件
};
TreeContainer.defaultProps = {
  componentType: "tree",
  idField: "id",
  parentField: "pId",
  textField: "text",
  childrenField: "children",
  dataSource: "data",
  dottedAble: true,
  checkStyle: "checkbox",
  checkType: { y: "ps", n: "ps" }, //默认勾选/取消勾选都影响父子节点，
  radioType: "all",
};
export default React.memo(TreeContainer);
