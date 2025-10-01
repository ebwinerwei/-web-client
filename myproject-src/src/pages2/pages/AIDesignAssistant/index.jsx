import React, { useEffect, useState } from 'react';
import { Menu } from 'antd';
import { useModel } from '@umijs/max';
import { menuItems, findItemByKey } from './jsx/utils';
import MenuList from './jsx/menuList';
import ChatBox from './jsx/chatBox';
import HistoryList from './jsx/historyList';
import LoginStatusInfo from './jsx/loginStatusInfo';
import WXLoginComponent from '@/components/WXLoginComponent';
import RechargeModal from '@/components/RechargeModal';
import Header from '@/components/LiveHeader';
import { t } from '@/utils/lang'
import './index.scss';

function AIDesignAssistant() {
  const { userInfo, setWxLoginVisible } = useModel('loginModel');
  const { get_gpt_tickets } = useModel('global');
  const [currentChat, setCurrentChat] = useState(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!userInfo?.userId) {
      return;
    }
    get_gpt_tickets();
  }, [userInfo?.userId]);

  const startChat = (item) => {
    if (!userInfo?.userId) {
      setWxLoginVisible(true);
      return;
    }
    const arr = findItemByKey(menuItems, item.key);
    if (arr?.length) {
      setCurrentChat(arr[0]);
    } else {
      setCurrentChat(null);
    }
  };

  const selectedHistory = (item) => {
    setCurrentChat(item);
  };

  return (
    <div className="ai_assistant_container">
      <div className="ai_assistant_left">
        <div className="ai_assistant_lt">
          <Menu
            selectedKeys={currentChat ? [currentChat.key] : []}
            defaultOpenKeys={['9', '8', '10']}
            mode="inline"
            items={menuItems}
            onClick={(item) => startChat(item)}
          />
        </div>
        <div className="ai_assistant_lb">
          <HistoryList refresh={refresh} selectedHistory={selectedHistory} />
          <LoginStatusInfo />
        </div>
      </div>
      <div className="ai_assistant_right">
        <div className="right_title">
          <img src="/imgs/ai_design_assistant/icon_srz.png" />
          <Header />
        </div>
        {!currentChat ? (
          <div className="chat-area">
            <div className="tips">
              {t('专门针对建筑、室内设计师工作日常打造的AI大模型，底层是OpenAl的Chatgpt')}
            </div>
            <MenuList onClick={startChat} />
          </div>
        ) : (
          <ChatBox
            key={currentChat.key || currentChat.talkId}
            currentChat={currentChat}
            onClick={() => startChat({ key: '7' })}
            refresh={refresh}
            setRefresh={setRefresh}
          />
        )}
      </div>
      <WXLoginComponent />
      <RechargeModal />
    </div>
  );
}
export default AIDesignAssistant;
