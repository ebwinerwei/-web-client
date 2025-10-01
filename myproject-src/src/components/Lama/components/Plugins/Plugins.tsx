import React, { FormEvent, useEffect } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { CursorArrowRaysIcon, GifIcon } from '@heroicons/react/24/outline';
import {
  BoxModelIcon,
  ChevronRightIcon,
  FaceIcon,
  HobbyKnifeIcon,
  PersonIcon,
  MixIcon,
} from '@radix-ui/react-icons';
import { useToggle } from 'react-use';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Dropdown, Menu } from 'antd';
import { t } from '@/utils/lang'
import {
  fileState,
  isInpaintingState,
  isProcessingState,
  serverConfigState,
  isExtend,
  isMaterial,
  propmtState,
  isEditorPanel,
  isPanned,
  isRemove,
  isBuildingExterior,
} from '../../store/Atoms';
import emitter from '../../event';
import Button from '../shared/Button';

export enum PluginName {
  RemoveBG = 'RemoveBG',
  AnimeSeg = 'AnimeSeg',
  RealESRGAN = 'RealESRGAN',
  GFPGAN = 'GFPGAN',
  RestoreFormer = 'RestoreFormer',
  InteractiveSeg = 'InteractiveSeg',
  MakeGIF = 'MakeGIF',
}

const pluginMap = {
  [PluginName.RemoveBG]: {
    IconClass: HobbyKnifeIcon,
    showName: 'RemoveBG',
  },
  [PluginName.AnimeSeg]: {
    IconClass: PersonIcon,
    showName: 'Anime Segmentation',
  },
  [PluginName.RealESRGAN]: {
    IconClass: BoxModelIcon,
    showName: 'RealESRGAN 4x',
  },
  [PluginName.GFPGAN]: {
    IconClass: FaceIcon,
    showName: 'GFPGAN',
  },
  [PluginName.RestoreFormer]: {
    IconClass: FaceIcon,
    showName: 'RestoreFormer',
  },
  [PluginName.InteractiveSeg]: {
    IconClass: CursorArrowRaysIcon,
    showName: 'Interactive Segmentation',
  },
  [PluginName.MakeGIF]: {
    IconClass: GifIcon,
    showName: 'Make GIF',
  },
};

