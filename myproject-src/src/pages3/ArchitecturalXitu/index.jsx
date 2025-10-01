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
import COS from '@/components/Cos';
import ImgEditor from '@/components/ImgEditor';
import { arch_prompt } from '@/config/prompts';
import { useModel, history, useLocation } from '@umijs/max';
import { useInterval, useDebounceFn } from 'ahooks';
import { startTask, getTaskByTaskId } from '@/services/ant-design-pro/api';
import dayjs from 'dayjs';
import { t } from '@/utils/lang';
import './index.scss';
import { ActionRightTickets, ActionRightTickets_Small } from '@/components/ActionRightTickets';

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Dragger } = Upload;

const atmosphere_list = [
  { label: t('不限定'), value: '' },
  { label: t('晴朗'), value: 'sunny' },
  { label: t('下雨'), value: '(Rain scenery: 1.4), reflection, rainny,rain, humidity' },
  { label: t('雾气'), value: '(mist,fog: 1.4)' },
  { label: t('下雪'), value: '(Snow scenery: 1.4)' },
  { label: t('黄昏'), value: '(Dusk, golden hour: 1.4)' },
  {
    label: t('灯光'),
    value: '(in the night, Astral: 1.4)',
  },
];

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
    view,
    set_view,
    ignoreWordAndImage,
    set_ignoreWordAndImage,
  } = useModel('landscapeRenderModel');
  const [lock, set_lock] = useState(0.3);
  const [atmosphere, set_atmosphere] = useState('');
  const [number, setNumber] = useState(35);
  const [num_interval, set_num_interval] = useState(undefined);

  useEffect(() => {
    get_tickets();
    if (!userInfo?.userId) {
      message.info(t('请先登录'));
      location.href = '/list';
      return;
    }

    if (img) {
      set_upload_img(img);
    }
  }, []);

  useEffect(() => {
    console.log('check_history_data', check_history_data);
    if (img) {
      set_upload_img(img);
      return;
    }
    if (check_history_data?.promptId) {
      set_upload_img(check_history_data.image);
      atmosphere_list.forEach((v) => {
        check_history_data.text = check_history_data.text.replaceAll(v.value, '');
      });
      setPromptTxt(check_history_data.text);
      set_lock(check_history_data.lock ?? 0.3);
      if (check_history_data.ipadapterImage) {
        set_style_img(check_history_data.ipadapterImage.replace('https://', ''));
      }
      if (check_history_data.mask) {
        maskData.current = 'https://' + check_history_data.mask;
      }
    }
  }, [allClassify]);

  const clear = useInterval(async () => {
    const res = await getTaskByTaskId({ taskId: task_id });
    if (res.data?.resultImg && res.data?.status == 1 && res.error.errorCode == 0) {
      // 运行完成
      const img_arr = res.data?.resultImg.split(';');
      set_function_page(1);
      set_upload_img('');
      set_upload_show_img('');
      set_start_img(`${upload_img}`);
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

  const onChange = (newValue) => {
    set_cnStrength(newValue);
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

  const customRequest = (option, type) => {
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
        if (type == 1) {
          set_style_img(data?.Location);
          set_classifyId3(-1);
        } else if (type == 2) {
          maskData.current = '';
          set_upload_img(`${data?.Location}`);
          const reader = new FileReader();
          reader.onload = function (event) {
            set_upload_show_img(event.target.result);
          };
          // 读取文件内容并将其转换为数据 URL
          reader.readAsDataURL(option.file);
        }
      },
    );
  };

  useEffect(() => {
    localStorage.removeItem('gpuId');
  }, []);

  const { run: start_task } = useDebounceFn(
    async () => {
      if (!userInfo?.userId) {
        message.info(t('请先登录'));
        return;
      }
      if (!tickets || tickets == 0) {
        message.info(t('今日次数已用完'));
        setShowRechargeModal(true);
        return;
      }
      if (has_start) {
        message.info(t('正在渲染中'));
        return;
      }
      if (!upload_img) {
        message.info(t('请上传图片'));
        return;
      }
      // if (!style_img) {
      //   message.info('请上传氛围参考图');
      //   return;
      // }
      set_has_start(true);
      const params = {
        lock,
        image: baseImgRef.current.includes('http')
          ? baseImgRef.current
          : `https://${baseImgRef.current}`,
        maskUrl: maskRef.current.includes('http') ? maskRef.current : `https://${maskRef.current}`,
        classifyId1: allClassify[21]?.id,
        classifyWord1: allClassify[21]?.name,
        text: [promptTxt, atmosphere].filter((v) => Boolean(v.length)).join(','),
      };
      if (localStorage.getItem('gpuId')) {
        params.gpuId = localStorage.getItem('gpuId');
      }
      if (maskData.current) {
        params.mask = maskData.current;
      }
      if (style_img) {
        params.ipadapterImage = `https://${style_img}`;
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

  console.log('tickets', allClassify);
  return (
    <>
      <Header />
      <div className="architecturalXitu">
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
            <span>{t('效果图洗图')}</span>
          </div>
          <div className="style">
            <div className="style-item">
              {!style_img ? (
                <Upload
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
                >
                  <div className="item-wrapper">
                    <div className="plus">+</div>
                    <div className="plus-label">{t('上传氛围参考图')}</div>
                  </div>
                </Upload>
              ) : (
                <div className="style-item" onClick={() => set_classifyId3(-1)}>
                  <div className="item-wrapper">
                    <img src={`//${style_img}`} className="picture" />
                    <div className="del" onClick={() => set_style_img('')}>
                      <img src={'/imgs/del.png'} className="del-icon" />
                    </div>
                  </div>
                  <div className="label">{t('我的参考图')}</div>
                </div>
              )}
            </div>
          </div>
          <div className="angle">
            <div className="space-title">{t('氛围：')}</div>
            <div className="select">
              <Select
                value={atmosphere}
                onChange={(e) => set_atmosphere(e)}
                placeholder={t('请选择氛围')}
              >
                {atmosphere_list.map((v) => {
                  return (
                    <Select.Option key={v.label} value={v.value}>
                      {v.label}
                    </Select.Option>
                  );
                })}
              </Select>
            </div>
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
                  {t(`提示词库 `)}&gt;<div className="btn_line"></div>
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
                value={ignoreWordAndImage}
                onChange={(e) => set_ignoreWordAndImage(e)}
                options={[
                  // {
                  //   value: false,
                  //   label: '兼顾提示词和风格',
                  // },
                  {
                    value: false,
                    label: '风格为主',
                  },
                  {
                    value: true,
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
                        {t('每次渲染结果都是随机的哦')}
                      </div>
                      <div className="draw-tip">
                        {t('若渲染不满意，可多试几次')}
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
                    customRequest={(option) => customRequest(option, 2)}
                  >
                    <div className="pic-container-inner">
                      <img src={'/imgs/icon_tpsc.png'} className="icon-draw" />
                      <div className="label">{t('拖拽底图到这里，或者点击上传')}</div>
                    </div>
                  </Dragger>
                </div>
              )}

              <div className="bottom-draw">
                <div className="left-wrapper">
                  <Tooltip title={t('氛围参考图的权重，越高则越倾向参考图，默认低')}>
                    <img src={'/imgs/wenhao.png'} className="icon" style={{ marginLeft: 20 }} />
                  </Tooltip>
                  <div className="label">{t('洗图权重：')}</div>
                  <div className="select">
                    <Select
                      defaultValue={1}
                      style={{
                        width: 120,
                      }}
                      value={lock}
                      onChange={(e) => set_lock(e)}
                      options={[
                        {
                          value: 0.3,
                          label: t('低'),
                        },
                        {
                          value: 0.5,
                          label: t('中'),
                        },
                        {
                          value: 0.8,
                          label: t('高'),
                        },
                      ]}
                    />
                  </div>
                </div>
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
                    customRequest={(option) => customRequest(option, 2)}
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
                        message.info(t('正在渲染中'));
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
                  {t('在不改变结构和造型的基础上，使得底图具有参考图的氛围和材质')}
                </div>
                <div className="content">
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E6%95%88%E6%9E%9C%E5%9B%BE%E6%B4%97%E5%9B%BE/1.png?imageMogr2/quality/90/format/jpg/interlace/1/thumbnail/512x'
                      }
                      className="picture"
                    />
                    <div className="name">{t('原图效果')}</div>
                  </div>
                  <i className="iconfont icon-down-jiantou" />
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E6%95%88%E6%9E%9C%E5%9B%BE%E6%B4%97%E5%9B%BE/2.png?imageMogr2/quality/90/format/jpg/interlace/1/thumbnail/512x'
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
