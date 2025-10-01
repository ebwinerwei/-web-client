import { useEffect, useState } from 'react';
import { message, Modal } from 'antd';
import ClientModal from '../ClientModal';
import RechargeModal from '../RechargeModal';
import WXLoginComponent from '../WXLoginComponent';
import { logout } from '@/services/ant-design-pro/api';
import { useModel, history } from '@umijs/max';
import dayjs from 'dayjs';
import { t } from '@/utils/lang';
import './index.scss';

export const ActionRightTickets = () => {
  const { set_list_tab, tickets, get_tickets } = useModel('global');
  const { userInfo, setShowRechargeModal, setShowContactModal } = useModel('loginModel');
  const [show, setShow] = useState(true);

  return (
    <div className="actionRightTickets">
      <div className="text2">
        <img src={'/imgs/count-down.png'} className="icon1" />
        {t('您今日的剩余次数')}：{userInfo?.type == 2 ? t('无限') : tickets}{userInfo?.type == 2 ?'':t('回')}
      </div>
      {userInfo?.userId && userInfo?.type != 1 && userInfo?.type != 2 ? (
        <div className="btn btn-vip" onClick={() => setShowRechargeModal(true)}>
          <img src={'/imgs/iconvip.png'} className="vip" />{' '}
          {userInfo?.type == 1
            ? `${dayjs(userInfo.endTime).format('YYYY-MM-DD')}${t('到期，立即续费')}`
            : t('联系我们')}
        </div>
      ) : null}
      {userInfo?.userId && userInfo?.type == 1 ? (
        <div className="btn btn-vip" onClick={() => setShowRechargeModal(true)}>
          <img src={'/imgs/iconvip.png'} className="vip" />{' '}
          {dayjs(userInfo.endTime).format('YYYY-MM-DD')}
          {t('到期，立即续费')}
        </div>
      ) : null}
      {userInfo?.userId && userInfo?.type == 2 ? (
        <div className="btn btn-vip" onClick={() => setShowRechargeModal(true)}>
          <img src={'/imgs/iconvip.png'} className="vip" />
          {dayjs(userInfo.endTime).format('YYYY-MM-DD')}
          {t('到期')}
        </div>
      ) : null}
    </div>
  );
};

export const ActionRightTickets_Small = () => {
  const { set_list_tab, tickets, get_tickets } = useModel('global');
  const { userInfo, setShowRechargeModal, setShowContactModal } = useModel('loginModel');
  const [show, setShow] = useState(true);

  return (
    <div className="actionRightTicketsSmall">
      <div>
        <img src={'/imgs/count-down.png'} className="icon1" />
        <span>
          {t('您今日的剩余次数')}：{userInfo?.type == 2 ? t('无限') : tickets}{userInfo?.type == 2 ?'':t('回')}
        </span>
      </div>
      {/* <span
        style={{ color: '#005aff88', cursor: 'pointer' }}
        onClick={() => setShowRechargeModal(true)}
      >
        {userInfo?.type == 2
          ? `${dayjs(userInfo.endTime).format('YYYY-MM-DD')}${t('到期')}`
          : userInfo?.type == 1
          ? `${dayjs(userInfo.endTime).format('YYYY-MM-DD')}${t('到期，立即续费')}`
          : t('联系我们')}
      </span> */}
    </div>
  );
};
