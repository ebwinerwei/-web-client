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
import Header from '@/components/Header';
import { ArrowLeftOutlined, QuestionCircleOutlined, DownOutlined } from '@ant-design/icons';
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
  const [show_start_tab, set_show_start_tab] = useState(false);
  const [open, setOpen] = useState(false);
  const [cnStrength, set_cnStrength] = useState(1);
  const [ipaPlus, set_ipaPlus] = useState(false);
  const [promptTxt, setPromptTxt] = useState('');
  const [style_img, set_style_img] = useState('');
  const [upload_img, set_upload_img] = useState('');
  const [upload_show_img, set_upload_show_img] = useState('');
  const [task_id, set_task_id] = useState('');
  const [queue_num, set_queue_num] = useState(0);
  const [interval, setInterval] = useState(undefined);
  const [has_start, set_has_start] = useState(false);

  const [classifyId3, set_classifyId3] = useState('');
  const [classifyId2, set_classifyId2] = useState('');
  const [classifyId2_index, set_classifyId2_index] = useState(0);
  const [ignoreWordAndImage, set_ignoreWordAndImage] = useState(false);

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
    set_classifyId2(allClassify[5]?.children?.[0]?.id);
    set_classifyId3(allClassify[5]?.children?.[0]?.children?.[0]?.id);
  }, [allClassify]);

  const clear = useInterval(async () => {
    const res = await getTaskByTaskId({ taskId: task_id });
    if (res.data?.resultImg && res.data?.status == 1 && res.error.errorCode == 0) {
      // 运行完成
      const img_arr = res.data?.resultImg.split(';');
      set_start_img(`${upload_img}`);
      set_function_page(5);
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
        if (type == 1) {
          set_style_img(data?.Location);
          set_classifyId3(-1);
        } else if (type == 2) {
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

  const { run: start_task } = useDebounceFn(
    async (num) => {
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
      set_has_start(true);
      const params = {
        num,
        image: upload_img.includes('http') ? upload_img : `https://${upload_img}`,
        text: promptTxt,
        classifyId1: allClassify[5]?.id,
        classifyWord1: allClassify[5]?.name,
        classifyId2: classifyId2,
        classifyWord2: allClassify[5]?.children[classifyId2_index]?.name,
        cnStrength,
        ignoreWordAndImage: ignoreWordAndImage,
      };
      if (classifyId3 == -1 && style_img) {
        params.ipadapterImgage = `https://${style_img}`;
      } else {
        params.classifyId3 = classifyId3;
        const classify2List = allClassify[5]?.children[classifyId2_index].children;
        const item = classify2List.find((v) => classifyId3 == v.id);
        params.classifyWord3 = item?.name;
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

  console.log('tickets', userInfo);
  return (
    <>
      <Header />
      <div className="indoorTransfer">
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
            <span>{t('家装风格迁移')}</span>
          </div>
          <div className="space">
            <div className="space-title">{t('空间：')}</div>
            <div className="select">
              <Select
                value={classifyId2}
                onChange={(e) => {
                  set_classifyId2(e);
                  const index = allClassify[5]?.children.findIndex((v) => v.id == e);
                  set_classifyId2_index(index);
                }}
                placeholder={t('请选择空间')}
              >
                {allClassify[5]?.children.map((v) => {
                  return (
                    <Select.Option key={v.id} value={v.id}>
                      {v.name}
                    </Select.Option>
                  );
                })}
              </Select>
            </div>
          </div>
          <div className="style">
            <div className="title">{t('出图风格：')}</div>
            <div className="style-content">
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
                      <div className="plus-label">{t('上传风格参考图')}</div>
                    </div>
                  </Upload>
                ) : (
                  <div className="style-item" onClick={() => set_classifyId3(-1)}>
                    <div className="item-wrapper">
                      <img src={`//${style_img}`} className="picture" />
                      {classifyId3 == -1 ? (
                        <div className="item-wrapper-active">
                          <i className="iconfont icon-tick" />
                        </div>
                      ) : null}
                      <div className="del" onClick={() => set_style_img('')}>
                        <img src={'/imgs/del.png'} className="del-icon" />
                      </div>
                    </div>
                    <div className="label">{t('我的参考图')}</div>
                  </div>
                )}
              </div>
              {allClassify[5]?.children?.[classifyId2_index]?.children?.map((v, i) => {
                return (
                  <div
                    key={i}
                    className="style-item"
                    onClick={() => {
                      set_classifyId3(v.id);
                    }}
                  >
                    <div className="item-wrapper">
                      <img src={v.cover} className="picture" />
                      {classifyId3 == v.id ? (
                        <div className="item-wrapper-active">
                          <i className="iconfont icon-tick" />
                        </div>
                      ) : null}
                    </div>
                    <div className="label">{v.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* <div className="angle">
            <div className="space-title">氛围选择：</div>
            <div className="select">
              <Select
                placeholder="请选择氛围"
                options={[
                  {
                    value: '1',
                    label: '请选择氛围',
                  },
                ]}
              />
            </div>
          </div> */}
        </div>
        <div className="draw-right">
          <div className="right-content">
            <div className="left">
              {upload_show_img || upload_img ? (
                <div className="pic-container">
                  <img
                    src={
                      upload_show_img
                        ? upload_show_img
                        : upload_img.includes('http')
                        ? upload_img
                        : `https://${upload_img}`
                    }
                    className="upload-draw"
                  />
                  <img
                    src="/imgs/icon_sc.png"
                    className="del_icon"
                    onClick={() => {
                      set_upload_img('');
                      set_upload_show_img('');
                    }}
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
                        start_task(1);
                      } else {
                        message.info(t('请上传图片'));
                      }
                    }}
                  >
                    {t('开始渲染')}
                    {show_start_tab ? (
                      <div className="continue_down">
                        <div onClick={() => start_task(1)}>{t('生成1张')}</div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (userInfo?.type != 1 && userInfo?.type != 2) {
                              setShowRechargeModal(true);
                              return;
                            }
                            start_task(2);
                          }}
                        >
                          {t('生成2张')}
                          <img src="/imgs/iconvip.png" />
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (userInfo?.type != 1 && userInfo?.type != 2) {
                              setShowRechargeModal(true);
                              return;
                            }
                            start_task(3);
                          }}
                        >
                          {t('生成3张')}
                          <img src="/imgs/iconvip.png" />
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
                <div className="title2">{t('保留室内结构设计不变，变换各种风格')}</div>
                <div className="content">
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/ai%E8%AF%A6%E6%83%85%E9%A1%B5%E5%8F%B3%E4%BE%A7/%E5%AE%A4%E5%86%85AI/%E9%A3%8E%E6%A0%BC%E8%BF%81%E7%A7%BB/1.png'
                      }
                      className="picture"
                    />
                    <div className="name">{t('原图效果')}</div>
                  </div>
                  <i className="iconfont icon-down-jiantou" />
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/ai%E8%AF%A6%E6%83%85%E9%A1%B5%E5%8F%B3%E4%BE%A7/%E5%AE%A4%E5%86%85AI/%E9%A3%8E%E6%A0%BC%E8%BF%81%E7%A7%BB/2.png'
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
