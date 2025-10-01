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
  Button,
  Divider,
  Collapse,
  Modal,
  Carousel,
} from 'antd';
import Lama from '@/components/Lama';
import Header from '@/components/Header';
import { arch_prompt } from '@/config/prompts';
import LazyLoad from 'react-lazyload';
import { ArrowLeftOutlined, CaretRightOutlined, CloseOutlined } from '@ant-design/icons';
import { useModel, history, useLocation } from '@umijs/max';
import { QuestionCircleOutlined, DownOutlined } from '@ant-design/icons';
import emitter, {
  EVENT_BRUSH_CHANGE,
  EVENT_PAINT_BY_CLEAN,
  EVENT_USE_PEN,
  EVENT_USE_SEG,
  EVENT_USE_CLEAR,
  EVENT_USE_REVERSE,
  EVENT_NODE_IMG_UPLOAD,
  EVENT_NODE_IMG_COMPLETE,
  EVENT_NODE_IMG_CLEAR,
  EVENT_FILE_UPLOAD,
  EVENT_USE_CLEAN_ALL,
  EVENT_FILE_UPLOAD_COS,
  EVENT_FILE_UPLOAD_COS_SUCCESS,
  EVENT_NODE_DRAW_BEGIN,
  EVENT_NODE_DRAW_CLEAN,
  EVENT_AI_DISABLED,
} from '@/components/Lama/event';
import COS from '@/components/Cos';
import { ActionRightTickets, ActionRightTickets_Small } from '@/components/ActionRightTickets';
import { startTask, getTaskByTaskId, getAllSuCai } from '@/services/ant-design-pro/api';
import dayjs from 'dayjs';
import { useInterval, useDebounceFn } from 'ahooks';
import { t } from '@/utils/lang';
import './index.scss';

const MIN_BRUSH_SIZE = 10;
const MAX_BRUSH_SIZE = 200;
const { Dragger } = Upload;
const { TextArea } = Input;
const { TabPane } = Tabs;

