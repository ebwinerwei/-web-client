import { useState, useEffect, useRef } from 'react';
import {
  Select,
  Slider,
  InputNumber,
  Popover,
  Tabs,
  Tag,
  Input,
  Tooltip,
  Upload,
  message,
} from 'antd';
import Header from '@/components/Header';
import { ArrowLeftOutlined, QuestionCircleOutlined, DownOutlined } from '@ant-design/icons';
import ImgEditor from '@/components/ImgEditor';
import COS from '@/components/Cos';
import { arch_prompt } from '@/config/prompts';
import { useModel, history, useLocation } from '@umijs/max';
import { useInterval, useDebounceFn } from 'ahooks';
import { startTask, getTaskByTaskId } from '@/services/ant-design-pro/api';
import dayjs from 'dayjs';
import './index.scss';
import { ActionRightTickets, ActionRightTickets_Small } from '@/components/ActionRightTickets';
import { t } from '@/utils/lang';
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Dragger } = Upload;

const Draw = () => {
  const imgEditorRef = useRef(null);
  const maskRef = useRef(null);
  const maskData = useRef(null);
  const baseImgRef = useRef(null);
  const {
    allClassify,
    tickets,
    get_tickets,
    set_result_imgs,
    start_img,
    set_start_img,
    result_single_img,
    set_result_single_img,
    set_function_page,
    check_history_data,
  } = useModel('global');
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const img = searchParams.get('img');
  const { setShowRechargeModal, userInfo } = useModel('loginModel');
  const {
    show_start_tab,
    set_show_start_tab,
    open,
    setOpen,
    cnStrength,
    set_cnStrength,
    promptTxt,
    setPromptTxt,
    style_img,
    set_style_img,
    upload_img,
    set_upload_img,
    upload_show_img,
    set_upload_show_img,
    task_id,
    set_task_id,
    queue_num,
    set_queue_num,
    interval,
    setInterval,
    has_start,
    set_has_start,
    classifyId3,
    set_classifyId3,
    classifyId2,
    set_classifyId2,
    classifyId2_index,
    set_classifyId2_index,
    ipaPlus,
    set_ipaPlus,
    lock,
    set_lock,
    ignoreWordAndImage,
    set_ignoreWordAndImage,
  } = useModel('indoorRenderModel');
  const [number, setNumber] = useState(35);
  const [num_interval, set_num_interval] = useState(undefined);

  return (
    <>
      <Header />
    </>
  );
};

export default Draw;
