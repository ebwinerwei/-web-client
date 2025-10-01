import { useState, useEffect } from 'react';
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
import Lama from '@/components/Lama';
import Header from '@/components/Header';
import { arch_prompt } from '@/config/prompts';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useModel, history } from '@umijs/max';
import { QuestionCircleOutlined, DownOutlined } from '@ant-design/icons';
import emitter, {
  EVENT_BRUSH_CHANGE,
  EVENT_PAINT_BY_CLEAN,
  EVENT_USE_PEN,
  EVENT_USE_SEG,
  EVENT_USE_CLEAR,
  EVENT_USE_REVERSE,
  EVENT_FILE_UPLOAD,
  EVENT_USE_CLEAN_ALL,
  EVENT_FILE_UPLOAD_COS,
  EVENT_FILE_UPLOAD_COS_SUCCESS,
} from '@/components/Lama/event';
import COS from '@/components/Cos';
import { startTask, getTaskByTaskId } from '@/services/ant-design-pro/api';
import dayjs from 'dayjs';
import { useInterval, useDebounceFn } from 'ahooks';
import './index.scss';
import { ActionRightTickets, ActionRightTickets_Small } from '@/components/ActionRightTickets';
import { t } from '@/utils/lang';
const MIN_BRUSH_SIZE = 10;
const MAX_BRUSH_SIZE = 200;
const { Dragger } = Upload;
const { TextArea } = Input;
const { TabPane } = Tabs;

