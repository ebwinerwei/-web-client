import { useState, useEffect, useRef } from 'react';
import {
  Select,
  Slider,
  Popover,
  Tabs,
  Tag,
  Input,
  Tooltip,
  Checkbox,
  Row,
  Col,
  Upload,
  message,
  Button,
  Radio,
  Divider,
  InputNumber,
  Progress,
  Modal,
} from 'antd';
import dayjs from 'dayjs';
import COS from '@/components/Cos';
import Header from '@/components/LiveHeader';
import { DownOutlined } from '@ant-design/icons';
import { useModel, history } from '@umijs/max';
import { downloadImg } from '@/utils';
import { useInterval, useUpdate, useDebounceFn } from 'ahooks';
import { shareScreen as getWorkFlow } from '@/config/shareScreen';
import { startTask, getTaskByTaskId } from '@/services/ant-design-pro/api';
import Joyride from 'react-joyride';
import { api } from '@/utils/api';
import { t } from '@/utils/lang';
import './index.scss';

async function getQueue() {
  try {
    const res = await fetch(`http://localhost:8188/queue`);
    const data = await res.json();
    // console.log(data.queue_running,data.queue_pending)
    return {
      // Running action uses a different endpoint for cancelling
      Running: data.queue_running.length,
      Pending: data.queue_pending.length,
    };
  } catch (error) {
    console.error(error);
    return { Running: 0, Pending: 0 };
  }
}

async function interrupt() {
  const resp = await fetch(`http://localhost:8188/interrupt`, {
    method: 'POST',
  });
}

const ckpt_list = [
  { title: t('真实写实风'), ckpt: '001.safetensors' },
  { title: t('通用风格'), ckpt: '002.safetensors' },
  { title: t('色彩华丽风（偏室内）'), ckpt: '007.safetensors' },
  { title: t('城市硬冷风（偏室外）'), ckpt: '003.safetensors' },
];

const classify = [
  { title: t('自己填写提示词'), prompt: '' },
  {
    title: t('住宅'),
    prompt: t('人视图，白天，住宅，别墅，花园，水池，草地，树木，照明，屋顶花园'),
  },
  {
    title: t('商业'),
    prompt: t('白天，商业楼，商业中心，道路，商业改造，城市景观，广场，树木，屋顶花园'),
  },
  {
    title: t('写字楼'),
    prompt: t('鸟瞰图，白天，写字楼，建筑，道路，城市，广场，草地，树木，照明，屋顶花园'),
  },
  {
    title: t('公建'),
    prompt: t('白天，办公楼，公建风格，道路，城市景观，广场，树木，屋顶花园'),
  },
  { title: t('教育建筑'), prompt: t('白天，学校，图书馆，校园，校园景观，草地，树木，红砖建筑') },
  {
    title: t('厂房'),
    prompt: t('白天，厂房，现代工厂，栅格立面，干净的玻璃，在城市中，树木，未来设计感'),
  },
  {
    title: t('酒店'),
    prompt: t('白天，酒店，民宿，豪华，奢侈，干净的玻璃，在城市中，未来设计感'),
  },
  {
    title: t('客厅'),
    prompt: t(
      '橙色主题，客厅，现代极简北欧风格，柔和的光线，纯粹的画面，(明亮的色彩:1.2)，对称的构图',
    ),
  },
  {
    title: t('卧室'),
    prompt: t(
      '绿色主题，卧室，现代极简北欧风格，柔和的光线，纯粹的画面，(明亮的色彩:1.2)，对称的构图',
    ),
  },
  { title: t('书房'), prompt: t('书房，室内，阳光，白天，中式风格，创意设计，景深，明暗对比') },
  {
    title: t('厨房'),
    prompt: t('厨房，室内，阳光，白天，金属风格，现代风格，创意设计，景深，明暗对比'),
  },
  {
    title: t('卫生间'),
    prompt: t('卫生间，室内，阳光，白天，镜面，现代风格，瓷砖，创意设计，景深，明暗对比'),
  },
  {
    title: t('餐厅'),
    prompt: t('室内，餐厅，酒店公共区域，现代风格，创意设计，景深，明暗对比，橙色主题色'),
  },
  {
    title: t('办公空间'),
    prompt: t(
      '室内，办公空间，公共区域，现代风格，创意设计，景深，明暗对比，白色主题色，冷色调，灯光',
    ),
  },
  {
    title: t('展厅设计'),
    prompt: t(
      '室内，展厅，公共区域，现代风格，创意设计，景深，明暗对比，未来设计，未来感，彩色图像',
    ),
  },
  {
    title: t('接待区'),
    prompt: t('室内，接待区，公共区域，现代风格，创意设计，景深，明暗对比，高档，奢华，红色主题色'),
  },
  {
    title: t('大厅'),
    prompt: t('室内，大厅，公共区域，现代风格，创意设计，景深，明暗对比，高档，奢华，黑白主题色'),
  },
];

const Draw = () => {
  const {
    allClassify,
    live_tickets,
    get_live_tickets,
    set_result_imgs,
    set_start_img,
    set_result_single_img,
    set_function_page,
  } = useModel('global');
  const { setShowRechargeModal, userInfo, setWxLoginVisible } = useModel('loginModel');
  const update = useUpdate();
  const webcamVideo = useRef(null);
  const previewArea = useRef(null);
  const [shareBtnTxt, setShareBtnTxt] = useState(t('链接软件'));
  const [liveBtnTxt, setLiveBtnTxt] = useState(t('开启实时渲染'));
  const [autoSave, setAutoSave] = useState(false);
  const [current_imgs, set_current_imgs] = useState<any>('');

  const [lora, setLora] = useState('');
  const [weight, setWeight] = useState(0.5);
  const [contronet, setContronet] = useState(0.5);
  const [imgSize, setImgSize] = useState(576);
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(false);
  const [show_start_tab, set_show_start_tab] = useState(false);
  const [ckpt, setCkpt] = useState(ckpt_list[0].ckpt);
  const [activeClassify, setActiveClassify] = useState(classify[0].title);
  const [lockSeed, setLockSeed] = useState(false);
  const [showVideos, setShowVideos] = useState(true);
  const [progress, setProgress] = useState(0);
  const [task_id, set_task_id] = useState('');
  const [interval, setInterval] = useState<any>(undefined);
  const [has_start, set_has_start] = useState(false);
  const [joyRun, setJoyRun] = useState(false);
  const [joyIndex, setJoyIndex] = useState(0);
  const [resultImg, setResultImg] = useState('');
  const [do_start, set_do_start] = useState(false);

  // console.log('joyIndexjoyIndexjoyIndex', allClassify);
  return (
    <div className="shareScreenContainer">

    </div>
  );
};

export default Draw;
