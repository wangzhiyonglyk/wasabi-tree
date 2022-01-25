/**
 * Created by zhiyongwang
 * date:2016-04-05后开始独立改造
 * 单选框集合组件
 * 2022-01-11 将 tree组件独立出来
 */
import React, { useState, useCallback, useEffect ,useImperativeHandle} from "react";
import func from "../libs/func";
import "../css/radio.css"
function Radio(props, ref) {
    const [value, setValue] = useState(props.value);
    useEffect(() => {
        setValue(props.value)
    }, [props.value])
    const onSelect = useCallback((v, t, c) => {
        setValue(v);
        props.onSelect && props.onSelect(v, t, c);
    }, [])

    //对外接口
    useImperativeHandle(ref, () => ({
        /**
         * 设置值
         * @param {*} newValue 
         */
        setValue: (newValue) => {
            setValue(newValue)
        },
        /**
         * 获取值
         * @returns 
         */
        getValue: () => {
            return value;
        }
    }))

    const { data, readOnly } = props;
    if (data && data instanceof Array && data.length > 0) {
        let className = "wasabi-radio-btn " + (readOnly ? " readOnly" : "");
        return <div className={"wasabi-form-group " + (props.className || "")}>
            <div className={'wasabi-form-group-body' + (props.readOnly || props.disabled ? " readOnly" : "")}><ul className="wasabi-checkul radio">
                {
                    data.map((child, index) => {
                        return (
                            <li key={index}>
                                <div className={className + (((value ?? "") + "") === ((child.value ?? "") + "") ? " checkedRadio" : "")}
                                    onClick={onSelect.bind(this, child.value, child.text, child)}><i></i></div>
                                <div className={"radiotext " + (readOnly ? " readOnly" : "") + ((((value ?? "") + "") === ((child.value ?? "") + "")) ? " checkedRadio" : "")} onClick={onSelect.bind(this, child.value, child.text, child)}>{child.text}
                                </div>
                            </li>
                        );
                    })
                }
            </ul></div></div>
    }
    return null;
}
export default React.memo(React.forwardRef(Radio), (pre, next) => {
    return !func.diff(pre, next)
})