const Draw = () => {
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
  } = useModel('global');
  const { setShowRechargeModal, userInfo } = useModel('loginModel');
  const [show_start_tab, set_show_start_tab] = useState(false);
  const [open, setOpen] = useState(false);
  const [brush_size, set_brush_size] = useState(40);
  const [promptTxt, setPromptTxt] = useState('');
  const [active_type, set_active_type] = useState(0);
  const [style_img, set_style_img] = useState('');
  const [active_select_type, set_active_select_type] = useState(-1);
  const [has_start, set_has_start] = useState(false);
  const [task_id, set_task_id] = useState('');
  const [queue_num, set_queue_num] = useState(0);
  const [interval, setInterval] = useState(undefined);

  const [fetch_data, set_fetch_data] = useState(null);

  useEffect(() => {
    get_tickets();
    if (!userInfo?.userId) {
      message.info(t('请先登录'));
      location.href = '/list';
      return;
    }

    if (result_single_img) {
      fetch(result_single_img)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.blob();
        })
        .then((blob) => {
          const file = new File([blob], 'img.png', { type: 'image/png' });
          emitter.emit(EVENT_FILE_UPLOAD, file);
        })
        .catch((error) => {
          console.error('Error fetching image:', error);
          // 处理错误情况
        });
    }

    return () => {
      emitter.off(EVENT_FILE_UPLOAD);
    };
  }, []);

  useEffect(() => {
    // 图片上传腾讯云云成功
    emitter.on(EVENT_FILE_UPLOAD_COS_SUCCESS, (data) => {
      console.log('data', data);
      start_task(data);
    });
    return () => {
      emitter.off(EVENT_FILE_UPLOAD_COS_SUCCESS);
    };
  });

  const clear = useInterval(async () => {
    const res = await getTaskByTaskId({ taskId: task_id });
    if (res.data?.resultImg && res.data?.status == 1 && res.error.errorCode == 0) {
      // 运行完成
      const img_arr = res.data?.resultImg.split(';');
      set_function_page(4);
      set_start_img(fetch_data.image);
      // message.success(t('渲染完成'));
      if (img_arr.length == 1) {
        set_result_single_img(img_arr[0]);
        history.push('/done2?id=' + task_id);
      } else {
        set_result_imgs(img_arr);
        history.push('/done2?id=' + task_id);
      }
      setInterval(undefined);
      set_has_start(false);
      return;
    }
    if (res.data.status == 2) {
      message.error('流程失败，请联系客服');
      setInterval(undefined);
      return;
    }
    if (res.data && res.error.errorCode == 0) {
      set_queue_num(res.data.number);
      return;
    }
    console.log('res', res);
  }, interval);

  useEffect(() => {
    localStorage.removeItem('gpuId');
  }, []);

  const { run: start_task } = useDebounceFn(
    async (data) => {
      set_fetch_data(data);
      if (!userInfo?.userId) {
        message.info(t('请先登录'));
        return;
      }
      if (!tickets || tickets == 0) {
        message.info(t('今日次数已用完'));
        setShowRechargeModal(true);
        return;
      }
      set_has_start(true);
      const params = {
        image: `https://${data.image}`,
        maskUrl: `https://${data.maskUrl}`,
        classifyId1: allClassify[8]?.id,
        classifyWord1: allClassify[8]?.name,
        text: promptTxt,
      };
      if (localStorage.getItem('gpuId')) {
        params.gpuId = localStorage.getItem('gpuId');
      }
      if (style_img) {
        params.ipadapterImgage = `https://${style_img}`;
      }
      const res = await startTask(params);
      if (res.error.errorCode == 0 && res.data?.taskId != null) {
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

  const onChange = (newValue) => {
    set_brush_size(newValue);
    emitter.emit(EVENT_BRUSH_CHANGE, newValue);
  };

  const complete = () => {
    if (active_select_type == 0) {
      emitter.emit(EVENT_PAINT_BY_CLEAN, 1);
    } else if (active_select_type == 1) {
      emitter.emit(EVENT_USE_PEN, -1);
    } else if (active_select_type == 2) {
      emitter.emit(EVENT_USE_SEG, -1);
    } else if (active_select_type == 3) {
      emitter.emit(EVENT_USE_CLEAR, -1);
    }
  };

  const promptContent = (
    <div className="popContainer">
      {t('提示词（点击自动写入输入框）')}
      <Tabs defaultActiveKey="1" tabPosition={'top'} style={{ height: 220 }}>
        {arch_prompt.map((v, i) => {
          const id = String(i);
          return (
            <TabPane tab={`${v.category.zh}`} key={id}>
              <div className={'subPrompt'}>
                {v.subcategories.map((t) => {
                  return (
                    <Tag
                      key={t.en}
                      color="success"
                      style={{
                        fontSize: 18,
                        marginBottom: 8,
                        padding: '2px 12px',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        if (promptTxt) {
                          const txt = promptTxt + `,${t.en}`;
                          setPromptTxt(txt);
                        } else {
                          setPromptTxt(`${t.en}`);
                        }
                      }}
                    >{`${t.en}`}</Tag>
                  );
                })}
              </div>
            </TabPane>
          );
        })}
      </Tabs>
    </div>
  );

  const customRequest = (option) => {
    console.log(option);
    const key = `${new Date().getTime()}_${option.file.size}_.${option.file.name.split('.').pop()}`;
    COS.uploadFile(
      {
        Bucket: 'blue-user-1304000175' /* 填入您自己的存储桶，必须字段 */,
        Region: 'ap-tokyo' /* 存储桶所在地域，例如ap-beijing，必须字段 */,
        Key: key /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */,
        Body: option.file /* 必须，上传文件对象，可以是input[type="file"]标签选择本地文件后得到的file对象 */,
        // 支持自定义headers 非必须
      },
      (err, data) => {
        console.log(err || data.Location);
        if (!data.Location) {
          message.error(t('图片上传失败'));
          return;
        }
        set_style_img(data?.Location);
      },
    );
  };

  console.log('allClassify', allClassify);
  return (
    <>
      <Header />
      <div className="materialChange">
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
            <span>{t('材质替换')}</span>
          </div>
          <div className="select-area">
            <div className="top">
              <div className="title">{t('选取区域：')}</div>
              <div
                className="title-del"
                onClick={() => {
                  complete();
                  set_active_select_type(-1);
                  setTimeout(() => {
                    emitter.emit(EVENT_USE_CLEAN_ALL, 1);
                  }, 100);
                }}
              >
                <img src={'/imgs/icon_sc.png'} className="delete-icon" />
                {t('清空选取区域')}
                <div className="under_line"></div>
              </div>
            </div>
            <div className="btn1">
              <div
                className={`btn ${active_select_type == 0 ? 'active' : ''}`}
                onClick={() => {
                  if (active_select_type == 0) {
                    set_active_select_type(-1);
                  } else {
                    set_active_select_type(0);
                  }
                  complete();
                  emitter.emit(EVENT_PAINT_BY_CLEAN, 1);
                }}
              >
                {t('涂抹选取')}
              </div>
              <div
                className={`btn ${active_select_type == 1 ? 'active' : ''}`}
                onClick={() => {
                  if (active_select_type == 1) {
                    set_active_select_type(-1);
                    emitter.emit(EVENT_USE_PEN, -1);
                  } else {
                    complete();
                    set_active_select_type(1);
                    emitter.emit(EVENT_USE_PEN, 1);
                  }
                }}
              >
                {t('钢笔选取')}
              </div>
              <div
                className={`btn ${active_select_type == 2 ? 'active' : ''}`}
                onClick={() => {
                  if (active_select_type == 2) {
                    set_active_select_type(-1);
                    emitter.emit(EVENT_USE_SEG, -1);
                  } else {
                    complete();
                    set_active_select_type(2);
                    emitter.emit(EVENT_USE_SEG, 1);
                  }
                }}
              >
                {t('AI选取')}
              </div>
              <div
                className={`btn ${active_select_type == 3 ? 'active' : ''}`}
                onClick={() => {
                  if (active_select_type == 3) {
                    set_active_select_type(-1);
                    emitter.emit(EVENT_USE_CLEAR, -1);
                  } else {
                    complete();
                    set_active_select_type(3);
                    emitter.emit(EVENT_USE_CLEAR, 1);
                  }
                }}
              >
                {t('橡皮擦')}
              </div>
              <div
                className={`btn ${active_select_type == 4 ? 'active' : ''}`}
                onClick={() => {
                  complete();
                  setTimeout(() => {
                    emitter.emit(EVENT_USE_REVERSE, 1);
                  }, 100);
                  set_active_select_type(-1);
                }}
              >
                {t('蒙层反选')}
              </div>
            </div>
          </div>
          <div className="pen">
            <div className="label">{t('笔触大小：')}</div>
            <div className="slider">
              <Slider
                min={MIN_BRUSH_SIZE}
                max={MAX_BRUSH_SIZE}
                onChange={onChange}
                value={brush_size}
              />
            </div>
          </div>
          <div className="style">
            <div className="title">{t('上传风格参考图：')}</div>
            {style_img ? (
              <div className="style-content">
                <div className="style-item">
                  <img src={`//${style_img}`} className="picture" />
                  <div className="del" onClick={() => set_style_img('')}>
                    <img src={'/imgs/del.png'} className="del-icon" />
                  </div>
                </div>
              </div>
            ) : (
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
                customRequest={(option) => customRequest(option, 1)}
                className="changeStyleImg"
              >
                <div className="style-content">
                  <div className="style-item">
                    <div className="plus">+</div>
                    <div className="plus-label">{t('上传风格参考图')}</div>
                  </div>
                </div>
              </Dragger>
            )}
          </div>
          <div className="tips">
            <div className="tip-title">
              <div className="label">{t('提示词（可不填）：')}</div>
              {/* <Popover
                trigger="click"
                placement="right"
                visible={open}
                content={promptContent}
                onVisibleChange={() => setOpen(!open)}
              >
                <div className="btn">
                  {`${t('提示词库 ')}`}&gt;<div className="btn_line"></div>
                </div>
              </Popover> */}
            </div>
            <div className="tip-content">
              {/* <Select
                defaultValue="兼顾提示词和风格"
                style={{
                  width: 180,
                  height: 40,
                }}
                options={[
                  {
                    value: '1',
                    label: '兼顾提示词和风格',
                  },
                  {
                    value: '2',
                    label: '风格为主',
                  },
                  {
                    value: '3',
                    label: '提示词为主',
                  },
                ]}
              />
              <div className="line" /> */}
              <div className="content">
                <TextArea
                  autoSize={{ minRows: 8, maxRows: 8 }}
                  value={promptTxt}
                  onChange={(e) => setPromptTxt(e.target.value)}
                  placeholder={t('请输入您需要的物件，以逗号隔开...')}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="draw-right">
          <div className="right-content">
            <div className="left">
              <div className="pic-container">
                <Lama />
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
                      }${t('人排队，预计')}${10 * Number(queue_num)}${t('秒完成')}）`}</div>
                    )}
                    <div className="draw-tip">
                      {t('每次渲染结果都是随机的哦')}
                    </div>
                    <div className="draw-tip">
                      {t('若渲染不满意，可多试几次')}
                    </div> 
                  </div>
                ) : null}
              </div>
              <div className="bottom-draw">
                <div className="right-wrapper">
                  <ActionRightTickets_Small />
                  <Upload
                    name="image"
                    multiple={false}
                    maxCount={1}
                    showUploadList={false}
                    beforeUpload={(file) => {
                      const img_size = file.size / 1024 / 1024;
                      const isImg = file.type.includes('image');
                      console.log('file', file);
                      if (has_start) {
                        message.info(t('渲染中，请稍等'));
                        return;
                      }
                      if (!isImg) {
                        message.error(t(`请上传图片`));
                        return false;
                      }
                      if (img_size > 10) {
                        message.info(t('图片大小不能超过10M哦'));
                        return false;
                      }
                      emitter.emit(EVENT_FILE_UPLOAD, file);
                      return true;
                    }}
                    customRequest={() => {}}
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
                      complete();
                      set_active_select_type(-1);
                      setTimeout(() => {
                        emitter.emit(EVENT_FILE_UPLOAD_COS);
                      }, 100);
                    }}
                  >
                    {t('开始渲染')}
                  </div>
                </div>
              </div>
            </div>
            <div className="right">
              <ActionRightTickets />
              <div className="bottom">
                <div className="title1">{t('效果展示：')}</div>
                <div className="title2">
                  {t(
                    '选取想要替换的物体，上传材质贴图或者输入提示词，例如“蓝色沙发”，即可替换物体材质',
                  )}
                </div>
                <div className="content">
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/ai%E8%AF%A6%E6%83%85%E9%A1%B5%E5%8F%B3%E4%BE%A7/%E5%AE%A4%E5%86%85AI/%E6%9D%90%E8%B4%A8%E8%B4%B4%E5%9B%BE/1.jpeg'
                      }
                      className="picture"
                    />
                    <div className="name">{t('原图效果')}</div>
                  </div>
                  <i className="iconfont icon-down-jiantou" />
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/ai%E8%AF%A6%E6%83%85%E9%A1%B5%E5%8F%B3%E4%BE%A7/%E5%AE%A4%E5%86%85AI/%E6%9D%90%E8%B4%A8%E8%B4%B4%E5%9B%BE/2.jpeg'
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
