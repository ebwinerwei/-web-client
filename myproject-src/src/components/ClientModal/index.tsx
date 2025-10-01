import { useState } from 'react';
import { Modal, message } from 'antd';
import { useModel } from '@umijs/max';
import { t } from '@/utils/lang'
import './index.scss';
const Index: React.FC = (props: any) => {
  const { showClientDownloadModal, setShowClientDownloadModal } = useModel('loginModel');

  return (
    <Modal
      width={850}
      footer={true}
      visible={showClientDownloadModal}
      maskClosable={false}
      centered={true}
      closable={false}
      destroyOnClose={true}
      className={'load-client-modal-wrap'}
      onCancel={() => setShowClientDownloadModal(false)}
    >
      <div className="load-client-modal">
        <div className="content">
          <div className="closeIcon" onClick={() => setShowClientDownloadModal(false)}>
            <i className="iconfont icon-close" style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <div className="modal-left">
            <div className="title1">{t('客户端所有功能')}</div>
            <div className="title2">{t('永久免费')}！</div>
            <div className="info">
              {t('电脑最低配置要求')}
              <div className="info1">{t('显卡类型： N卡')}</div>
              <div className="info1">{t('显卡型号： 1660及以上')}</div>
              <div className="info1">{t('显卡内存： 6G以上')}</div>
              <div className="info1">{t('内存大小： 16G及以上')}</div>
              <div className="info1">{t('硬盘剩余容量：50G以上')}</div>
            </div>
          </div>
          <div className="modal-right">
            <div className="title">
              <img src={'/imgs/logo.png'} alt="" className="logo" />
              <div className="label">{t('客户端下载地址')}</div>
            </div>
            <div className="baidu">
              <img src={'/imgs/icon_bdwp.png'} alt="" className="icon" />
              <div className="label">
                {t('百度网盘')}：https://pan.baidu.com/s/1V1p6i-oYvM3X7cMPhOaWxQ?pwd=93xk{' '}
              </div>
              <div
                className="copy"
                onClick={() =>
                  window.open('https://pan.baidu.com/s/1V1p6i-oYvM3X7cMPhOaWxQ?pwd=93xk ')
                }
              >
                {t('打开链接')}
              </div>
            </div>
            <div className="kuake">
              <img src={'/imgs/icon_kkwp.png'} alt="" className="icon" />
              <div className="label">{t('夸克网盘')}：https://pan.quark.cn/s/c911e97c5960</div>
              <div
                className="copy"
                onClick={() => window.open('https://pan.quark.cn/s/c911e97c5960')}
              >
                {t('打开链接')}
              </div>
            </div>
            {/* <div className="ali">
              <img src={'/imgs/icon_alwp.png'} alt="" className="icon" />
              <div className="label">阿里网盘：https://pan.quark.cn/s/cf7644d06dda</div>
              <div
                className="copy"
                onClick={() => window.open('https://pan.quark.cn/s/cf7644d06dda')}
              >
                打开链接
              </div>
            </div> */}
            <div className="sure" onClick={() => setShowClientDownloadModal(false)}>
              {t('确定')}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default Index;
