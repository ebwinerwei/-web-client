import React, { useEffect, useState } from "react";
import { gptTalkHistory } from '@/services/ant-design-pro/api';
import { useModel } from '@umijs/max';
import '../index.scss'
function HistoryList(props) {
  const { refresh, selectedHistory } = props
  const [chatHistory, setChatHistory] = useState([])

  useEffect(() => {
    gptHistoryList()
  }, [refresh])

  const gptHistoryList = async () => {
    const res = await gptTalkHistory();
    if (res.error?.errorCode == 0) {
      setChatHistory(res.data || [])
    }
  };

  return (
    <div className="chat_history_area">
      {
        chatHistory.slice(0, 3).map((item, index) => {
          return (
            <div
              className="chat_history_det"
              key={item.talkId}
              onClick={() => selectedHistory({ ...item, key: item.classId })}
            >
              <div className="chat_history_title">Chat{index + 1}</div>
              <div className="chat_history_content">{item.question}</div>
            </div>
          )
        })
      }
    </div>
  )
}
export default HistoryList
