import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { encode } from 'js-base64';
import http from '@/utils/http';
import { userInfo as get_userInfo, getVipInfo } from '@/services/ant-design-pro/api';
import { t } from '@/utils/lang'
import { generateUUID, cookieStorage } from '../utils';

export default function loginModel() {
  const [userInfo, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<any>(null);
  const [loginVisible, setLoginVisible] = useState<boolean>(false);
  const [phoneTxt, setPhoneTxt] = useState<string>(t('获取验证码'));
  const [agreement, setAgreement] = useState<boolean>(true);
  const [codeDisabled, setCodeDisabled] = useState<boolean>(true);
  const [isvalidModal, updateIsvalidModal] = useState<boolean>(false);
  const [wxLoginVisible, setWxLoginVisible] = useState<boolean>(false);
  const [wxLoginType, setWxLoginType] = useState<number>(0);
  const [doCloseWxLogin, setDoCloseWxLogin] = useState<boolean>(false);
  const [uuid, setUuid] = useState<string>('');
  const [initFetching, setInitFetching] = useState<boolean>(true);
  const [guideModalVisible, setGuideModalVisible] = useState<boolean>(false);
  const [extensionModal, setExtensionModal] = useState<boolean>(false);
  const [showCrawl, setShowCrawl] = useState<boolean>(false);
  const [userFaceVisible, setUserFaceVisible] = useState<boolean>(false);
  const [userFaceModelState, setUserFaceModelState] = useState<number>(1);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [hotWords, setHotWords] = useState<{ case: any[]; ins: any[] }>();
  const [rollHotWordList, setRollHotWordList] = useState<any[]>([]);
  const [interestLoginModalVisible, setInterestLoginModalVisible] = useState<boolean>(false);
  const [isTestUser, setTestUser] = useState<boolean>(false);

  const [showClientDownloadModal, setShowClientDownloadModal] = useState<boolean>(false);
  const [showRechargeModal, setShowRechargeModal] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);

  const getHotwords = () => {};

  const getRollHotWord = () => {
    let params;
    const subUUID = localStorage.getItem('subUUID');
    if (subUUID) {
      params = {
        uuid: subUUID,
      };
    }
  };

  useEffect(() => {
    getHotwords();
    getRollHotWord();
  }, [userInfo]);

  useEffect(() => {
    // 唯一标识
    let uuid = localStorage.getItem('lingganUUID');

    if (!uuid) {
      uuid = generateUUID();
      localStorage.setItem('lingganUUID', uuid);
    }

    setUuid(uuid);
  }, []);

  const setUserInfo = (peyload: any) => {
    setUser(peyload);
  };
  const showValidateModal = () => {
    updateIsvalidModal(true);
  };
  const hideValidateModal = () => {
    updateIsvalidModal(false);
  };
  const showLoginModal = useCallback(() => {
    setLoginVisible(true);
  }, []);
  const hideLoginModal = useCallback(() => {
    setLoginVisible(false);
  }, []);
  const canGetCode = useCallback(() => {
    setCodeDisabled(false);
  }, []);
  const canNotGetCode = useCallback(() => {
    setCodeDisabled(true);
  }, []);
  const setAgreementTrue = useCallback(() => {
    setAgreement(true);
  }, []);
  const setAgreementFalse = useCallback(() => {
    setAgreement(false);
  }, []);
  const sendMessage = useCallback(async (phoneNo) => {
    const res = await getSmsCode({ phoneNo });
    if (res?.error?.errorCode == 0) {
      message.success(t('发送成功'));
      startCount();
    } else {
      message.error(`${res?.error?.errorMsg}`);
    }
  }, []);

  const startCount = () => {
    let time = 60;
    let phoneTxt = `${time}(s)`;
    let codeDisabled = true;
    setCodeDisabled(codeDisabled);
    setPhoneTxt(phoneTxt);
    let timer = setInterval(() => {
      if (time > 0) {
        phoneTxt = `${time}(s)`;
        time--;
      } else {
        phoneTxt = t(`获取验证码`);
        codeDisabled = false;
        clearInterval(timer);
      }
      setCodeDisabled(codeDisabled);
      setPhoneTxt(phoneTxt);
    }, 1000);
  };

  const login = useCallback(async (payload: any) => {
    const loginData: any = {
      phoneNo: payload.phone,
      verifyCode: payload.code,
      type: encode('flag'),
    };
    const source = localStorage.getItem('source');
    if (source) {
      const sourceData = JSON.parse(source ?? '');
      loginData.source = {
        keyWord: sourceData.k,
        plan: sourceData.p,
        source: sourceData.source,
        unit: sourceData.u,
      };
    }
    const res = await userLogin(loginData);
    if (res?.error?.code == 0) {
      localStorage.setItem('loginPhone', payload.phone);
      localStorage.setItem('inviteCode', payload.inviteCode ?? '');
      const subUUID = localStorage.getItem('subUUID');
      if (subUUID) {
        localStorage.removeItem('subUUID');
      }
      window.location.reload();
    } else {
      message.error(res?.error?.message);
    }
  }, []);

  const loginOut = useCallback(async () => {
    setUser(null);
    let _location = localStorage.getItem('znzmo/redirect');
    http.post('/logout/invalidateSession');
    if (_location) {
      await http.delete(`${_location}`);
    }
    localStorage.removeItem('userType');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('znzmo/redirect');
    localStorage.removeItem('defaultCollect');
    localStorage.removeItem('loginAccountId');
    location.href = 'https://pin.znztv.com';
  }, []);

  const getUserInfo = async (cb?: any) => {
    const user_info = await get_userInfo();
    const vip_info = await getVipInfo();
    setUserInfo({ ...user_info.data, ...vip_info.data } ?? null);
  };

  return {
    userInfo,
    isNew,
    userType,
    setUserInfo,
    loginVisible,
    showLoginModal,
    hideLoginModal,
    phoneTxt,
    codeDisabled,
    canGetCode,
    canNotGetCode,
    sendMessage,
    agreement,
    setAgreementTrue,
    setAgreementFalse,
    login,
    loginOut,
    getUserInfo,
    isvalidModal,
    showValidateModal,
    hideValidateModal,
    wxLoginVisible,
    setWxLoginVisible,
    wxLoginType,
    setWxLoginType,
    userFaceVisible,
    setUserFaceVisible,
    userFaceModelState,
    setUserFaceModelState,
    doCloseWxLogin,
    setDoCloseWxLogin,
    uuid,
    initFetching,
    setGuideModalVisible,
    guideModalVisible,
    extensionModal,
    setExtensionModal,
    showCrawl,
    hotWords,
    getHotwords,
    rollHotWordList,
    getRollHotWord,
    interestLoginModalVisible,
    setInterestLoginModalVisible,
    isTestUser,
    setTestUser,
    showClientDownloadModal,
    setShowClientDownloadModal,
    showRechargeModal,
    setShowRechargeModal,
    showContactModal,
    setShowContactModal,
  };
}
