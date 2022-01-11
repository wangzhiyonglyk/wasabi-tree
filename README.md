#### 下载方式
npm install wasabi-tree
#### 引入方式
``` javascript
import Tree from "wasabi-tree";
import "wasabi-tree/lib/index.css";

function Demo(props){
    return <Tree data={props.data}></Tree>
}
```
#### 属性
|  属性名   | 类型  |说明|默认值|
|  ----  | ----  |----  |----  |
|name| string|树名称|null|
|idField| string|数据字段值名称|id|
|parentField| string|数据字段父节点名称|pId|
|textField| string|数据字段文本名称|text|
| url| string|```后台查询地址，第一次自动查询，如果设置asyncAble为true，而oAsync为空，则展开节点时自动根据这个地址查询```|null|
| params| object|向后台传输的额外参数|null|
| ```dataSource```| string|ajax的返回的数据源中哪个属性作为数据源,可以分层比如``` data.list ```)|data|
|headers|array|请求时传的表头参数|null|
| data| array|父组件传的固定数据|null|
|```simpleData``` |bool|是否使用简单的数据格式，即没有children的数组，通过pId,id自动组装成树结构|true|
|dotted| bool|是否有虚线|true|
|selectAble| bool|是否允许勾选|true|
|checkStyle| oneOf(["checkbox", "radio", func])|单选还是多选,可以通过函数返回自定义组件，```func(row){retrun node;}``` 注意： ```宽度20px,高度 30px```|checkbox
|checkType| object|勾选对于父子节点的关联关系```[y]代表选中，[n]代表取消 [p]父节点 [s]代表子节点``` |```{ "y": "ps", "n": "ps" }```|
| radioType| oneOf(["level", "all"])|单选时影响的层级```[level]同级 [all]整个树```|```all```|
| renameAble| bool|是否允许重命名|false|
| removeAble| bool|是否允许移除|false|
|asyncAble| bool|节点是否可以异步加载数据|false|
#### 事件
|  属性名   | 类型  |说明|参数|返回值|
|  ----  | ----  |----  |----  |---|
| onClick| func|单击的事件|id,text,row|
| onDoubleClick| func|双击事件|id,text,row|
| onCheck| func|勾选/取消勾选事件|checked, id, text, row|
| onExpand| func|展开/折叠事件|open, id, text, row|
| onRename| func|重命名事件|id, text, row, newText|
| onRemove| func|删除事件|id, text, row|
| onRightClick| func|右键菜单|id, text, row|
| onDrag| func|拖动事件|id, text, row|
| onDrop| func|停靠事件|dragNode(移动节点), dropNode(停靠节点), dragType(停靠方式)|
|  onAsync| func|节点异步查询，为null，则会通过url来处理|id, text, row|data,即异步加载后节点数据|
| beforeDrag| func|拖动前事件|id, text, row|```true(同意),false(不同意)```|
| beforeDrop| func|停靠前事件|dragNode(移动节点), dropNode(停靠节点), dragType(停靠方式|```true(同意),false(不同意)```
| beforeRemove| func|删除前事件|id, text, row|```true(同意),false(不同意)```
| beforeRename| func|重命名前事件|id, text, row|```true(同意),false(不同意)```
| beforeRightClick| func|鼠标右键前事件|id, text, row|```true(同意),false(不同意)```


#### 子组件方法（ref)
|  属性名| 类型  |说明|参数|返回值|
|  ----  | ----  |----  |----  |---|
|getChecked|func|获取勾选节点|null|data|
|setChecked|func|设置勾选节点|id,checked|null|
|clearChecked|func|清除全部勾选节点|null|null|
|checkedAll|func|勾选全部节点|null|data|
|setClick|func|设置节点单击选中，并且可见|id|null|
|remove|func|删除某个节点|row(必须包含id)|null|
|append|func|追加某个节点|children|null|
|filter|func|过滤节点|value|null|
|adjust|func|重新调整容器|null|null|

#### 节点Node属性
|  属性名   | 类型  |说明|默认值|
|  ----  | ----  |----  |---- |
 |isParent|bool|是否是父节点|null|
|id |string|key值|""|
|pId|string|父节点key值|""|
|text|string|节点文本|""|
|title|string|提示信息|""|
|iconCls|string |默认图标|icon-text|
|iconClose|string  |[父节点]关闭图标|icon-folder|
|iconOpen |string  |[父节点]展开图标|icon-folder|
|arrowUnFoldIcon|node|节点展开的箭头图标组件|icon-arrow-down|
|arrowFoldIcon|node|节点折叠的箭头图标组件|icon-arrow-right|
|open|bool|是否处于打开状态|true|
|checked |bool|是否被勾选|false|
|selectAble|bool|是否允许勾选|false|
|draggAble|bool|是否允许拖动|false|
|dropAble|bool|是否允许停靠|false|
|href|string|节点的链接|null|
|hide|bool|是否隐藏|false|
|children|array|子节点|null

