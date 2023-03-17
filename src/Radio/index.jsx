/**
 * Created by wangzhiyonglyk
 * date:2016-04-05后开始独立改造
 * 单选框集合组件
 * 2022-01-11 将 tree组件独立出来
 */
import React, { useState, useCallback, useEffect } from "react";
import "../css/radio.css";
function Radio(props) {
  const [value, setValue] = useState(props.value);
  useEffect(() => {
    setValue(props.value);
  }, [props]);
  const onSelect = useCallback(
    (newValue, text, row) => {
      setValue(newValue === value ? null : newValue); //可以取消
      props.onSelect &&
        props.onSelect(newValue === value ? null : newValue, text, row);
    },
    [value, props]
  );

  const { data, readOnly } = props;
  if (data && data instanceof Array && data.length > 0) {
    let className = "wasabi-radio-btn " + (readOnly ? " readOnly" : "");
    return (
      <div className={"wasabi-form-group " + (props.className || "")}>
        <div
          className={
            "wasabi-form-group-body" +
            (props.readOnly || props.disabled ? " readOnly" : "")
          }
        >
          <ul className="wasabi-checkul">
            {data.map((child, index) => {
              return (
                <li key={index}>
                  <div
                    className={
                      className +
                      ((value ?? "") + "" === (child.value ?? "") + ""
                        ? " checkedRadio"
                        : "")
                    }
                    onClick={onSelect.bind(
                      this,
                      child.value,
                      child.text,
                      child
                    )}
                  >
                    <i></i>
                  </div>
                  <div
                    className={
                      "radiotext " +
                      (readOnly ? " readOnly" : "") +
                      ((value ?? "") + "" === (child.value ?? "") + ""
                        ? " checkedRadio"
                        : "")
                    }
                    onClick={onSelect.bind(
                      this,
                      child.value,
                      child.text,
                      child
                    )}
                  >
                    {child.text}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
  return null;
}
export default React.memo(Radio);
