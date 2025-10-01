import { useEffect, useState } from 'react';
import { message, Modal } from 'antd';
import ClientModal from '../ClientModal';
import RechargeModal from '../RechargeModal';
import WXLoginComponent from '../WXLoginComponent';
import { logout } from '@/services/ant-design-pro/api';
import { useModel, history } from '@umijs/max';
import { t } from '@/utils/lang';
import './index.scss';

const tabsArr = [
  {
    name: t('首页'),
    id: 1,
    class: 'dash',
    path: '/home',
  },
  {
    name: t('AI渲染'),
    id: 2,
    class: 'ai',
    path: '/list',
  },
  {
    name: t('实时渲染'),
    id: 5,
    class: 'live',
  },
  // {
  //   name: t('GPT助手'),
  //   id: 3,
  //   class: 'gpt',
  // },
  // {
  //   name: t('客户端'),
  //   id: 4,
  //   class: 'client',
  //   path: '/client',
  // },
  // {
  //   name: t('会员'),
  //   id: 6,
  //   class: 'vip',
  // },
  {
    name: t('联系我们'),
    id: 7,
    class: 'contact',
  },
];
const Header = (props) => {
  const { set_list_tab } = useModel('global');
  const { userInfo, setShowRechargeModal, setShowContactModal } = useModel('loginModel');
  const [show, setShow] = useState(true);
  const {
    wxLoginType,
    wxLoginVisible,
    getUserInfo,
    showLoginModal,
    setWxLoginVisible,
    setDoCloseWxLogin,
  } = useModel('loginModel');
  const [tab, setTab] = useState(0);
  const handleClick = (data) => {
    if (tabsArr[data].path) {
      history.push(tabsArr[data].path);
      setTab(data);
    }
    if (data === 3) {
      // window.open('https://www.openevai.com/gpt');
      Modal.success({
        title: (
          <div style={{ fontWeight: 'bold' }}>
          {t('想要无限次使用功能，请联系以下邮箱咨询购买')}
          </div>
        ),
        okText: t('知道了'),
        content: <div>ai_design_sale@blue-light.co.jp</div>,
      });
    }
    if (data === 2) {
      window.open('/ailive');
    }
    if (data === 5) {
      if (!userInfo?.userId) {
        setShowRechargeModal(false);
        setWxLoginVisible(true);
      } else {
        setShowRechargeModal(true);
      }
    }
    if (data === 6) {
      Modal.success({
        title: <div style={{ fontWeight: 'bold' }}>{t('联系我们')}</div>,
        content: (
          <div>
            {/* <div>微信：estink01/yyhyyh159</div>
            <div>邮箱：547951566@qq.com</div>
            <div>b站：AI话事人浩哥</div> */}
          </div>
        ),
      });
    }
  };

  useEffect(() => {
    if (location.pathname === '/home') {
      setTab(0);
    } else if (location.pathname === '/list') {
      setTab(1);
    } else if (location.pathname === '/client') {
      setTab(2);
    }
  }, [history.location.pathname]);

  const do_logout = async () => {
    const res = await logout();
    if (res.error.errorCode == 0) {
      message.success(t('已退出登录'));
      window.location.reload();
    } else {
      message.error(res.error.errorMsg);
    }
  };

  const go_mine = async () => {
    set_list_tab(4);
    history.push('/list');
  };

  return (
    <div className="header-wrapper" style={props.style}>
      <img
        src={'/imgs/header-icon-jp.png'}
        className="header-icon"
        onClick={() => {
          history.push('/');
        }}
      />
      <div className="header-right">
        <div className="Tabs">
          {tabsArr.map((item, index) => {
            return (
              <>
                <div
                  className={`tab ${index === tab ? 'active' : ''}`}
                  onClick={() => handleClick(index)}
                  key={index}
                >
                  {index === 4 && <div className="label">{t('永久免费')}</div>}
                  {item.name}
                  {index === tab && <div className="line" />}
                </div>
              </>
            );
          })}
        </div>
        {userInfo?.userId ? (
          <div className="logged">
            <div className="log-content" onClick={() => setShow(!show)}>
              <img src={userInfo.avatar} className="avatar"></img>
              {userInfo?.type == 1 || userInfo?.type == 2 ? (
                <img src={'/imgs/iconvip.png'} className="vip-icon" />
              ) : null}
              <div className="name">{`${userInfo?.nickname}`}</div>
            </div>
            <div className="continue_down">
              <div className="mine-result" onClick={go_mine}>
                <img src={'/imgs/result.png'} className="log-out-icon" />
                <span className="log-out-label">{t('我的制作')}</span>
              </div>
              <div className="log-out" onClick={do_logout}>
                <img src={'/imgs/log-out.png'} className="log-out-icon" />
                <span className="log-out-label">{t('退出登陆')}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="login" onClick={() => setWxLoginVisible(true)}>
            <img src={'/imgs/icon_dl@2x.png'} className="icon" />
            {t('登陆/注册')}
          </div>
        )}
      </div>
      <ClientModal />
      <RechargeModal />
      <WXLoginComponent />
    </div>
  );
};
export default Header;
