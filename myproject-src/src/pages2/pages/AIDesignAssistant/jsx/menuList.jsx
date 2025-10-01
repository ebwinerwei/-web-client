import React from "react";
import { menuItems } from "./utils";
import '../index.scss'

function MenuList(props) {
  const { onClick } = props
  const list = menuItems.reduce((pre, cur) => pre.concat(cur.children), []).filter(m => m.desc)
  return (
    <div className="ai_assistant_menu_list">
      {
        list.map((item, index) => {
          return (
            <div className="ai_right_menu_det" key={index} onClick={() => onClick(item)}>
              <img src={item.url} />
              <div className="ai_right_menu_det_info">
                <div className="name">
                  {item.name}
                </div>
                <div className="desc" title={item.desc}>
                  {item.desc}
                </div>
              </div>
            </div>
          )
        })
      }
    </div>
  )
}
export default MenuList
