import React, { useEffect, useState } from 'react';
import { t } from '@/utils/lang'
import Button from '../shared/Button';
import Modal from '../shared/Modal';

interface Props {
  show: boolean;
  onClose: () => void;
  onCleanClick: () => void;
  onReplaceClick: () => void;
}

const InteractiveSegReplaceModal = (props: Props) => {
  const { show, onClose, onCleanClick, onReplaceClick } = props;

  return (
    <Modal
      onClose={onClose}
      title={t("蒙版已经存在")}
      className="modal-setting"
      show={show}
      showCloseIcon
    >
      <h4 style={{ lineHeight: '24px' }}>{t('移除当前蒙版或者创建一个新的蒙版？')}</h4>
      <div
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Button
          onClick={() => {
            onClose();
            onCleanClick();
          }}
        >
          {t('移除')}
        </Button>
        <Button onClick={onReplaceClick} border>
          {t('创建新模板')}
        </Button>
      </div>
    </Modal>
  );
};

export default InteractiveSegReplaceModal;
