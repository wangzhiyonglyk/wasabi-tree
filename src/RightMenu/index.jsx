/**
 * create by wangzhiyong
 * date:2021-07-03
 * desc:右键菜单
 */
import React from "react";
import ContentMenuPanel from "../ContentMenu/ContentMenuPanel";
import ContentMenu from "../ContentMenu";
import LinkButton from "../LinkButton";
class RightMenu extends React.Component {
  constructor(props) {
    super(props);
    this.menu = React.createRef();
    this.state = {};
    this.onClick = this.onClick.bind(this);
  }
  open(event) {
    if (event) {
      this.menu.current.open(event);
    }
  }

  onClick(name, event) {
    this.props.onClick && this.props.onClick(name, event);
  }
  render() {
    return (
      <ContentMenu
        ref={this.menu}
        style={this.props.style}
        onClick={this.onClick}
      >
        <ContentMenuPanel key="1" name="add">
          <LinkButton
            theme="info"
            iconCls="icon-merge-cell"
            title="添加同级分类"
          >
            添加同级分类
          </LinkButton>
        </ContentMenuPanel>

        <ContentMenuPanel key="2" name="add-sub">
          <LinkButton theme="info" iconCls="icon-add" title="添加子类">
            添加子类
          </LinkButton>
        </ContentMenuPanel>
        <ContentMenuPanel key="4" name="delete">
          <LinkButton theme="info" iconCls="icon-delete" title="删除">
            删除
          </LinkButton>
        </ContentMenuPanel>
      </ContentMenu>
    );
  }
}
export default RightMenu;
