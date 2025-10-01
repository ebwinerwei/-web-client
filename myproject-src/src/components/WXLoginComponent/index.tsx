import React, { useEffect, useState, useRef } from 'react';
import { Modal, message, Radio, Input, Button } from 'antd';
import dayjs from 'dayjs';
import { useModel, history } from '@umijs/max';
import { emailLogin, accountLogin, sendEmail } from '@/services/ant-design-pro/api';
import styles from './index.less';
import { t } from '@/utils/lang';
export default (props: any) => {
  const { wxLoginVisible, setWxLoginVisible, setDoCloseWxLogin, getUserInfo } =
    useModel('loginModel');
  const [tabValue, setTabValue] = useState('email');
  const [accountInfo, setAccountInfo] = useState({
    email: '',
    verifyCode: '',
    channelNo: 'web',
    accountNo: '',
    password: '',
  });
  const [emailInfo, setEmailInfo] = useState({
    loading: false,
    time: 0,
  });
  const timer = useRef({});

  const onClose = () => {
    setDoCloseWxLogin(true);
    setWxLoginVisible(false);
    clearInterval(timer.current as number);
  };

  const loginOpt = async () => {
    const req = tabValue == 'email' ? emailLogin : accountLogin;
    const res = await req(accountInfo);
    if (res?.error?.errorCode == 0) {
      message.success(t('登录成功'));
      getUserInfo();
      setWxLoginVisible(false);
      window.location.reload();
    } else {
      message.error(res?.error?.errorMsg || t('登录失败'));
    }
  };

  const sendEmailOpt = async () => {
    setEmailInfo({
      ...emailInfo,
      loading: true,
    });
    const res = await sendEmail({ email: accountInfo.email });
    if (res?.error?.errorCode == 0) {
      message.success(t('发送成功'));
      setEmailInfo({
        ...emailInfo,
        loading: false,
        time: 60,
      });
    } else {
      message.error(res?.error?.errorMsg || t('发送失败'));
      setEmailInfo({
        ...emailInfo,
        loading: false,
        time: 0,
      });
    }
  };

  useEffect(() => {
    clearInterval(timer.current as number);
    if (emailInfo.time <= 0) {
      setEmailInfo({
        ...emailInfo,
        loading: false,
        time: 0,
      });
    } else {
      timer.current = setInterval(() => {
        setEmailInfo((obj) => {
          const newTime = obj.time - 1;
          return {
            ...obj,
            time: newTime,
          };
        });
      }, 1000);
    }
  }, [emailInfo.time]);

  return (
    <Modal
      width={520}
      footer={true}
      visible={wxLoginVisible}
      maskClosable={false}
      centered={true}
      closable={false}
      destroyOnClose={true}
      wrapClassName={styles.loginModal}
      onCancel={onClose}
    >
      <div className={styles.loginContainer}>
        <div className={styles.cancelIcon} onClick={onClose}>
          <i className="iconfont icon-close" />
        </div>
        <div className={styles.loginMethods}>
          <Radio.Group
            onChange={(e) => {
              setAccountInfo({
                email: '',
                verifyCode: '',
                channelNo: 'web',
                accountNo: '',
                password: '',
              });
              setTabValue(e.target.value);
            }}
            value={tabValue}
          >
            <Radio.Button value="email">{t('邮箱登录')}</Radio.Button>
            <Radio.Button value="account">{t('企业账号登录')}</Radio.Button>
          </Radio.Group>
        </div>
        <div className={styles.loginArea}>
          {tabValue == 'email' ? (
            <>
              <div className={styles.line}>
                <div className={styles.inputArea}>
                  <div className={styles.label}>{t('邮箱')}</div>
                  <Input
                    value={accountInfo.email}
                    onChange={(e) => setAccountInfo({ ...accountInfo, email: e.target.value })}
                    placeholder={t('请输入邮箱')}
                    style={{ flex: 1 }}
                  />
                </div>
                <Button
                  type="primary"
                  loading={emailInfo.loading}
                  onClick={sendEmailOpt}
                  disabled={emailInfo.time > 0}
                >
                  {t('发送验证码')}
                  {emailInfo.time ? <span>{emailInfo.time}</span> : null}
                </Button>
              </div>
              <div className={styles.line}>
                <div className={styles.label}>{t('验证码')}</div>
                <Input
                  value={accountInfo.verifyCode}
                  onChange={(e) => setAccountInfo({ ...accountInfo, verifyCode: e.target.value })}
                  placeholder={t('请输入验证码')}
                  style={{ flex: 1 }}
                />
              </div>
            </>
          ) : (
            <>
              <div className={styles.line}>
                <div className={styles.label}>{t('企业账号')}</div>
                <Input
                  value={accountInfo.accountNo}
                  onChange={(e) => setAccountInfo({ ...accountInfo, accountNo: e.target.value })}
                  placeholder={t('请输入企业账号')}
                  style={{ flex: 1 }}
                />
              </div>
              <div className={styles.line}>
                <div className={styles.label}>{t('企业密码')}</div>
                <Input.Password
                  value={accountInfo.password}
                  onChange={(e) => setAccountInfo({ ...accountInfo, password: e.target.value })}
                  placeholder={t('请输入企业密码')}
                  style={{ flex: 1 }}
                />
              </div>
            </>
          )}
          <div>
            <Button type="primary" onClick={() => loginOpt()}>
              {t('登录')}
            </Button>
          </div>
          <div style={{ fontSize: 12, marginTop: 20 }}>
            ログインすることで、
            <span
              style={{
                fontSize: 12,
                marginTop: 10,
                textDecoration: 'underline',
                cursor: 'pointer',
                marginRight: 4,
              }}
              onClick={() => {
                window.open('/AI Designs terms of service.html');
              }}
            >
              利用規約
            </span>
            に同意したことになります。
          </div>
        </div>
      </div>
    </Modal>
  );
};
