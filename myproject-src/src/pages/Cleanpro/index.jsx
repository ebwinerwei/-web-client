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
  const [number, setNumber] = useState(55);
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
      setNumber((res.data.queueNum + 1) * 55);
      set_num_interval(undefined);
      setInterval(undefined);
      set_has_start(false);
      return;
    }
    if (res.data.status == 2) {
      message.error('流程失败，请联系客服');
      setInterval(undefined);
      setNumber((res.data.queueNum + 1) * 55);
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

  // const customRequest = (option) => {
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
  //       set_upload_img(`${data?.Location}`);
  //       const reader = new FileReader();
  //       reader.onload = function (event) {
  //         set_upload_show_img(event.target.result);
  //       };
  //       // 读取文件内容并将其转换为数据 URL
  //       reader.readAsDataURL(option.file);
  //     },
  //   );
  // };
  const customRequest = (option) => {
    const originalFile = option.file;

    // 创建Image对象以读取图片尺寸
    const img = new Image();
    img.src = URL.createObjectURL(originalFile);

    img.onload = () => {
      URL.revokeObjectURL(img.src); // 释放内存

      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const longEdge = Math.max(w, h);

      // 将原有的上传逻辑封装成一个独立的函数，以便复用
      const doUpload = (fileToUpload) => {
        // 生成唯一的对象键
        const key = `${new Date().getTime()}_${fileToUpload.size}_.${fileToUpload.name.split('.').pop()}`;

        // 显示上传中的提示
        message.loading({
          type: 'loading',
          content: t('图片上传中...'),
          duration: 0,
        });

        // 调用COS SDK执行上传
        COS.uploadFile(
          {
            Bucket: 'blue-user-1304000175',
            Region: 'ap-tokyo',
            Key: key,
            Body: fileToUpload, // 使用待上传的文件（可能是原图或放大后的图）
          },
          (err, data) => {
            console.log(err || data.Location);
            message.destroy();

            // 处理上传失败的情况
            if (!data.Location) {
              message.error(t('图片上传失败'));
              return;
            }

            // 上传成功后，更新UI状态
            set_upload_img(`${data?.Location}`);
            const reader = new FileReader();
            reader.onload = function (event) {
              set_upload_show_img(event.target.result);
            };
            // 读取文件内容以供本地预览
            reader.readAsDataURL(fileToUpload);
          },
        );
      };

      // 判断是否需要执行放大逻辑
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
          // 为了更好的图片质量
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, newW, newH);

          // 将Canvas内容转换为File对象
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const upscaledFile = new File([blob], originalFile.name, {
                  type: originalFile.type,
                  lastModified: Date.now(),
                });
                doUpload(upscaledFile); // 上传放大后的文件
              } else {
                // 备用逻辑：如果转换失败，则上传原图
                message.error(t('图片优化失败，将上传原图'));
                doUpload(originalFile);
              }
            },
            originalFile.type,
            1,
          );
        } else {
          // 备用逻辑：如果无法获取Canvas上下文，则上传原图
          message.error(t('无法进行图片优化，将上传原图'));
          doUpload(originalFile);
        }
      } else {
        // 如果图片尺寸足够大，直接上传原图
        doUpload(originalFile);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      message.error(t('图片文件加载失败，请重新选择'));
    };
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
      if (!tickets || tickets <= 3) {
        message.info(t('有償ユーザーのみ使用できます'));
        setShowRechargeModal(true);
        return;
      }
      if (!maskData.current) {
        message.info('削除対象を囲んで選択してください');
        return;
      }      
      set_fetch_data(upload_img.includes('http') ? upload_img : `https://${upload_img}`);
      set_has_start(true);
      const params = {
        image: baseImgRef.current.includes('http')
          ? baseImgRef.current
          : `https://${baseImgRef.current}`,
        maskUrl: maskRef.current.includes('http') ? maskRef.current : `https://${maskRef.current}`,
        classifyId1: allClassify[26]?.id,
        classifyWord1: allClassify[26]?.name,
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
        setNumber((res.data.queueNum + 1) * 55);
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
      <div className="cleanpro_wrap">
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
            <span>{t('オブジェクト削除Pro')}</span>
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
                <div className="title2">{t('消したい物を囲むだけ。AIが瞬時に、自然に消去！大きな物体でもサクッと削除！')}</div>
                <div className="content">
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%e7%9b%b8%e5%85%b3%2feva_imgs%2fweb%2fai%e8%af%a6%e6%83%85%e9%a1%b5%e5%8f%b3%e4%be%a7%2f%e9%80%9a%e7%94%a8AI%2fobjectremovepro%2forgdel.gif'
                      }
                      className="picture"
                    />
                    <div className="name">{t('原图效果')}</div>
                  </div>
                  <i className="iconfont icon-down-jiantou" />
                  <div className="pic-item">
                    <img
                      src={
                        'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%e7%9b%b8%e5%85%b3%2feva_imgs%2fweb%2fai%e8%af%a6%e6%83%85%e9%a1%b5%e5%8f%b3%e4%be%a7%2f%e9%80%9a%e7%94%a8AI%2fobjectremovepro%2faidel.png'
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
