/*
create by wangzhiyonglyk 创建树组件
 date:2016-07
 edit 2020-10 参照ztree改造
 2021-06-16 重新优化
 2021-11-28 完善组件，修复bug，将样式拆分为两种，树的高度小一点，这样好看一点，树表格则与表格对齐,增加连线，调整勾选，图标，文字等样式
 2022-01-04 将树扁平化，增加虚拟列表
 2022-01-06 增加选中滚动的功能，增加自定义勾选组件，修复onCheck的bug
 2022-01-06 增加虚线可配功能
 2022-01-07 增加类型
 */
import React, { useContext } from "react";
import { ShareContext } from "./handlerData.js";
import TreeNode from "./TreeNode.jsx";
function TreeView() {
  let nodeControl = [];
  const { visibleData, treeProps } = useContext(ShareContext);
  if (Array.isArray(visibleData)) {
    nodeControl = visibleData.map((row) => {
      if (
        row.isParent === true ||
        (Array.isArray(row.children) && row.children.length > 0)
      ) {
        //如果明确规定了，或者子节点不为空，则设置为父节点
        row.isParent = true;
      }
      return <TreeNode key={"treenode-" + row.pId + "-" + row.id} {...row} />;
    });
  }
  return (
    <ul
      id={treeProps.treeid}
      className={
        "wasabi-tree clearfix " +
        (treeProps.dottedAble === false ? " nodotted " : "")
      }
    >
      {nodeControl}
    </ul>
  );
}
export default React.memo(TreeView);
