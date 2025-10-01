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
import COS from '@/components/Cos';
import Header from '@/components/Header';
import { arch_prompt } from '@/config/prompts';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useModel, history, useLocation } from '@umijs/max';
import { QuestionCircleOutlined, DownOutlined } from '@ant-design/icons';
import { startTask, getTaskByTaskId } from '@/services/ant-design-pro/api';
import ImgEditor from '@/components/ImgEditor';
import dayjs from 'dayjs';
import { useInterval, useDebounceFn } from 'ahooks';
import { t } from '@/utils/lang';
import './index.scss';
import { ActionRightTickets, ActionRightTickets_Small } from '@/components/ActionRightTickets';

const MIN_BRUSH_SIZE = 10;
const MAX_BRUSH_SIZE = 200;
const { Dragger } = Upload;
const { TextArea } = Input;
const { TabPane } = Tabs;

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
  const [show_start_tab, set_show_start_tab] = useState(false);
  const [open, setOpen] = useState(false);
  const [promptTxt, setPromptTxt] = useState('');
  const [active_type, set_active_type] = useState(0);
  const [style_img, set_stype_img] = useState('');
  const [active_select_type, set_active_select_type] = useState(-1);
  const [has_start, set_has_start] = useState(false);
  const [task_id, set_task_id] = useState('');
  const [queue_num, set_queue_num] = useState(0);
  const [upload_img, set_upload_img] = useState('');
  const [upload_show_img, set_upload_show_img] = useState('');
  const [interval, setInterval] = useState(undefined);

  const [fetch_data, set_fetch_data] = useState(null);
  const [number, setNumber] = useState(35);
  const [num_interval, set_num_interval] = useState(undefined);

  useEffect(() => {
    get_tickets();
    if (!userInfo?.userId) {
      message.info(t('请先登录'));
      location.href = '/list';
      return;
    }
    if (img) set_upload_img(img);
  }, []);

  useEffect(() => {
    console.log('check_history_data', check_history_data);
    if (img) {
      set_upload_img(img);
      return;
    }
    if (check_history_data?.promptId) {
      set_upload_img(check_history_data.image);
      if (check_history_data.mask) {
        maskData.current = 'https://' + check_history_data.mask;
      }
    }
  }, [allClassify, check_history_data]);

  const clear = useInterval(async () => {
    const res = await getTaskByTaskId({ taskId: task_id });
    if (res.data?.resultImg && res.data?.status == 1 && res.error.errorCode == 0) {
      // 运行完成
      const img_arr = res.data?.resultImg.split(';');
      set_start_img(fetch_data);
      set_function_page(10);
      // message.success(t('渲染完成'));
      if (img_arr.length == 1) {
        set_result_single_img(img_arr[0]);
        history.push('/done2?id=' + task_id);
      } else {
        set_result_imgs(img_arr);
        history.push('/done2?id=' + task_id);
      }
      setNumber((res.data.queueNum + 1) * 35);
      set_num_interval(undefined);
      setInterval(undefined);
      set_has_start(false);
      return;
    }
    if (res.data.status == 2) {
      message.error('流程失败，请联系客服');
      setInterval(undefined);
      setNumber((res.data.queueNum + 1) * 35);
      set_num_interval(undefined);
      return;
    }
    // if (res.data && res.error.errorCode == 0) {
    //   set_queue_num(res.data.number);
    //   return;
    // }
    console.log('res', res);
  }, interval);

  const clear2 = useInterval(async () => {
    if (number > 0) {
      setNumber(number - 1);
    }
  }, num_interval);

  const customRequest = (option) => {
    const key = `${new Date().getTime()}_${option.file.size}_.${option.file.name.split('.').pop()}`;
    message.loading({
      type: 'loading',
      content: t('图片上传中...'),
      duration: 0,
    });
    COS.uploadFile(
      {
        Bucket: 'evai-user-update-1313581156' /* 填入您自己的存储桶，必须字段 */,
        Region: 'ap-nanjing' /* 存储桶所在地域，例如ap-beijing，必须字段 */,
        Key: key /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */,
        Body: option.file /* 必须，上传文件对象，可以是input[type="file"]标签选择本地文件后得到的file对象 */,
        // 支持自定义headers 非必须
      },
      (err, data) => {
        console.log(err || data.Location);
        message.destroy();
        if (!data.Location) {
          message.error(t('图片上传失败'));
          return;
        }
        set_upload_img(`${data?.Location}`);
        const reader = new FileReader();
        reader.onload = function (event) {
          set_upload_show_img(event.target.result);
        };
        // 读取文件内容并将其转换为数据 URL
        reader.readAsDataURL(option.file);
      },
    );
  };

  useEffect(() => {
    localStorage.removeItem('gpuId');
  }, []);

  const { run: start_task } = useDebounceFn(
    async (data) => {
      if (!userInfo?.userId) {
        message.info(t('请先登录'));
        return;
      }
      if (!tickets || tickets == 0) {
        message.info(t('今日次数已用完'));
        setShowRechargeModal(true);
        return;
      }
      set_fetch_data(upload_img.includes('http') ? upload_img : `https://${upload_img}`);
      set_has_start(true);
      const params = {
        image: baseImgRef.current.includes('http')
          ? baseImgRef.current
          : `https://${baseImgRef.current}`,
        maskUrl: maskRef.current.includes('http') ? maskRef.current : `https://${maskRef.current}`,
        classifyId1: allClassify[9]?.id,
        classifyWord1: allClassify[9]?.name,
      };
      if (localStorage.getItem('gpuId')) {
        params.gpuId = localStorage.getItem('gpuId');
      }
      if (maskData.current) {
        params.mask = maskData.current;
      }
      message.loading({
        type: 'loading',
        content: t('开始设置，请稍等...'),
        duration: 0,
      });
      const res = await startTask(params);
      message.destroy();
      if (res.error.errorCode == 0 && res.data?.taskId != null) {
        setNumber((res.data.queueNum + 1) * 35);
        set_num_interval(1000);
        set_queue_num(res.data.queueNum);
        set_task_id(res.data.taskId);
        get_tickets();
        setInterval(3000);
      } else {
        set_has_start(false);
        if (res.error.errorCode == 1) {
          message.error(res.error.errorMsg);
          return;
        }
        if (res.data?.taskId == null) {
          if (res.error.errorMsg == '未登录') {
            message.error(t('账号已在其他地方登录'));
            const res = await logout();
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else {
            message.error(t('任务发起失败，taskId为null'));
          }
        } else {
          message.error(res.error.errorMsg);
        }
      }
      console.log('res', res);
    },
    {
      wait: 500,
    },
  );

  return (
    <>
      <Header />
      <div className="clean_wrap">
        <div className="draw-left">
          <div
            className="draw-back"
            onClick={() => {
              if (window.history.length == 1) {
                location.href = '/list';
              } else {
                history.back();
              }
            }}
          >
            <ArrowLeftOutlined style={{ marginRight: 12, cursor: 'pointer' }} />
            <span>{t('物体移除')}</span>
          </div>
        </div>
        <div className="draw-right">
          <div className="right-content">
            <div className="left">
              {upload_show_img || upload_img ? (
                <div className="pic-container">
                  <ImgEditor
                    ref={imgEditorRef}
                    initMask={maskData.current}
                    upload_show_img={upload_show_img}
                    upload_img={upload_img}
                  />
                  {has_start ? (
                    <div className="cover">
                      <img src={'/imgs/icon_zzxrz.png'} className="cover-icon" />
                      <div className="title">{t('正在渲染中')}</div>
                      {number == 0 ? (
                        t('图像正在生成中，请稍等')
                      ) : Number(queue_num) <= 1 ? (
                        <div className="queue">{`タスクを実行中、${number}秒で完了予定`}</div>
                      ) : (
                        <div className="queue">{`（${t('前方')}${
                          Number(queue_num) > 0 ? Number(queue_num) - 1 : 0
                        }${t('人排队，预计')}${number}${t('秒完成')}）`}</div>
                      )}
                      <div className="draw-tip">
                        {t('每次渲染结果都是随机的哦，若渲染不满意，可多试几次')}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="pic-container">
                  <Dragger
                    name="image"
                    multiple={false}
                    maxCount={1}
                    showUploadList={false}
                    beforeUpload={(file) => {
                      const img_size = file.size / 1024 / 1024;
                      const isImg = file.type.includes('image');
                      console.log('file', file);
                      if (!isImg) {
                        message.error(t(`请上传图片`));
                        return false;
                      }
                      if (img_size > 10) {
                        message.info(t('图片大小不能超过10M哦'));
                        return false;
                      }
                      return true;
                    }}
                    customRequest={(option) => customRequest(option)}
                  >
                    <div className="pic-container-inner">
                      <img src={'/imgs/icon_tpsc.png'} className="icon-draw" />
                      <div className="label">{t('拖拽底图到这里，或者点击上传')}</div>
                    </div>
                  </Dragger>
                </div>
              )}
              <div className="bottom-draw">
                <div className="right-wrapper">
                  <ActionRightTickets_Small />
                  <Upload
                    name="image"
                    multiple={false}
                    maxCount={1}
                    disabled={has_start}
                    showUploadList={false}
                    beforeUpload={(file) => {
                      const img_size = file.size / 1024 / 1024;
                      const isImg = file.type.includes('image');
                      console.log('file', file);
                      if (!isImg) {
                        message.error(t(`请上传图片`));
                        return false;
                      }
                      if (img_size > 10) {
                        message.info(t('图片大小不能超过10M哦'));
                        return false;
                      }
                      return true;
                    }}
                    customRequest={(option) => customRequest(option)}
                  >
                    <div className="btn1">{t('上传图片')}</div>
                  </Upload>
                  <div
                    className={`btn2 ${has_start ? 'active_btn2' : ''}`}
                    onClick={() => {
                      if (has_start) {
                        message.info(t('渲染中，请稍等'));
                        return;
                      }
                      if (upload_img) {
                        imgEditorRef.current?.prepare((mask, maskDataStr, baseImg) => {
                          maskRef.current = mask;
                          maskData.current = maskDataStr;
                          baseImgRef.current = baseImg;
                          start_task(1);
                        });
                      } else {
                        message.info(t('请上传图片'));
                      }
                    }}
                  >
                    {t('开始移除')}
                  </div>
                </div>
              </div>
            </div>
            <div className="right">
              <ActionRightTickets />
              <div className="bottom">
                <div className="title1">{t('效果展示：')}</div>
                <div className="title2">{t('可以移除一些小物体（大物体可采用多次移除）')}</div>
                <div className="content">
                  <div className="pic-item">
                    <img
                      src={
                        'https://eva-1313581156.cos.accelerate.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/ai%E8%AF%A6%E6%83%85%E9%A1%B5%E5%8F%B3%E4%BE%A7/%E9%80%9A%E7%94%A8AI/%E7%89%A9%E4%BD%93%E7%A7%BB%E9%99%A4/%E7%89%A9%E4%BD%93%E7%A7%BB%E9%99%A41.jpeg'
                      }
                      className="picture"
                    />
                    <div className="name">{t('原图效果')}</div>
                  </div>
                  <i className="iconfont icon-down-jiantou" />
                  <div className="pic-item">
                    <img
                      src={
                        'https://eva-1313581156.cos.accelerate.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/ai%E8%AF%A6%E6%83%85%E9%A1%B5%E5%8F%B3%E4%BE%A7/%E9%80%9A%E7%94%A8AI/%E7%89%A9%E4%BD%93%E7%A7%BB%E9%99%A4/%E7%89%A9%E4%BD%93%E7%A7%BB%E9%99%A42.jpg'
                      }
                      className="picture"
                    />
                    <div className="name">{t('渲染后效果')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Draw;
