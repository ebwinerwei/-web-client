import { useEffect, useState } from 'react';
import { Modal, message, Divider, Button, Table } from 'antd';
import { useModel, history } from '@umijs/max';
import './index.scss';
import { t } from '@/utils/lang';
const Index: React.FC = (props: any) => {
  const { showRechargeModal, setShowRechargeModal } = useModel('loginModel');

  return (
    <Modal
      width={500}
      footer={true}
      visible={showRechargeModal}
      centered={true}
      closable={false}
      destroyOnClose={true}
      className="vip-recharge-modal-wrap"
      onCancel={() => setShowRechargeModal(false)}
    >
      <div className="vip-recharge-modal">
        <div>{t('想要无限次使用功能，请联系以下邮箱咨询购买')}</div>
        <div style={{ margin: '20px 0', fontSize: 20, fontWeight: 'bold' }}>
          ai_design_sale@blue-light.co.jp
        </div>
        <div>
          <Button type="primary" onClick={() => setShowRechargeModal(false)}>
            {t('确定')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Index;
