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
import { strPromptedit } from '../../utils'
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
const angle_list = [
  { label:'０度', value: 0 },
  { label:'９０度', value: 90 },
  { label:'１８０度', value: 180 },
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
  const [lock, set_lock] = useState(1);
  const [atmosphere, set_atmosphere] = useState('');
  const [cnStrength, set_cnStrength] = useState(0);
  const [number, setNumber] = useState(70);
  const [num_interval, set_num_interval] = useState(undefined);
  // —— 尺寸读取用 ——
  // .right-content 容器
  const rightContentRef = useRef(null);
  // .right-content .left 区域
  const leftPaneRef = useRef(null);

  // 读到的尺寸（供程序使用）
  const [rightContentHeight, setRightContentHeight] = useState(0);
  const [leftWidth, setLeftWidth] = useState(0);
  // 监听 right-content 与 left 面板尺寸变化，并保存 height/width
  useEffect(() => {
    const rc = rightContentRef.current;
    const left = leftPaneRef.current;
    if (!rc || !left) return;
    //console.log('right-content height:::: =', left.getBoundingClientRect().height);
    const update = () => {
    const rect = left.getBoundingClientRect(); // 获取left元素尺寸
    const ajustdim = rect.height > 900 ? 210 : 180; // 根据高度判断ajustdim
      // getBoundingClientRect()：含小数，包含 padding+border（不含 margin）
      setRightContentHeight(left.getBoundingClientRect().height - ajustdim);
      setLeftWidth(left.getBoundingClientRect().width);
    };

    // 初次读取（等一帧保证布局完成）
    let rafId = requestAnimationFrame(update);

    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    // 优先用 ResizeObserver，兼容则退回 window.resize
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(handleResize);
      ro.observe(left);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // 清理
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []); // 只需挂载时建立监听

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
    
    //console.log('check_history_data img::::', check_history_data, img);
    if (img) {
      set_upload_img(img);
      return;
    }
    if (check_history_data?.promptId) {
      set_upload_img(check_history_data.image);
    //   atmosphere_list.forEach((v) => {
    //     check_history_data.text = check_history_data.text.replaceAll(v.value, '');
    //   });
      setPromptTxt(check_history_data.text);
      set_lock(check_history_data.lock ?? 1);
      set_cnStrength(check_history_data.cnStrength);
      if (check_history_data.ipadapterImgage) {

        set_style_img(check_history_data.ipadapterImgage.replace('https://', ''));
        //set_style_img(check_history_data.ipadapterImgage);
      }
      if (check_history_data.mask) {
        maskData.current = 'https://' + check_history_data.mask;
      }
    }
  }, [allClassify, check_history_data, img]);

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
      setNumber((res.data.queueNum + 1) * 70);
      set_num_interval(undefined);
      setInterval(undefined);
      set_has_start(false);
      return;
    }
    if (res.data.status == 2) {
      message.error('流程失败，请联系客服');
      setInterval(undefined);
      setNumber((res.data.queueNum + 1) * 70);
      set_num_interval(undefined);
      return;
    }
    // if (res.data && res.error.errorCode == 0) {
    //   set_queue_num(res.data.number);
    //   return;
    // }
    //console.log('res', res);
  }, interval);

  const clear2 = useInterval(async () => {
    if (number > 0) {
      setNumber(number - 1);
    }
  }, num_interval);