const Plugins = () => {
  // const [open, toggleOpen] = useToggle(true)
  const serverConfig = useRecoilValue(serverConfigState);
  const file = useRecoilValue(fileState);
  const isProcessing = useRecoilValue(isProcessingState);
  const [isShowExtend, setIsShowExtend] = useRecoilState(isExtend);
  const [isShowMaterial, setIsShowMaterial] = useRecoilState(isMaterial);
  const [prompt, setPrompt] = useRecoilState(propmtState);
  const [showEditorPanel, setShowEditorPanel] = useRecoilState(isEditorPanel);
  const [showPanned, setShowPanned] = useRecoilState(isPanned);
  const [showRemove, setShowRemove] = useRecoilState(isRemove);
  const [isShowBuildingExterior, setIsShowBuildingExterior] = useRecoilState(isBuildingExterior);
  const disabled = !file || isProcessing;

  useEffect(() => {
    setPrompt('');
    setIsShowMaterial(false);
    setShowPanned(false);
    setIsShowExtend(false);
    setShowEditorPanel(false);
    setShowRemove(false);
    setIsShowBuildingExterior(false);

    if (localStorage.getItem('showMaterial') == '1') {
      setIsShowMaterial(true);
    } else if (localStorage.getItem('showRemove') == '1') {
      setShowRemove(true);
    } else if (localStorage.getItem('showBuildingExterior') == '1') {
      setIsShowBuildingExterior(true);
    }
  }, []);

  const onPluginClick = (pluginName: string) => {
    if (!disabled) {
      emitter.emit(pluginName);
    }
  };

  const onRealESRGANClick = (upscale: number) => {
    if (!disabled) {
      setShowRemove(false);
      setIsShowMaterial(false);
      setIsShowExtend(false);
      setShowPanned(false);
      setIsShowBuildingExterior(false);
      emitter.emit(PluginName.RealESRGAN, { upscale });
    }
  };

  const RealESRGANPItems = (
    <Menu>
      <Menu.Item>
        <div className="DropdownMenuItem" onClick={() => onRealESRGANClick(2)}>
          {t('2倍放大')}
        </div>
      </Menu.Item>
      <Menu.Item>
        <div className="DropdownMenuItem" onClick={() => onRealESRGANClick(4)}>
          {t('4倍放大')}
        </div>
      </Menu.Item>
    </Menu>
  );

  const renderPlugins = () => {
    return serverConfig.plugins.map((plugin: string) => {
      const { IconClass } = pluginMap[plugin as PluginName];
      return (
        <Button
          key={plugin}
          className="DropdownMenuItem"
          onClick={() => onPluginClick(plugin)}
          disabled={disabled}
        >
          <IconClass style={{ width: 15 }} />
          {plugin == 'InteractiveSeg' ? t('语义区域选择') : plugin}
        </Button>
      );
    });
  };
  if (serverConfig.plugins.length === 0) {
    return null;
  }

  return true ? null : (
    <div className="plugins">
      <Button
        key={'Brush'}
        className={`plugins_button ${showRemove ? 'active_Plugins_button' : ''}`}
        onClick={() => {
          setIsShowExtend(false);
          setIsShowMaterial(false);
          setShowRemove(!showRemove);
        }}
        disabled={disabled}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 13L1.34921 12.2407C1.16773 12.3963 1.04797 12.6117 1.01163 12.8479L2 13ZM22.5 4L23.49 4.14142C23.5309 3.85444 23.4454 3.5638 23.2555 3.3448C23.0655 3.1258 22.7899 3 22.5 3V4ZM12.5 4V3C12.2613 3 12.0305 3.08539 11.8492 3.24074L12.5 4ZM1 19.5L0.0116283 19.3479C-0.0327373 19.6363 0.051055 19.9297 0.241035 20.1511C0.431014 20.3726 0.708231 20.5 1 20.5V19.5ZM11.5 19.5V20.5C11.7373 20.5 11.9668 20.4156 12.1476 20.2619L11.5 19.5ZM21.5 11L22.1476 11.7619C22.3337 11.6038 22.4554 11.3831 22.49 11.1414L21.5 11ZM2 14H12.5V12H2V14ZM13.169 13.7433L23.169 4.74329L21.831 3.25671L11.831 12.2567L13.169 13.7433ZM22.5 3H12.5V5H22.5V3ZM11.8492 3.24074L1.34921 12.2407L2.65079 13.7593L13.1508 4.75926L11.8492 3.24074ZM1.01163 12.8479L0.0116283 19.3479L1.98837 19.6521L2.98837 13.1521L1.01163 12.8479ZM1 20.5H11.5V18.5H1V20.5ZM12.4884 19.6521L13.4884 13.1521L11.5116 12.8479L10.5116 19.3479L12.4884 19.6521ZM21.51 3.85858L20.51 10.8586L22.49 11.1414L23.49 4.14142L21.51 3.85858ZM20.8524 10.2381L10.8524 18.7381L12.1476 20.2619L22.1476 11.7619L20.8524 10.2381Z"
            fill="currentColor"
          />
        </svg>
        {t('物体移除')}
      </Button>
      <Button
        key={'Material'}
        className={`plugins_button ${isShowMaterial ? 'active_Plugins_button' : ''}`}
        onClick={() => {
          setIsShowExtend(false);
          setShowRemove(false);
          setIsShowMaterial(!isShowMaterial);
        }}
        disabled={disabled}
      >
        <HobbyKnifeIcon style={{ width: 15 }} />
        {t('材质替换')}
      </Button>
      <Dropdown overlay={RealESRGANPItems} placement="bottomLeft" disabled={disabled}>
        <Button className="plugins_button" disabled={disabled}>
          <PersonIcon />
          {t('高清放大')}
          <div className="RightSlot">
            <ChevronRightIcon />
          </div>
        </Button>
      </Dropdown>
      {/* <Button
        key={'ExtendImg'}
        className={`plugins_button ${isShowExtend ? 'active_Plugins_button' : ''}`}
        onClick={() => {
          setShowRemove(false);
          setIsShowMaterial(false);
          setIsShowExtend(!isShowExtend);
        }}
        disabled={disabled}
      >
        <BoxModelIcon style={{ width: 15 }} />
        智能扩图
      </Button> */}
      <Button
        key={'RemoveBG'}
        className="plugins_button"
        onClick={() => {
          setShowRemove(false);
          setIsShowMaterial(false);
          setIsShowExtend(false);
          setShowPanned(false);
          onPluginClick('RemoveBG');
        }}
        disabled={disabled}
      >
        <GifIcon style={{ width: 15 }} />
        {t('背景移除')}
      </Button>
    </div>
  );
};

export default Plugins;
