import React, { useEffect, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { t } from '@/utils/lang'
import {
  interactiveSegClicksState,
  isInteractiveSegRunningState,
  isInteractiveSegState,
} from '../../store/Atoms';
import Button from '../shared/Button';

interface Props {
  onCancelClick: () => void;
  onAcceptClick: () => void;
}

const InteractiveSegConfirmActions = (props: Props) => {
  const { onCancelClick, onAcceptClick } = props;

  const [isInteractiveSeg, setIsInteractiveSeg] = useRecoilState(isInteractiveSegState);
  const [isInteractiveSegRunning, setIsInteractiveSegRunning] = useRecoilState(
    isInteractiveSegRunningState,
  );
  const [clicks, setClicks] = useRecoilState(interactiveSegClicksState);

  const clearState = () => {
    setIsInteractiveSeg(false);
    setIsInteractiveSegRunning(false);
    setClicks([]);
  };

  return (
    <div
      className="interactive-seg-confirm-actions"
      style={{
        visibility: isInteractiveSeg ? 'visible' : 'hidden',
      }}
    >
      <div className="action-buttons">
        <Button
          onClick={() => {
            clearState();
            onCancelClick();
          }}
        >
          {t('取消')}
        </Button>
        <Button
          border
          onClick={() => {
            clearState();
            onAcceptClick();
          }}
        >
          {t('确定')}
        </Button>
      </div>
    </div>
  );
};

export default InteractiveSegConfirmActions;