//   const onChange = (newValue) => {
//     set_cnStrength(newValue);
//   };

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

  // const customRequest = (option, type) => {
  //   //console.log(option);
  //   const key = `${new Date().getTime()}_${option.file.size}_.${option.file.name.split('.').pop()}`;
  //   message.loading({
  //     type: 'loading',
  //     content: t('图片上传中...'),
  //     duration: 0,
  //   });
  //   COS.uploadFile(
  //     {
  //       Bucket: 'blue-user-1304000175' /* 填入您自己的存储桶，必须字段 */,
  //       Region: 'ap-tokyo' /* 存储桶所在地域，例如ap-beijing，必须字段 */,
  //       Key: key /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */,
  //       Body: option.file /* 必须，上传文件对象，可以是input[type="file"]标签选择本地文件后得到的file对象 */,
  //       // 支持自定义headers 非必须
  //     },
  //     (err, data) => {
  //       console.log(err || data.Location);
  //       message.destroy();
  //       if (!data.Location) {
  //         message.error(t('图片上传失败'));
  //         return;
  //       }
  //       if (type == 1) {
  //         set_style_img(data?.Location);
  //         set_classifyId3(-1);
  //       } else if (type == 2) {
  //         maskData.current = '';
  //         set_upload_img(`${data?.Location}`);
  //         const reader = new FileReader();
  //         reader.onload = function (event) {
  //           set_upload_show_img(event.target.result);
  //         };
  //         // 读取文件内容并将其转换为数据 URL
  //         reader.readAsDataURL(option.file);
  //       }
  //     },
  //   );
  // };
  const customRequest = (option, type) => {
      //console.log(option);
      // console.log('right-content height =', rightContentHeight, 'left width =', leftWidth);
      
      // 分离处理：类型1为风格参考图，保持原有逻辑不变
      if (type === 1) {
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
          },
          (err, data) => {
            message.destroy();
            if (!data?.Location) {
              message.error(t('图片上传失败'));
              return;
            }
            set_style_img(data?.Location);
            set_classifyId3(-1);
          },
        );
        return; // 结束执行
      }

      // 分离处理：类型2为渲染底图，增加预处理逻辑
      if (type === 2) {
        const originalFile = option.file;
        const img = new Image();
        img.src = URL.createObjectURL(originalFile);

        img.onload = () => {
          URL.revokeObjectURL(img.src); // 释放内存

          const w = img.naturalWidth;
          const h = img.naturalHeight;
          const longEdge = Math.max(w, h);

          // 定义一个统一的上传函数，接收一个File对象
          const doUpload = (fileToUpload) => {
            const key = `${new Date().getTime()}_${fileToUpload.size}_.${fileToUpload.name.split('.').pop()}`;
            message.loading({
              type: 'loading',
              content: t('图片上传中...'),
              duration: 0,
            });

            COS.uploadFile(
              {
                Bucket: 'blue-user-1304000175',
                Region: 'ap-tokyo',
                Key: key,
                Body: fileToUpload,
              },
              (err, data) => {
                message.destroy();
                if (!data?.Location) {
                  message.error(t('图片上传失败'));
                  return;
                }
                // 更新底图相关的状态
                maskData.current = '';
                set_upload_img(`${data?.Location}`);
                const reader = new FileReader();
                reader.onload = function (event) {
                  set_upload_show_img(event.target.result);
                };
                reader.readAsDataURL(fileToUpload);
              },
            );
          };

          // 判断是否需要放大
          if (longEdge > 0 && longEdge < 1088) {
            // 计算放大后的新尺寸
            const scale = 1344 / longEdge;
            const newW = Math.round(w * scale);
            const newH = Math.round(h * scale);

            const canvas = document.createElement('canvas');
            canvas.width = newW;
            canvas.height = newH;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              // 设置高质量的图片缩放
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, newW, newH);

              // 将Canvas内容转为File对象
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    const upscaledFile = new File([blob], originalFile.name, {
                      type: originalFile.type,
                      lastModified: Date.now(),
                    });
                    doUpload(upscaledFile); // 上传放大后的文件
                  } else {
                    message.error(t('图片优化失败，将上传原图'));
                    doUpload(originalFile); // 如果转换失败，上传原图
                  }
                },
                originalFile.type,
                1,
              );
            } else {
              message.error(t('无法进行图片优化，将上传原图'));
              doUpload(originalFile); // 如果Canvas上下文不存在，上传原图
            }
          } else {
            // 如果图片尺寸达标，直接上传原图
            doUpload(originalFile);
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(img.src);
          message.error(t('图片文件加载失败，请重新选择'));
        };
      }
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
      if (!tickets || tickets <= 3) {
        message.info(t('有償ユーザーのみ使用できます'));
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
      if (!style_img) {
        message.info('什器・素材等の画像をアップロードしてください');
        return;
      }

      if (!maskData.current) {
        message.info('ベース画像上に置き換え場所を指定してください');
        return;
      }

      set_has_start(true);
      const params = {
        lock: lock,
        cnStrength: cnStrength,
        image: baseImgRef.current.includes('http')
          ? baseImgRef.current
          : `https://${baseImgRef.current}`,
        maskUrl: maskRef.current.includes('http') ? maskRef.current : `https://${maskRef.current}`,
        classifyId1: allClassify[23]?.id,
        classifyWord1: allClassify[23]?.name,
        text: [strPromptedit(promptTxt), atmosphere].filter((v) => Boolean(v.length)).join(','),
      };
      if (localStorage.getItem('gpuId')) {
        params.gpuId = localStorage.getItem('gpuId');
      }
      if (maskData.current) {
        params.mask = maskData.current;
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
        setNumber((res.data.queueNum + 1) * 70);
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
      //console.log('res', res);
    },
    {
      wait: 500,
    },
  );

  return (
    <>
      <Header />
      <div className="objectChangepro">
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
            <span>{t('什器・素材等の置き換え')}</span>
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
                    //console.log('file', file);
                    if (!isImg) {
                      message.error(t(`什器・素材等の画像をアップロードしてください`));
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
                    <div className="plus-label">{t('什器・素材等の画像をアップロードしてください')}</div>
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
                  <div className="label">{t('什器・素材等の画像')}</div>
                </div>
              )}
            </div>
          </div>
          <div className="angle">
            <div className="label" >{t('素材画像回転：')}</div>
            <div className="select">
              <Select
                  defaultValue={0}
                  value={cnStrength}
                  onChange={(e) => set_cnStrength(e)}
                  options={[
                    {  
                      value: 0,
                      label: t('０度'),
                    },
                    {  
                      value: 90,
                      label: t('９０度'),
                    },
                    {  
                      value: 180,
                      label: t('１８０度'),
                    },
                  ]}
              />
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
                <textarea
                  style={{
                    backgroundColor: '#1d1d1d',
                    border: 0,
                    borderRadius: 6,
                    padding: 12,
                    width: '100%',
                    height: 235,
                  }}
                  value={promptTxt}
                  onChange={(e) => setPromptTxt(e.target.value)}
                  placeholder={t('请输入您需要的物件，以逗号隔开...')}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="draw-right">
          <div className="right-content" ref={rightContentRef}>
            <div className="left" ref={leftPaneRef}>
              {upload_show_img || upload_img ? (
                <div className="pic-container">
                  <ImgEditor
                    ref={imgEditorRef}
                    initMask={maskData.current}
                    upload_show_img={upload_show_img}
                    upload_img={upload_img}
                    rightContentHeight={rightContentHeight}
                    leftWidth={leftWidth}
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
                      // console.log('file:::', file);
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
                  <Tooltip title={t('学習強度が高くなるほど、AIによる画像生成の自由度は相対的に制限されます。デフォルト値：高')}>
                    <img src={'/imgs/wenhao.png'} className="icon" style={{ marginLeft: 20 }} />
                  </Tooltip>
                  <div className="label">{t('学習強度：')}</div>
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
                          value: 1,
                          label: t('高'),
                        },
                        {
                          value: 3,
                          label: t('中'),
                        },
                        {
                          value: 5,
                          label: t('低'),
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
                      //console.log('file', file);
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
                  {t('ご指定の空間内の箇所に対し、参考画像から取得した什器を、AI技術により最適な形で配置・置換いたします。')}
                </div>
                <div className="content">
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%e7%9b%b8%e5%85%b3%2feva_imgs%2fweb%2fai%e8%af%a6%e6%83%85%e9%a1%b5%e5%8f%b3%e4%be%a7%2f%e9%80%9a%e7%94%a8AI%2fobjectchange%2fobjectbase.png'
                      }
                      className="picture"
                    />
                    <div className="name">{t('什器置き換え前画像')}</div>
                  </div>
                  <i className="iconfont icon-down-jiantou" />
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%e7%9b%b8%e5%85%b3%2feva_imgs%2fweb%2fai%e8%af%a6%e6%83%85%e9%a1%b5%e5%8f%b3%e4%be%a7%2f%e9%80%9a%e7%94%a8AI%2fobjectchange%2fobjectai.png'
                      }
                      className="picture"
                    />
                    <div className="name">{t('AIで什器を置き換えた画像')}</div>
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
