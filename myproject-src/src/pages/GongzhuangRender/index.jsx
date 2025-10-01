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
import { strPromptedit } from '../../utils'
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
  } = useModel('gongzhuangRenderModel');
  const [number, setNumber] = useState(35);
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
    console.log('check_history_data', check_history_data);
    if (img) {
      set_upload_img(img);
      return;
    }
    if (check_history_data?.promptId) {
      set_upload_img(check_history_data.image);
      setPromptTxt(check_history_data.text);
      set_lock(check_history_data.lock ?? 1);
      set_cnStrength(check_history_data.cnStrength);
      set_classifyId2(check_history_data.classifyId2 ?? allClassify[4]?.children?.[0]?.id);
      const index = allClassify[4]?.children.findIndex(
        (v) => v.id == check_history_data.classifyId2,
      );
      set_classifyId2_index(index);
      if (check_history_data.ipadapterImgage) {
        set_classifyId3(-1);
        set_style_img(check_history_data.ipadapterImgage.replace('https://', ''));
      } else {
        set_classifyId3(check_history_data.classifyId3);
      }
      if (check_history_data.mask) {
        maskData.current = 'https://' + check_history_data.mask;
      }
    } else {
      if (!classifyId2) {
        set_classifyId2(allClassify[4]?.children?.[0]?.id);
      }
      if (!classifyId3) {
        set_classifyId3(allClassify[4]?.children?.[0]?.children?.[0]?.id);
      }
    }
  }, [allClassify, check_history_data]);

  const clear = useInterval(async () => {
    const res = await getTaskByTaskId({ taskId: task_id });
    if (res.data?.resultImg && res.data?.status == 1 && res.error.errorCode == 0) {
      // 运行完成
      const img_arr = res.data?.resultImg.split(';');
      set_start_img(`${upload_img}`);
      set_function_page(4);
      set_upload_img('');
      set_upload_show_img('');
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

  // const customRequest = (option, type) => {
  //   console.log(option);
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
    async (num) => {
      if (has_start) {
        message.info(t('正在渲染中'));
        return;
      }
      if (!upload_img) {
        message.info(t('请上传图片'));
        return;
      }
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
        num,
        lock,
        image: baseImgRef.current.includes('http')
          ? baseImgRef.current
          : `https://${baseImgRef.current}`,
        maskUrl: maskRef.current.includes('http') ? maskRef.current : `https://${maskRef.current}`,
        text: strPromptedit(promptTxt),
        classifyId1: allClassify[4]?.id,
        classifyWord1: allClassify[4]?.name,
        classifyId2: classifyId2,
        classifyWord2: allClassify[4]?.children[classifyId2_index]?.name,
        cnStrength,
        ignoreWordAndImage: ignoreWordAndImage,
        ipAdapter: null,
      };
      if (localStorage.getItem('gpuId')) {
        params.gpuId = localStorage.getItem('gpuId');
      }
      if (maskData.current) {
        params.mask = maskData.current;
      }
      if (classifyId3 == -1 && style_img) {
        params.ipadapterImgage = `https://${style_img}`;
      } else {
        params.classifyId3 = classifyId3;
        const classify2List = allClassify[4]?.children[classifyId2_index].children;
        const item = classify2List.find((v) => classifyId3 == v.id);
        params.classifyWord3 = item?.name;
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
      <div className="gongzhuangRender">
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
            <span>{t('工装灵感渲染')}</span>
          </div>
          <div className="space">
            <div className="space-title">{t('空间：')}</div>
            <div className="select">
              <Select
                value={classifyId2}
                onChange={(e) => {
                  set_classifyId2(e);
                  const index = allClassify[4]?.children.findIndex((v) => v.id == e);
                  set_classifyId2_index(index);
                  set_classifyId3(allClassify[4]?.children?.[index]?.children?.[0]?.id);
                }}
                placeholder={t('请选择空间')}
              >
                {allClassify[4]?.children.map((v) => {
                  return (
                    <Select.Option key={v.id} value={v.id}>
                      {t(v.name)}
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
              {allClassify[4]?.children?.[classifyId2_index]?.children?.map((v, i) => {
                return (
                  <Popover
                    content={
                      <img
                        width={500}
                        src={
                          v.cover + '?imageMogr2/quality/90/format/jpg/interlace/1/thumbnail/512x'
                        }
                      />
                    }
                    placement="right"
                    title=""
                    key={v.cover}
                  >
                    <Tooltip title={t(v.name)}>
                      <div
                        key={v.cover}
                        className="style-item"
                        onClick={() => {
                          set_classifyId3(v.id);
                        }}
                      >
                        <div className="item-wrapper">
                          <img
                            src={
                              v.cover +
                              '?imageMogr2/quality/90/format/jpg/interlace/1/thumbnail/512x'
                            }
                            className="picture"
                          />
                          {classifyId3 == v.id ? (
                            <div className="item-wrapper-active">
                              <i className="iconfont icon-tick" />
                            </div>
                          ) : null}
                        </div>
                        <div className="label">{t(v.name)}</div>
                      </div>
                    </Tooltip>
                  </Popover>
                );
              })}
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
                  <Tooltip title={t('和底图结构的相似程度，越高越相似。默认0.5')}>
                    <img src={'/imgs/wenhao.png'} className="icon" />
                  </Tooltip>
                  <div className="label">{t('与底图的相似度：')}</div>
                  <div className="slide">
                    <Slider min={0} step={0.05} max={1} onChange={onChange} value={cnStrength} />
                  </div>
                  <Tooltip title={t('尽最大程度保持原图的材质、颜色进行渲染。默认不开启')}>
                    <img src={'/imgs/wenhao.png'} className="icon" style={{ marginLeft: 20 }} />
                  </Tooltip>
                  <div className="label">{t('材质锁定：')}</div>
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
                          label: t('不开启'),
                        },
                        {
                          value: 0.7,
                          label: t('低'),
                        },
                        {
                          value: 0.5,
                          label: t('中'),
                        },
                        {
                          value: 0.3,
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
                    {show_start_tab ? (
                      <div className="continue_down">
                        <div
                          onClick={() =>
                            imgEditorRef.current?.prepare((mask, maskDataStr, baseImg) => {
                              maskRef.current = mask;
                              maskData.current = maskDataStr;
                              baseImgRef.current = baseImg;
                              start_task(1);
                            })
                          }
                        >
                          {t('生成1张')}
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (userInfo?.type != 1 && userInfo?.type != 2) {
                              setShowRechargeModal(true);
                              return;
                            }
                            imgEditorRef.current?.prepare((mask, maskDataStr, baseImg) => {
                              maskRef.current = mask;
                              maskData.current = maskDataStr;
                              baseImgRef.current = baseImg;
                              start_task(2);
                            });
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
                            imgEditorRef.current?.prepare((mask, maskDataStr, baseImg) => {
                              maskRef.current = mask;
                              maskData.current = maskDataStr;
                              baseImgRef.current = baseImg;
                              start_task(3);
                            });
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
                <div className="title">{t('可渲染底图类型：')}</div>
                <div className="content">
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/ai%E8%AF%A6%E6%83%85%E9%A1%B5%E5%8F%B3%E4%BE%A7/%E5%AE%A4%E5%86%85AI/%E5%AE%B6%E8%A3%85%E8%AF%A6%E6%83%85%E9%A1%B5/su%E6%88%AA%E5%9B%BE.jpeg'
                      }
                      className="picture"
                    />
                    <div className="name">{t('SU截图')}</div>
                  </div>
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/ai%E8%AF%A6%E6%83%85%E9%A1%B5%E5%8F%B3%E4%BE%A7/%E5%AE%A4%E5%86%85AI/%E5%AE%B6%E8%A3%85%E8%AF%A6%E6%83%85%E9%A1%B5/%E5%AE%9E%E6%99%AF%E5%9B%BE.jpeg'
                      }
                      className="picture"
                    />
                    <div className="name">{t('实景图')}</div>
                  </div>
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/ai%E8%AF%A6%E6%83%85%E9%A1%B5%E5%8F%B3%E4%BE%A7/%E5%AE%A4%E5%86%85AI/%E5%AE%B6%E8%A3%85%E8%AF%A6%E6%83%85%E9%A1%B5/%E5%BD%A9%E7%BB%98.jpeg'
                      }
                      className="picture"
                    />
                    <div className="name">{t('彩绘')}</div>
                  </div>
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/ai%E8%AF%A6%E6%83%85%E9%A1%B5%E5%8F%B3%E4%BE%A7/%E5%AE%A4%E5%86%85AI/%E5%AE%B6%E8%A3%85%E8%AF%A6%E6%83%85%E9%A1%B5/%E6%89%8B%E7%BB%98%E7%BA%BF%E7%A8%BF.jpeg'
                      }
                      className="picture"
                    />
                    <div className="name">{t('手绘线稿')}</div>
                  </div>
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/ai%E8%AF%A6%E6%83%85%E9%A1%B5%E5%8F%B3%E4%BE%A7/%E5%AE%A4%E5%86%85AI/%E5%AE%B6%E8%A3%85%E8%AF%A6%E6%83%85%E9%A1%B5/%E7%99%BD%E6%A8%A1.jpeg'
                      }
                      className="picture"
                    />
                    <div className="name">{t('白膜')}</div>
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