function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

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
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const img = searchParams.get('img');
  const { setShowRechargeModal, userInfo } = useModel('loginModel');
  const carousel = useRef(null);
  const [show_start_tab, set_show_start_tab] = useState(false);
  const [origin_file, set_origin_file] = useState(null);
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

  const [cnStrength, set_cnStrength] = useState(0.7);
  const [classifyId3, set_classifyId3] = useState('');
  const [classifyId2, set_classifyId2] = useState('');
  const [classifyId2_index, set_classifyId2_index] = useState(0);
  const [view, set_view] = useState('');
  const [ignoreWordAndImage, set_ignoreWordAndImage] = useState(false);
  const [ai_disabled, set_ai_disabled] = useState(false);
  const [sucai_data, set_sucai_data] = useState([]);

  const [active_tab, set_active_tab] = useState([0, 0]);
  const [active_imgs, set_active_imgs] = useState([]);
  const [sucaiVisible, setSucaiVisible] = useState(false);
  const [task_type, set_task_type] = useState(0);
  const [tabs, set_tabs] = useState([
    [
      t('椅子'),
      t('桌子'),
      t('沙发'),
      t('木窗'),
      t('花盆'),
      t('窗帘'),
      t('电视柜'),
      t('橱柜'),
      t('橱柜'),
      t('桌子'),
      t('茶几'),
      t('餐桌'),
      t('水池'),
      t('电视柜'),
      t('桌子'),
      t('飘窗'),
    ],
    [
      t('椅子'),
      t('桌子'),
      t('沙发'),
      t('木窗'),
      t('花盆'),
      t('窗帘'),
      t('电视柜'),
      t('橱柜'),
      t('橱柜'),
      t('桌子'),
      t('茶几'),
      t('餐桌'),
      t('水池'),
      t('电视柜'),
      t('桌子'),
      t('飘窗'),
    ],
    [
      t('椅子'),
      t('桌子'),
      t('沙发'),
      t('木窗'),
      t('花盆'),
      t('窗帘'),
      t('电视柜'),
      t('橱柜'),
      t('橱柜'),
      t('桌子'),
      t('茶几'),
      t('餐桌'),
      t('水池'),
      t('电视柜'),
      t('桌子'),
      t('飘窗'),
    ],
  ]);
  const [number, setNumber] = useState(35);
  const [num_interval, set_num_interval] = useState(undefined);

  useEffect(() => {
    const init = async () => {
      const res = await getAllSuCai();
      const chunkedArray = chunkArray(res.data, Math.ceil(res.data.length / 2 + 1));
      set_sucai_data(chunkedArray);
    };
    if (sucaiVisible && !sucai_data.length) init();
    if (sucaiVisible) {
      set_active_imgs([]);
      set_active_tab([0, 0]);
    }
  }, [sucaiVisible]);

  useEffect(() => {
    get_tickets();
    if (!userInfo?.userId) {
      message.info(t('请先登录'));
      location.href = '/list';
      return;
    }

    if (img) {
      fetch(img)
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
    emitter.on(EVENT_AI_DISABLED, (data) => {
      set_ai_disabled(data);
    });
    return () => {
      emitter.off(EVENT_AI_DISABLED);
    };
  });

  useEffect(() => {
    // 图片上传腾讯云云成功
    emitter.on(EVENT_FILE_UPLOAD_COS_SUCCESS, (data) => {
      console.log('data', data);
      if (task_type == 1) {
        start_task_clean(data);
      } else {
        start_task(data);
      }
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
      set_start_img(fetch_data.image);
      set_function_page(0);
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
      set_fetch_data(data);
      set_has_start(true);
      const params = {
        image: `https://${data.image}`,
        maskUrl: `https://${data.maskUrl}`,
        text: promptTxt,
        classifyId1: allClassify[20]?.id,
        classifyWord1: allClassify[20]?.name,
        cnStrength,
        ignoreWordAndImage: ignoreWordAndImage,
      };
      if (localStorage.getItem('gpuId')) {
        params.gpuId = localStorage.getItem('gpuId');
      }
      if (style_img) {
        params.ipadapterImgage = `https://${style_img}`;
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

  useEffect(() => {
    localStorage.removeItem('gpuId');
  }, []);

  const { run: start_task_clean } = useDebounceFn(
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
      set_fetch_data(data);
      set_has_start(true);
      const params = {
        image: `https://${data.image}`,
        maskUrl: `https://${data.maskUrl}`,
        classifyId1: allClassify[9]?.id,
        classifyWord1: allClassify[9]?.name,
      };
      if (localStorage.getItem('gpuId')) {
        params.gpuId = localStorage.getItem('gpuId');
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
    message.loading({
      type: 'loading',
      content: t('图片上传中...'),
      duration: 0,
    });
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
        message.destroy();
        if (!data.Location) {
          message.error(t('图片上传失败'));
          return;
        }
        set_style_img(data?.Location);
        set_classifyId3(-1);
      },
    );
  };

  const sortBy = (attr, rev) => {
    if (rev == undefined) {
      rev = 1;
    } else {
      rev ? 1 : -1;
    }
    return function (a, b) {
      a = Number(a[attr].replace(/\D/g, ''));
      b = Number(b[attr].replace(/\D/g, ''));
      if (a < b) {
        return rev * -1;
      }
      if (a > b) {
        return rev * 1;
      }
      return 0;
    };
  };

  console.log(allClassify);
  return (
    <>
      <Header />
      <div className="architecturalPart">
        <Modal
          title=""
          width={920}
          footer={true}
          visible={sucaiVisible}
          className={'pngModal'}
          closeIcon={<CloseOutlined style={{ color: '#fff', fontSize: 18 }} />}
          onCancel={() => {
            setSucaiVisible(false);
          }}
        >
          <div className="pngContainer">
            <div className="png_title">
              <img src="/imgs/图片库.svg" />
              <span>{t('素材库')}</span>
            </div>
            <div className="sub_title">{t('上传后，记得涂抹该元素，再开始渲染!')}</div>
            <div className="carousel-wrapper">
              <div
                className="left"
                onClick={() => {
                  carousel?.current.prev();
                }}
              >
                <span class="iconfont icon-jiantou_xiangzuo"></span>
              </div>
              <div
                className="right"
                onClick={() => {
                  carousel?.current.next();
                }}
              >
                <span class="iconfont icon-jiantou_xiangyou"></span>
              </div>
              <Carousel ref={carousel} autoplay={false} dots={false}>
                <div className="btnContainer">
                  {sucai_data?.[0]?.map((v, i) => {
                    return (
                      <div
                        key={i}
                        className={`btn ${
                          active_tab[0] == 0 && active_tab[1] == i ? 'active_btn' : ''
                        }`}
                        onClick={() => {
                          set_active_tab([0, i]);
                        }}
                      >
                        {v.name}
                      </div>
                    );
                  })}
                </div>
                <div className="btnContainer">
                  {sucai_data?.[1]?.map((v, i) => {
                    return (
                      <div
                        key={i}
                        className={`btn ${
                          active_tab[0] == 1 && active_tab[1] == i ? 'active_btn' : ''
                        }`}
                        onClick={() => {
                          set_active_tab([1, i]);
                        }}
                      >
                        {v.name}
                      </div>
                    );
                  })}
                </div>
              </Carousel>
              <Divider dashed style={{ margin: '20px 0', borderColor: 'rgba(255,255,255,0.2)' }} />
              <div className="img_scroll">
                {sucai_data?.[active_tab[0]]?.[active_tab[1]]?.list?.map((v, i) => {
                  return (
                    <div
                      key={v.id}
                      style={{ position: 'relative' }}
                      onClick={() => {
                        const index = active_imgs.findIndex((t) => t == v.image);
                        if (index !== -1) {
                          active_imgs.splice(index, 1);
                          set_active_imgs([...active_imgs]);
                          return;
                        }
                        if (active_imgs.length >= 3) {
                          active_imgs.shift();
                          active_imgs.push(v.image);
                          set_active_imgs([...active_imgs]);
                          return;
                        }
                        active_imgs.push(v.image);
                        set_active_imgs([...active_imgs]);
                      }}
                    >
                      <LazyLoad height={126} offset={300}>
                        <img src={v.image} />
                      </LazyLoad>
                      {active_imgs.includes(v.image) ? (
                        <div className="active_img">
                          <img src="/imgs/72act_选择图片库.svg" />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div
                  className="add_btn"
                  onClick={() => {
                    if (active_imgs.length) {
                      emitter.emit(EVENT_NODE_IMG_UPLOAD, active_imgs);
                    }
                    setSucaiVisible(false);
                  }}
                >{`${t('确定添加')}（${t('已选')}${active_imgs.length}${t('张')}）`}</div>
              </div>
            </div>
          </div>
        </Modal>
        <div className="draw-left">
          <div className="draw-back">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div
                onClick={() => {
                  if (window.history.length == 1) {
                    location.href = '/list';
                  } else {
                    history.back();
                  }
                }}
              >
                <ArrowLeftOutlined style={{ marginRight: 12, cursor: 'pointer' }} />
                <span>{t('局部渲染')}</span>
              </div>
              <div
                className="learn"
                onClick={() => {
                  window.open(
                    'https://www.bilibili.com/video/BV1AZ42147p9/?vd_source=8629cc7fa1cf1b93a4df9f6a3700c9c7',
                  );
                }}
              >
                {t('30s教学视频')}
              </div>
            </div>
          </div>
          <div className="select-area">
            <div className="top">
              <div className="title">
                <img src="/imgs/四叶草.svg" width={18} />
                <span>{t('添加元素：')}</span>
              </div>
              <div
                className="title-del"
                onClick={() => {
                  emitter.emit(EVENT_NODE_IMG_CLEAR);
                }}
              >
                <img src={'/imgs/重置-小.svg'} className="delete-icon" />
                {t('重置')}
              </div>
            </div>
            <div className="action">
              <div className="btn1">
                <div
                  className={`btn actionBtn`}
                  onClick={() => {
                    setSucaiVisible(true);
                  }}
                >
                  {t('素材库')}
                </div>
                <Upload
                  name="image"
                  multiple={false}
                  maxCount={1}
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const img_size = file.size / 1024 / 1024;
                    const isImg = file.type.includes('image');
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
                    console.log('file', file);
                    emitter.emit(EVENT_NODE_IMG_UPLOAD, file);
                    return true;
                  }}
                  customRequest={() => {}}
                >
                  <div
                    className={`btn uploadActionBtn`}
                    onClick={() => {
                      complete();
                      set_active_select_type(-1);
                      setTimeout(() => {
                        emitter.emit(EVENT_USE_CLEAN_ALL, 1);
                      }, 100);
                    }}
                  >
                    {t('上传元素')}
                  </div>
                </Upload>
              </div>
            </div>
            {/* <Button
              onClick={() => {
                onChange(5);
                emitter.emit(EVENT_NODE_DRAW_BEGIN);
              }}
            >
              铅笔手绘
            </Button>
            <Button
              onClick={() => {
                onChange(5);
                emitter.emit(EVENT_NODE_DRAW_CLEAN);
              }}
            >
              手绘橡皮擦
            </Button> */}
          </div>
          <Divider dashed style={{ margin: '16px 0', borderColor: 'rgba(255,255,255,0.2)' }} />
          <div className="select-area">
            <div className="top">
              <div className="title">
                <img src="/imgs/区域选择.svg" width={18} />
                <span>{t('涂抹区域：')}</span>
              </div>
              <div
                className="title-del"
                onClick={() => {
                  complete();
                  set_active_select_type(-1);
                  setTimeout(() => {
                    emitter.emit(EVENT_USE_CLEAN_ALL, 1);
                  }, 100);
                  setTimeout(() => {
                    emitter.emit(EVENT_USE_CLEAN_ALL, 1);
                  }, 200);
                }}
              >
                <img src={'/imgs/重置-小.svg'} className="delete-icon" />
                {t('重置')}
              </div>
            </div>
            <div className="btn1">
              <Collapse
                activeKey={active_select_type}
                bordered={false}
                expandIcon={({ isActive }) => (
                  <CaretRightOutlined style={{ color: '#fff' }} rotate={isActive ? 90 : 0} />
                )}
                className={`site-collapse-custom-collapse ${
                  active_select_type == 0 ? 'active_site-collapse-custom-collapse' : ''
                }`}
              >
                <Collapse.Panel
                  key={0}
                  header={
                    <div
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={() => {
                        if (active_select_type == 0) {
                          set_active_select_type(-1);
                        } else {
                          set_active_select_type(0);
                        }
                        complete();
                        setTimeout(() => {
                          emitter.emit(EVENT_PAINT_BY_CLEAN, 1);
                        }, 300);
                      }}
                    >
                      <img src={'/imgs/1_涂抹.svg'} width={18} style={{ marginRight: 8 }} />
                      <span>{t('涂抹工具')}</span>
                    </div>
                  }
                  className="site-collapse-custom-panel"
                >
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
                    <Input
                      value={brush_size}
                      onChange={(e) => {
                        if (
                          !isNaN(e.target.value) &&
                          e.target.value >= 10 &&
                          e.target.value <= 200
                        ) {
                          onChange(e.target.value);
                        }
                      }}
                    />
                  </div>
                </Collapse.Panel>
              </Collapse>
              <div
                className={`btn ${active_select_type == 1 ? 'activeBtn' : ''}`}
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
                <img src={'/imgs/套索.svg'} width={18} style={{ marginRight: 8 }} />
                <span>{t('套索工具')}</span>
              </div>
              <div
                className={`btn ${active_select_type == 2 ? 'activeBtn' : ''}`}
                style={{ opacity: ai_disabled ? 0.4 : 1 }}
                onClick={() => {
                  if (ai_disabled) {
                    return;
                  }
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
                <img src={'/imgs/AI.svg'} width={18} style={{ marginRight: 8 }} />
                <span>{t('AI自动选取')}</span>
              </div>
              <Collapse
                activeKey={active_select_type}
                bordered={false}
                expandIcon={({ isActive }) => (
                  <CaretRightOutlined style={{ color: '#fff' }} rotate={isActive ? 90 : 0} />
                )}
                className={`site-collapse-custom-collapse ${
                  active_select_type == 3 ? 'active_site-collapse-custom-collapse' : ''
                }`}
              >
                <Collapse.Panel
                  key={3}
                  header={
                    <div
                      style={{ display: 'flex', alignItems: 'center' }}
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
                      <img
                        src={'/imgs/橡皮,擦除,橡皮擦.svg'}
                        width={18}
                        style={{ marginRight: 8 }}
                      />
                      <span>{t('橡皮擦')}</span>
                    </div>
                  }
                  className="site-collapse-custom-panel"
                >
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
                    <Input
                      value={brush_size}
                      onChange={(e) => {
                        if (
                          !isNaN(e.target.value) &&
                          e.target.value >= 10 &&
                          e.target.value <= 200
                        ) {
                          onChange(e.target.value);
                        }
                      }}
                    />
                  </div>
                </Collapse.Panel>
              </Collapse>
              <div
                className={`btn ${active_select_type == 4 ? 'activeBtn' : ''}`}
                onClick={() => {
                  complete();
                  setTimeout(() => {
                    emitter.emit(EVENT_USE_REVERSE, 1);
                  }, 100);
                  set_active_select_type(-1);
                }}
              >
                <img src={'/imgs/反选.svg'} width={18} style={{ marginRight: 8 }} />
                <span>{t('反选')}</span>
              </div>
              {/* <div
                className={`btn ${active_select_type == 0 ? 'active' : ''}`}
                onClick={() => {
                  if (active_select_type == 0) {
                    set_active_select_type(-1);
                  } else {
                    set_active_select_type(0);
                  }
                  complete();
                  setTimeout(() => {
                    emitter.emit(EVENT_PAINT_BY_CLEAN, 1);
                  }, 100);
                }}
              >
                涂抹选取
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
                钢笔选取
              </div>
              <div
                className={`btn ${active_select_type == 2 ? 'active' : ''}`}
                style={{ opacity: ai_disabled ? 0.5 : 1 }}
                onClick={() => {
                  if (ai_disabled) {
                    return;
                  }
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
                AI选取
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
                橡皮擦
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
                蒙层反选
              </div> */}
            </div>
          </div>
          <Divider dashed style={{ margin: '16px 0', borderColor: 'rgba(255,255,255,0.2)' }} />
          {/* <div className="space">
            <div className="space-title">空间：</div>
            <div className="select">
              <Select
                value={classifyId2}
                onChange={(e) => {
                  set_classifyId2(e);
                  const index = allClassify[7]?.children.findIndex((v) => v.id == e);
                  set_classifyId2_index(index);
                }}
                placeholder="请选择空间"
              >
                {allClassify[7]?.children.map((v) => {
                  return (
                    <Select.Option key={v.id} value={v.id}>
                      {v.name}
                    </Select.Option>
                  );
                })}
              </Select>
            </div>
          </div> */}
          {/* <div className="angle">
            <div className="space-title">视角选择：</div>
            <div className="select">
              <Select value={view} onChange={(e) => set_view(e)} placeholder="请选择视角选择">
                {allClassify[7]?.view.map((v) => {
                  return (
                    <Select.Option key={v.name} value={v.name}>
                      {v.name}
                    </Select.Option>
                  );
                })}
              </Select>
            </div>
          </div> */}
          <div className="style">
            <div className="title">
              <img src="/imgs/图片集.svg" width={18} />
              <span>{t('涂抹参考（请至少选择一种）：')}</span>
            </div>
            <div className="style-content" style={{ border: '1px solid #404040' }}>
              <div className="style-item">
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
                  <div className="style-item">
                    <div className="plus">+</div>
                    <div className="plus-label">{t('上传参考图')}</div>
                  </div>
                </Dragger>
              </div>
              <div className="style-item" style={{ backgroundColor: 'transparent' }}>
                {style_img ? <img src={`//${style_img}`} className="picture" /> : null}
                {style_img ? (
                  <div
                    className="del"
                    onClick={() => {
                      set_style_img('');
                    }}
                  >
                    <img src={'/imgs/del.png'} className="del-icon" />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="tips">
            <div className="tip-title">
              <div className="label">提示词（可不填）：</div>
              {/* <Popover
                trigger="click"
                placement="right"
                visible={open}
                content={promptContent}
                onVisibleChange={() => setOpen(!open)}
              >
                <div className="btn">
                  {`提示词库 `}&gt;<div className="btn_line"></div>
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
              <textarea
                  style={{
                    backgroundColor: '#1d1d1d',
                    border: 0,
                    borderRadius: 6,
                    padding: 12,
                    width: '100%',
                    height: 200,
                  }}
                  value={promptTxt}
                  onChange={(e) => setPromptTxt(e.target.value)}
                  placeholder={t('请输入描述，比如“蓝色沙发”，或者“彩色的灯”等...')}
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
                      <div className="queue">{`（前方${
                        Number(queue_num) > 0 ? Number(queue_num) - 1 : 0
                      }${t('人排队，预计')}${number}${t('秒完成')}）`}</div>
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
                <div className="left-wrapper">
                  <Tooltip title={t('和底图结构的相似程度，越高越相似。默认0.5')}>
                    <img src={'/imgs/wenhao.png'} className="icon" />
                  </Tooltip>
                  <div className="label">{t('与底图的相似度：')}</div>
                  <div className="slide">
                    <Slider
                      min={0.1}
                      step={0.05}
                      max={1}
                      onChange={(e) => set_cnStrength(e)}
                      value={cnStrength}
                    />
                  </div>
                </div>
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
                    onMouseLeave={() => set_show_start_tab(false)}
                    onMouseEnter={() => {
                      set_show_start_tab(true);
                    }}
                    onClick={() => {
                      if (has_start) {
                        message.info(t('渲染中，请稍等'));
                        return;
                      }
                      complete();
                      set_active_select_type(-1);
                      set_task_type(0);
                      setTimeout(() => {
                        emitter.emit(EVENT_FILE_UPLOAD_COS);
                      }, 100);
                    }}
                  >
                    {t('开始渲染')}
                    <DownOutlined className="btn2_icon" />
                    {show_start_tab ? (
                      <div className="continue_down">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (has_start) {
                              message.info(t('渲染中，请稍等'));
                              return;
                            }
                            complete();
                            set_active_select_type(-1);
                            set_task_type(1);
                            setTimeout(() => {
                              emitter.emit(EVENT_FILE_UPLOAD_COS);
                            }, 100);
                          }}
                        >
                          {t('移除涂抹区域')}
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (has_start) {
                              message.info(t('渲染中，请稍等'));
                              return;
                            }
                            complete();
                            set_active_select_type(-1);
                            set_task_type(0);
                            setTimeout(() => {
                              emitter.emit(EVENT_FILE_UPLOAD_COS);
                            }, 100);
                          }}
                        >
                          {t('渲染涂抹区域')}
                        </div>
                      </div>
                    ) : null}
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
                    '涂抹想要重新渲染的部分，选择对应的风格类型，即可重新渲染改部分，同时保留其他未选中的地方不变',
                  )}
                </div>
                <div className="content">
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E5%BB%BA%E7%AD%91%E5%B1%80%E9%83%A8%E6%B8%B2%E6%9F%93/c215234cc00b4475ebc5c2ad2aa638f8.jpeg'
                      }
                      className="picture"
                    />
                    <div className="name">{t('原图效果')}</div>
                  </div>
                  <i className="iconfont icon-down-jiantou" />
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E5%BB%BA%E7%AD%91%E5%B1%80%E9%83%A8%E6%B8%B2%E6%9F%93/eva_img%20%283%29.jpg'
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
