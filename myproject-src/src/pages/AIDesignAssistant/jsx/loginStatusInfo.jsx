import React, { useEffect } from 'react';
import { useModel } from '@umijs/max';
import dayjs from 'dayjs';
import { t } from '@/utils/lang';
import '../index.scss';
function LoginStatusInfo() {
  const { userInfo, setWxLoginVisible, setShowRechargeModal } = useModel('loginModel');
  const { gpt_tickets } = useModel('global');

  const renderStatus = () => {
    if (!userInfo?.userId) {
      return (
        <>
          <div className="btn" onClick={() => setWxLoginVisible(true)}>
            {t('立即登录')}
          </div>
          <div className="tips">{t('登陆后，明日可获赠10次对话')}</div>
        </>
      );
    } else {
      return (
        <>
          <div className="btn" onClick={() => setShowRechargeModal(true)}>
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
          <div className="tips">
            {t('今日剩余免费次数：')}
            {gpt_tickets}
            {t('次')}
          </div>
        </>
      );
    }
  };

  return <div className="login_status_info">{renderStatus()}</div>;
}
export default LoginStatusInfo;
