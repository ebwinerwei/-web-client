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

  useEffect(() => {
    get_live_tickets();
    if (!navigator.mediaDevices) {
      Modal.confirm({
        content: t('该浏览器不支持实时渲染，请更换最新的Chrome浏览器'),
        okText: t('下载Chrome浏览器'),
        cancelText: t('取消'),
        onOk() {
          console.log('OK');
          window.open(
            'https://dl.google.com/tag/s/appguid%3D%7B8A69D345-D564-463C-AFF1-A69D9E530F96%7D%26iid%3D%7B45D6788C-14B0-4130-F019-0BBAB6C4DF27%7D%26lang%3Dzh-CN%26browser%3D4%26usagestats%3D1%26appname%3DGoogle%2520Chrome%26needsadmin%3Dprefers%26ap%3Dx64-statsdef_1%26installdataindex%3Dempty/update2/installers/ChromeSetup.exe',
          );
        },
      });
      return;
    }
    if (localStorage.getItem('joyRun') != '1') {
      localStorage.setItem('joyRun', '1');
      setJoyRun(true);
    }
  }, []);

  useEffect(() => {
    window._ckpt = ckpt;
    window._lora = lora;
    window._weight = weight;
    window._imgSize = imgSize;
    window._text = text;
    window._contronet = contronet;
    window._autoSave = autoSave;
    window._lockSeed = lockSeed;
  }, [ckpt, lora, weight, imgSize, text, contronet, autoSave, lockSeed]);

  const clear = useInterval(async () => {
    const res = await getTaskByTaskId({ taskId: task_id });
    if (res.data?.resultImg && res.data?.status == 1 && res.error.errorCode == 0) {
      // 运行完成
      setProgress(1);
      set_has_start(false);
      setInterval(undefined);
      setResultImg(res.data?.resultImg);
      return;
    }
    if (progress < 0.9) {
      setProgress(progress + 0.31);
    }
  }, interval);

  const shareScreen = async (isCamera = false) => {
    try {
      let mediaStream;

      if (!isCamera) {
        mediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
      } else {
        if (!localStorage.getItem('_mixlab_webcamera_select')) return;
        let constraints = JSON.parse(localStorage.getItem('_mixlab_webcamera_select')) || {};
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      webcamVideo.current.removeEventListener('timeupdate', videoTimeUpdateHandler);
      webcamVideo.current.srcObject = mediaStream;
      webcamVideo.current.onloadedmetadata = () => {
        let x = 0,
          y = 0,
          width = webcamVideo.current.videoWidth,
          height = webcamVideo.current.videoHeight,
          imgWidth = webcamVideo.current.videoWidth,
          imgHeight = webcamVideo.current.videoHeight;

        let d = getSetAreaData();
        if (d && d.x >= 0 && d.imgWidth === imgWidth && d.imgHeight === imgHeight) {
          x = d.x;
          y = d.y;
          width = d.width;
          height = d.height;
          imgWidth = d.imgWidth;
          imgHeight = d.imgHeight;
          console.log('#screen_share::使用上一次选区');
        }
        updateSetAreaData(x, y, width, height, imgWidth, imgHeight);

        webcamVideo.current.play();

        createBlobFromVideo(true);

        webcamVideo.current.addEventListener('timeupdate', videoTimeUpdateHandler);

        // window._mixlab_screen_x = 0
        // window._mixlab_screen_y = 0
        // // console.log(webcamVideo)
        // window._mixlab_screen_width = webcamVideo.videoWidth
        // window._mixlab_screen_height = webcamVideo.videoHeight
      };

      mediaStream.addEventListener('inactive', handleStopSharing);

      // 停止共享的回调函数
      function handleStopSharing() {
        // console.log('用户停止了共享')
        // 执行其他操作
        if (window._mixlab_stopVideo) {
          window._mixlab_stopVideo();
          window._mixlab_stopVideo = null;
          setShareBtnTxt(t('链接软件'));
        }
        if (window._mixlab_stopLive) {
          window._mixlab_stopLive();
          window._mixlab_stopLive = null;
          setLiveBtnTxt(t('开启实时渲染'));
        }
        return;
      }

      window._mixlab_screen_webcamVideo = webcamVideo.current;

      async function videoTimeUpdateHandler() {
        if (!window._mixlab_screen_live) return;
        createBlobFromVideo();
      }
    } catch (error) {
      // alert('Error accessing screen stream: ' + error);
      setTimeout(() => {
        setShareBtnTxt(t('链接软件'));
      }, 100);
    }
    return () => {
      webcamVideo.current?.pause(); // 暂停视频播放
      webcamVideo.current?.srcObject.getTracks().forEach((track) => {
        track.stop();
      });
      webcamVideo.current.srcObject = null; // 清空视频源对象
      window._mixlab_screen_live = false;
      window._mixlab_screen_blob = null;
      // previewArea.innerHTML = '';
      // interrupt();
    };
  };

  async function createBlobFromVideo(updateImageBase64 = false) {
    const videoW = webcamVideo.current.videoWidth;
    const videoH = webcamVideo.current.videoHeight;
    const aspectRatio = videoW / videoH;

    const { x, y, width, height } = window._mixlab_share_screen;
    // console.log('x, y, width, height', x, y, width, height);

    if (!width || !height) {
      message.info(t('请选择渲染区域'));
      return;
    }

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(webcamVideo.current, x, y, width, height, 0, 0, width, height);

    const blob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 1,
    });
    // imgElement.src = await blobToBase64(blob)
    window._mixlab_screen_blob = blob;

    // console.log('########updateImageBase64 ', updateImageBase64, x, y, width, height);
    if (updateImageBase64) {
      window._mixlab_screen_imagePath = await blobToBase64(blob);
    }
  }

  async function createBlobFromVideoSync(updateImageBase64 = false) {
    return new Promise(async (resolve, reject) => {
      const videoW = webcamVideo.current.videoWidth;
      const videoH = webcamVideo.current.videoHeight;
      const aspectRatio = videoW / videoH;

      const { x, y, width, height } = window._mixlab_share_screen;
      // console.log('x, y, width, height', x, y, width, height);
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(webcamVideo.current, x, y, width, height, 0, 0, width, height);

      const blob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: 1,
      });
      // imgElement.src = await blobToBase64(blob)
      window._mixlab_screen_blob = blob;

      // console.log('########updateImageBase64 ', updateImageBase64, x, y, width, height);
      if (updateImageBase64) {
        window._mixlab_screen_imagePath = await blobToBase64(blob);
      }
      resolve(1);
    });
  }

  async function compareImages(threshold, previousImage, currentImage) {
    // 将 base64 转换为 Image 对象
    var previousImg = await createImage(previousImage);
    var currentImg = await createImage(currentImage);

    if (
      previousImg.naturalWidth != currentImg.naturalWidth ||
      previousImg.naturalHeight != currentImg.naturalHeight
    ) {
      return true; // 图片有变化
    }

    // 创建一个 canvas 元素
    var canvas1 = document.createElement('canvas');
    canvas1.width = previousImg.naturalWidth;
    canvas1.height = previousImg.naturalHeight;
    var context1 = canvas1.getContext('2d');

    // 将图片绘制到 canvas 上
    context1.drawImage(previousImg, 0, 0);

    // 获取图片的像素数据
    var previousData = context1.getImageData(
      0,
      0,
      previousImg.naturalWidth,
      previousImg.naturalHeight,
    ).data;

    var canvas2 = document.createElement('canvas');
    canvas2.width = currentImg.naturalWidth;
    canvas2.height = currentImg.naturalHeight;
    var context2 = canvas2.getContext('2d');
    context2.drawImage(currentImg, 0, 0);
    var currentData = context2.getImageData(
      0,
      0,
      currentImg.naturalWidth,
      currentImg.naturalHeight,
    ).data;

    // 遍历每个像素点，计算像素差异
    var pixelDiff = 0;
    for (var i = 0; i < previousData.length; i += 4) {
      var diffR = Math.abs(previousData[i] - currentData[i]);
      var diffG = Math.abs(previousData[i + 1] - currentData[i + 1]);
      var diffB = Math.abs(previousData[i + 2] - currentData[i + 2]);

      // 计算像素差异总和
      pixelDiff += diffR + diffG + diffB;
    }

    // 计算平均像素差异
    var averageDiff = pixelDiff / (previousData.length / 4);

    // 判断平均像素差异是否超过阈值
    // console.log(
    //   pixelDiff,
    //   averageDiff,
    //   threshold,
    //   currentImg.naturalWidth,
    //   currentImg.naturalHeight,previousData,currentData
    // )
    if (averageDiff > threshold) {
      return true; // 图片有变化
    } else {
      return false; // 图片无变化
    }
  }

  async function sleep(t = 200) {
    return new Promise((res, rej) => {
      setTimeout(() => {
        res(true);
      }, t);
    });
  }

  const startLive = async (btn) => {
    if (btn) window._mixlab_screen_live = !window._mixlab_screen_live;

    if (btn) setLiveBtnTxt(t('关闭实时渲染'));
    // console.log('#ML', 'live run', window._mixlab_screen_time)
    // if (window._mixlab_screen_time) {
    //   // console.log('#ML', 'live')
    //   return
    // }
    const { Pending, Running } = await getQueue();
    // console.log('#ML', Pending, window._mixlab_screen_blob);
    if (Pending <= 1 && window._mixlab_screen_blob && Running === 0) {
      // window._mixlab_screen_time = true

      const threshold = 1; // 阈值
      const previousImage = window._mixlab_screen_imagePath; // 上一张图片的 base64
      let currentImage = await blobToBase64(window._mixlab_screen_blob);

      let text_cn = window._text;
      if (previousImage) {
        // 现在新的图片的 base64
        const imageChanged = await compareImages(threshold, previousImage, currentImage);
        // console.log('#图片是否有变化:', imageChanged);

        if (imageChanged) {
          window._mixlab_screen_imagePath = currentImage;
          // TODO
          // document.querySelector('#queue-button').click();
          if (!window._lockSeed || !window._input_seed) {
            window._input_seed = Math.floor(Math.random() * 1000000000000);
          }
          if (window._denoise == 1) {
            window._denoise = 0.99;
          } else {
            window._denoise = 1;
          }
          const workflow = getWorkFlow({
            client_id: window.name,
            base64: currentImage,
            ckpt: window._ckpt,
            lora: window._lora,
            weight: window._weight,
            imgSize: window._imgSize,
            prompt: text_cn,
            contronet: window._contronet,
            autoSave: window._autoSave,
            input_seed: window._input_seed,
            denoise: window._denoise,
          });
          await api.queuePrompt(0, {
            output: workflow.prompt,
            workflow: workflow.extra_data.extra_pnginfo.workflow,
          });
        }
      } else {
        window._mixlab_screen_imagePath = currentImage;
        // console.log(window._mixlab_screen_imagePath)
        // TODO
        // document.querySelector('#queue-button').click();
        if (!window._lockSeed || !window._input_seed) {
          window._input_seed = Math.floor(Math.random() * 1000000000000);
        }
        if (window._denoise == 1) {
          window._denoise = 0.99;
        } else {
          window._denoise = 1;
        }
        const workflow = getWorkFlow({
          client_id: window.name,
          base64: currentImage,
          ckpt: window._ckpt,
          lora: window._lora,
          weight: window._weight,
          imgSize: window._imgSize,
          prompt: text_cn,
          contronet: window._contronet,
          autoSave: window._autoSave,
          input_seed: window._input_seed,
          denoise: window._denoise,
        });
        await api.queuePrompt(0, {
          output: workflow.prompt,
          workflow: workflow.extra_data.extra_pnginfo.workflow,
        });
      }

      // await uploadFile(file)
      // window._mixlab_screen_time = false

      await sleep(window._mixlab_screen_refresh_rate || 200);
      // console.log('#ML', window._mixlab_screen_imagePath)
    }

    if (btn) {
      startLive();
      return () => {
        // stop
        window._mixlab_screen_live = false;
        window._mixlab_screen_blob = null;
        interrupt();
      };
    } else if (window._mixlab_screen_live) {
      startLive();
    }
  };
  const { run: startSingle } = useDebounceFn(
    async () => {
      console.log('window._autoSave', window._autoSave);
      await createBlobFromVideoSync();
      window._mixlab_screen_live = true;

      // console.log('#ML', 'live run', window._mixlab_screen_time)
      // if (window._mixlab_screen_time) {
      //   // console.log('#ML', 'live')
      //   return
      // }
      // const { Pending, Running } = await getQueue();
      const Pending = 0;
      const Running = 0;
      console.log('#ML', Pending, window._mixlab_screen_blob, Running);
      if (Pending <= 1 && window._mixlab_screen_blob && Running === 0) {
        // window._mixlab_screen_time = true

        const threshold = 1; // 阈值
        const previousImage = window._mixlab_screen_imagePath; // 上一张图片的 base64
        let currentImage64 = await blobToBase64(window._mixlab_screen_blob);
        let currentImage = new File([window._mixlab_screen_blob], 'image.jpg', {
          type: 'image/jpeg',
        });

        const key = `${new Date().getTime()}_${currentImage.size}_.jpg`;
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
            Body: currentImage /* 必须，上传文件对象，可以是input[type="file"]标签选择本地文件后得到的file对象 */,
            // 支持自定义headers 非必须
          },
          async (err, data) => {
            console.log(err || data.Location);
            message.destroy();
            if (!data.Location) {
              message.error(t('图片上传失败'));
              return;
            }
            set_has_start(true);
            set_do_start(true);
            let upload_img = `https://${data.Location}`;
            let text_cn = window._text;
            if (previousImage) {
              // 现在新的图片的 base64
              window._mixlab_screen_imagePath = currentImage;
              if (!window._lockSeed || !window._input_seed) {
                window._input_seed = Math.floor(Math.random() * 1000000000000);
              }
              if (window._denoise == 1) {
                window._denoise = 0.99;
              } else {
                window._denoise = 1;
              }
              const params = {
                image: upload_img,
                ckpt: window._ckpt || '001.safetensors',
                text: text_cn,
                cnStrength: window._contronet,
                inputSeed: window._input_seed,
                classifyId1: allClassify[18]?.id,
                classifyWord1: allClassify[18]?.name,
              };
              message.loading({
                type: 'loading',
                content: t('开始设置，请稍等...'),
                duration: 0,
              });
              const res = await startTask(params);
              message.destroy();
              if (res.error.errorCode == 0 && res.data?.taskId != null) {
                set_task_id(res.data.taskId);
                get_live_tickets();
                setInterval(2000);
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
            } else {
              window._mixlab_screen_imagePath = currentImage;
              // console.log(window._mixlab_screen_imagePath)
              if (!window._lockSeed || !window._input_seed) {
                window._input_seed = Math.floor(Math.random() * 1000000000000);
              }
              if (window._denoise == 1) {
                window._denoise = 0.99;
              } else {
                window._denoise = 1;
              }
              const params = {
                image: upload_img,
                ckpt: window._ckpt || '001.safetensors',
                text: text_cn,
                cnStrength: window._contronet,
                inputSeed: window._input_seed,
                classifyId1: allClassify[18]?.id,
                classifyWord1: allClassify[18]?.name,
              };
              message.loading({
                type: 'loading',
                content: t('开始设置，请稍等...'),
                duration: 0,
              });
              const res = await startTask(params);
              message.destroy();
              if (res.error.errorCode == 0 && res.data?.taskId != null) {
                set_task_id(res.data.taskId);
                get_live_tickets();
                setInterval(2000);
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
            }
          },
        );

        // await uploadFile(file)
        // window._mixlab_screen_time = false
      }
    },
    {
      wait: 500,
    },
  );

  function updateSetAreaDisplay() {
    try {
      let canvas = document.createElement('canvas');
      canvas.width = window._mixlab_screen_webcamVideo.videoWidth;
      canvas.height = window._mixlab_screen_webcamVideo.videoHeight;
      let ctx = canvas.getContext('2d');
      const lineWidth = 2; // Width of the stroke line
      const strokeColor = 'red'; // Color of the stroke

      // Draw the rectangle
      ctx.strokeStyle = strokeColor; // Set the stroke color
      ctx.lineWidth = lineWidth; // Set the stroke line width

      ctx.fillStyle = 'rgba(255,0,0,0.35)';

      let x = 0,
        y = 0,
        width = canvas.width,
        height = canvas.height;

      if (!window._mixlab_share_screen) {
        let d = getSetAreaData();
        if (d) {
          window._mixlab_share_screen = d;
        }
      }

      if (window._mixlab_share_screen) {
        x = window._mixlab_share_screen.x;
        y = window._mixlab_share_screen.y;
        width = window._mixlab_share_screen.width;
        height = window._mixlab_share_screen.height;
      }

      ctx.strokeRect(x, y, width, height); // Draw the stroked rectangle
      ctx.fillRect(x, y, width, height);

      canvas.style.width = '100%';

      webcamVideo.current.innerHTML = '';
      if (previewArea.current.firstChild) {
        previewArea.current.removeChild(previewArea.current.firstChild);
      }
      previewArea.current.appendChild(canvas);
      previewArea.current.style = `
        position: absolute;
        width:100%;
        left:0;
        top:0;
        z-index: 9
      `;
    } catch (error) {
      console.log(error);
    }
  }

  function updateSetAreaData(left, top, width, height, imgWidth, imgHeight) {
    window._mixlab_share_screen = {
      x: left,
      y: top,
      width,
      height,
      imgWidth,
      imgHeight,
    };
    localStorage.setItem('_mixlab_share_screen', JSON.stringify(window._mixlab_share_screen));
  }

  function getSetAreaData() {
    try {
      let data = JSON.parse(localStorage.getItem('_mixlab_share_screen')) || {};
      if (data.width === 0 || data.height === 0 || data.width === undefined) return;
      return data;
    } catch (error) {}
    return;
  }

  function createImage(url) {
    let im = new Image();
    return new Promise((res, rej) => {
      im.onload = () => res(im);
      im.src = url;
    });
  }

  async function setArea(src) {
    let displayHeight = Math.round(window.screen.availHeight * 0.6);
    let div = document.createElement('div');
    div.innerHTML = `
    <div id='ml_overlay' style='position: absolute;top:0;background: #251f1fc4;
    height: 100vh;
    z-index:999999;
    width: 100%;'>
      <img id='ml_video' style='position: absolute;
      height: ${displayHeight}px;user-select: none;
      -webkit-user-drag: none;
      outline: 2px solid #eaeaea;
      box-shadow: 8px 9px 17px #575757;' />
      <div id='ml_selection' style='position: absolute;
      border: 2px dashed red;
      pointer-events: none;'></div>
    </div>`;
    // document.body.querySelector('#ml_overlay')
    document.body.appendChild(div);

    let im = await createImage(src);

    let img = div.querySelector('#ml_video');
    let overlay = div.querySelector('#ml_overlay');
    let selection = div.querySelector('#ml_selection');
    let startX, startY, endX, endY;
    let start = false;
    // Set video source
    img.src = src;

    // init area
    const data = getSetAreaData();
    let x = 0,
      y = 0,
      width = (im.naturalWidth * displayHeight) / im.naturalHeight,
      height = displayHeight;
    let imgWidth = im.naturalWidth;
    let imgHeight = im.naturalHeight;

    if (
      data &&
      data.width > 0 &&
      data.height > 0 &&
      data.imgWidth === imgWidth &&
      data.imgHeight === imgHeight &&
      data.imgHeight > 0
    ) {
      // 相同尺寸窗口，恢复选区
      x = (img.width * data.x) / data.imgWidth;
      y = (img.height * data.y) / data.imgHeight;
      width = (img.width * data.width) / data.imgWidth;
      height = (img.height * data.height) / data.imgHeight;
    }

    selection.style.left = x + 'px';
    selection.style.top = y + 'px';
    selection.style.width = width + 'px';
    selection.style.height = height + 'px';

    // Add mouse events
    img.addEventListener('mousedown', startSelection);
    img.addEventListener('mousemove', updateSelection);
    img.addEventListener('mouseup', endSelection);
    overlay.addEventListener('click', remove);

    function remove() {
      overlay.removeEventListener('click', remove);
      img.removeEventListener('mousedown', startSelection);
      img.removeEventListener('mousemove', updateSelection);
      img.removeEventListener('mouseup', endSelection);
      div.remove();
    }

    function startSelection(event) {
      if (start == false) {
        startX = event.clientX;
        startY = event.clientY;
        updateSelection(event);
        start = true;
      } else {
      }
    }

    function updateSelection(event) {
      endX = event.clientX;
      endY = event.clientY;

      // Calculate width, height, and coordinates
      let width = Math.abs(endX - startX);
      let height = Math.abs(endY - startY);
      let left = Math.min(startX, endX);
      let top = Math.min(startY, endY);

      // Set selection style
      selection.style.left = left + 'px';
      selection.style.top = top + 'px';
      selection.style.width = width + 'px';
      selection.style.height = height + 'px';
    }

    function endSelection(event) {
      endX = event.clientX;
      endY = event.clientY;

      // 获取img元素的真实宽度和高度
      let imgWidth = img.naturalWidth;
      let imgHeight = img.naturalHeight;

      // 换算起始坐标
      let realStartX = (startX / img.offsetWidth) * imgWidth;
      let realStartY = (startY / img.offsetHeight) * imgHeight;

      // 换算起始坐标
      let realEndX = (endX / img.offsetWidth) * imgWidth;
      let realEndY = (endY / img.offsetHeight) * imgHeight;

      startX = realStartX;
      startY = realStartY;
      endX = realEndX;
      endY = realEndY;
      // Calculate width, height, and coordinates
      let width = Math.abs(endX - startX);
      let height = Math.abs(endY - startY);
      let left = Math.min(startX, endX);
      let top = Math.min(startY, endY);

      if (width <= 0 && height <= 0) return remove();

      updateSetAreaData(left, top, width, height, imgWidth, imgHeight);

      updateSetAreaDisplay();

      createBlobFromVideo(!window._mixlab_screen_live);
      remove();
    }
  }

  const toggleShare = async (isCamera = false) => {
    if (webcamVideo.current?.paused) {
      window._mixlab_stopVideo = await shareScreen(isCamera);
      console.log('视频已暂停');

      setShareBtnTxt(t('取消链接'));

      if (window._mixlab_stopLive) {
        window._mixlab_stopLive();
        window._mixlab_stopLive = null;
        // widget.liveBtn.innerText = 'Live Run';
        setLiveBtnTxt(t('开启实时渲染'));
      }

      setTimeout(() => updateSetAreaDisplay(), 2000);
    } else {
      console.log('视频正在播放');
      if (window._mixlab_stopVideo) {
        window._mixlab_stopVideo();
        window._mixlab_stopVideo = null;
        setShareBtnTxt(t('链接软件'));
        // widget.shareOfWebCamBtn.innerText = 'Camera';
      }
      if (window._mixlab_stopLive) {
        window._mixlab_stopLive();
        window._mixlab_stopLive = null;
        setLiveBtnTxt(t('开启实时渲染'));
      }
    }
  };

  const liveRun = async () => {
    if (!window._mixlab_share_screen) {
      message.error(t('请先选择窗口和渲染区域'));
      return;
    }
    if (window._mixlab_stopLive) {
      window._mixlab_stopLive();
      window._mixlab_stopLive = null;
      setLiveBtnTxt(t('开启实时渲染'));
    } else {
      window._mixlab_stopLive = await startLive('liveBtn');
      console.log('window._mixlab_stopLive', window._mixlab_stopLive);
    }
  };

  const openFloatingWin = async () => {
    let blob = await createBlobFromVideoForArea(window._mixlab_screen_webcamVideo);

    setArea(await blobToBase64(blob));
  };

  async function createBlobFromVideoForArea(webcamVideo) {
    const videoW = webcamVideo.videoWidth;
    const videoH = webcamVideo.videoHeight;
    const aspectRatio = videoW / videoH;
    const WIDTH = videoW,
      HEIGHT = videoH;
    const canvas = new OffscreenCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(webcamVideo, 0, 0, videoW, videoH, 0, 0, WIDTH, HEIGHT);

    const blob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 1,
    });

    return blob;
  }

  async function blobToBase64(blob) {
    const reader = new FileReader();
    return new Promise((res, rej) => {
      reader.onload = function (event) {
        res(event.target.result);
      };
      reader.readAsDataURL(blob);
    });
  }

  const onPreview = () => {
    const node1 = document.querySelector('.ant-pro-global-footer-copyright');
    const node2 = document.querySelector('.draw-left');
    const node3 = document.querySelector('.draw-right');
    const node4 = document.querySelector('.bottom-draw');
    const node5 = document.querySelector('.pic-container');
    const node6 = document.querySelectorAll('.ant-layout .ant-layout-header');
    const node7 = document.querySelector('.ant-layout-content');
    node1.style.display = 'none';
    node2.style.display = 'none';
    node3.style.padding = '0';
    node3.style.width = '100vw';
    node3.style.height = '100vh';
    node4.style.margin = '0';
    node4.style.width = '100%';
    node5.style.width = '100%';
    node5.style.margin = '0';
    node6[0].classList.add('notShow');
    node6[1].classList.add('notShow');
    node7.classList.add('margin0');
    window.pywebview.api.check_preview(true);
    setPreview(true);
  };

  const closePreview = () => {
    const node1 = document.querySelector('.ant-pro-global-footer-copyright');
    const node2 = document.querySelector('.draw-left');
    const node3 = document.querySelector('.draw-right');
    const node4 = document.querySelector('.bottom-draw');
    const node5 = document.querySelector('.pic-container');
    const node6 = document.querySelectorAll('.ant-layout .ant-layout-header');
    const node7 = document.querySelector('.ant-layout-content');
    node1.style.display = 'block';
    node2.style.display = 'block';
    node3.style.padding = '40px';
    node3.style.width = 'calc(100vw - 400px)';
    node3.style.height = 'calc(100vh - 100px)';
    node4.style['margin-left'] = '30px';
    node4.style['margin-bottom'] = '30px';
    node4.style.width = 'calc(100% - 60px)';
    node5.style.width = 'calc(100% - 60px)';
    node5.style.margin = '30px 30px 0';
    node6[0].classList.remove('notShow');
    node6[1].classList.remove('notShow');
    node7.classList.remove('margin0');
    window.pywebview.api.check_preview(false);
    setPreview(false);
  };

  const steps = [
    {
      target: '.ant-btn-primary',
      content: '',
    },
    {
      target: '.joy1',
      content: (
        <div>
          <div className="titleContainer">
            <img src="/imgs/icon_bq.png" />
            <div className="joyTitle">{t('3步开启实时渲染')}</div>
          </div>
          <div style={{ color: '#000', textAlign: 'left', marginLeft: 16 }}>
            <span style={{ color: '#333', fontWeight: 'bold' }}>{t('第一步：')}</span>
            {t('点击链接软件，选择需要渲染的界面')}
          </div>
        </div>
      ),
    },
    {
      target: '.joy2',
      content: (
        <div>
          <div className="titleContainer">
            <img src="/imgs/icon_bq.png" />
            <div className="joyTitle">{t('3步开启实时渲染')}</div>
          </div>
          <div style={{ color: '#000', textAlign: 'left', marginLeft: 16 }}>
            <span style={{ color: '#333', fontWeight: 'bold' }}>{t('第二步：')}</span>
            {t('选择界面中，需要渲染区域')}
          </div>
        </div>
      ),
    },
    {
      target: '.joy3',
      content: (
        <div>
          <div className="titleContainer">
            <img src="/imgs/icon_bq.png" />
            <div className="joyTitle">{t('3步开启实时渲染')}</div>
          </div>
          <div style={{ color: '#000', textAlign: 'left', marginLeft: 16 }}>
            <span style={{ color: '#333', fontWeight: 'bold' }}>{t('第三步：')}</span>
            {t('点击渲染，完成渲染')}
          </div>
        </div>
      ),
    },
  ];

  const joyCallback = (e) => {
    console.log('asdasdasdas', e);
    setJoyIndex(e.index);
  };

  // console.log('joyIndexjoyIndexjoyIndex', allClassify);
  return (
    <div className="shareScreenContainer">
      <Joyride
        run={joyRun}
        continuous={true}
        steps={steps}
        disableScrolling={true}
        // showProgress={true}
        showSkipButton={true}
        locale={{
          back: t('上一步'),
          close: t('关闭'),
          next: t('下一步'),
          skip: t('跳过'),
          last: t('完成引导'),
        }}
        styles={{
          options: {
            arrowColor: '#e3ffeb',
            primaryColor: '#005AFF',
          },
        }}
        callback={joyCallback}
      />
      <div className="shareHeader">
        {/* <img src="/imgs/image_bt1.png" /> */}
        <Header />
      </div>
      <div className="shareScreenInner">
        <div className="left">
          <div className="left_top">
            {resultImg ? (
              <img className="img" src={resultImg} />
            ) : (
              <img
                className="img"
                src="/imgs/share_init.jpg"
                width={'100%'}
                height={'100%'}
                style={{ objectFit: 'cover' }}
              />
            )}
            <div className="video">
              <video
                className={`${showVideos ? '' : 'notShow1'}`}
                ref={webcamVideo}
                controls={false}
                style={{ width: '100%' }}
              ></video>
              <div
                className={`${showVideos ? '' : 'notShow1'}`}
                style={{ zIndex: 99 }}
                ref={previewArea}
              ></div>
              <img
                className={`img ${showVideos ? '' : 'notShow'}`}
                src="/imgs/3d0d698b71a18d2bdba5ab1f8801c638.jpg"
              />
              <div
                className="btn3"
                onClick={() => {
                  setShowVideos(!showVideos);
                }}
              >
                <img src={`/imgs/${showVideos ? 'icon_zd' : 'icon_zk'}.png`} />
              </div>
              <div
                className={`btn1 joy1 ${showVideos ? '' : 'notShow1'}`}
                onClick={() => toggleShare(false)}
              >
                <div style={joyIndex == 1 ? { width: 110 } : {}}>
                  <img src="/imgs/icon_ljrj.png" />
                  <span>{shareBtnTxt}</span>
                </div>
              </div>
              <div
                className={`btn2 joy2 ${showVideos ? '' : 'notShow1'}`}
                onClick={() => {
                  if (shareBtnTxt == t('链接软件')) {
                    message.info(t('请先链接软件'));
                    return;
                  }
                  openFloatingWin();
                }}
              >
                <div style={joyIndex == 1 || joyIndex == 2 ? { width: 110 } : {}}>
                  <img src="/imgs/icon_xzqy.png" />
                  <span>{t('选取区域')}</span>
                </div>
              </div>
            </div>
            {/* {do_start ? null : <img className="title" src="/imgs/image_by.png" />} */}
            {do_start ? null : (
              <div className="lianjie" onClick={() => toggleShare(false)}>
                {shareBtnTxt}
              </div>
            )}
            {/* {do_start ? null : (
              <div
                className="jiaoxue"
                onClick={() => {
                  window.open('https://www.bilibili.com/video/BV1NH4y1u7NW/');
                }}
              >
                {t('教学视频')}
              </div>
            )} */}
            {do_start ? null : (
              <div className="tipsContainer">
                <div className="tipsItem">
                  <img
                    className="icon"
                    src="/imgs/icon_ljsyrs.png"
                    style={{ width: 62, height: 49 }}
                  />
                  <div className="tipsItemRight">
                    <div style={{ position: 'relative', fontSize: 30 }}>{t('1W+')}</div>
                    <div>{t('累计使用人数')}</div>
                  </div>
                </div>
                <div className="divider" />
                <div className="tipsItem">
                  <img
                    className="icon"
                    src="/imgs/icon_fwqy.png"
                    style={{ width: 46, height: 50 }}
                  />
                  <div className="tipsItemRight">
                    <div style={{ position: 'relative', fontSize: 30 }}>{t('500+')}</div>
                    <div>{t('服务企业')}</div>
                  </div>
                </div>
                <div className="divider" />
                <div className="tipsItem">
                  <img
                    className="icon"
                    src="/imgs/icon_xrhm.png"
                    style={{ width: 62, height: 49 }}
                  />
                  <div className="tipsItemRight">
                    <div style={{ position: 'relative', fontSize: 30 }}>{t('500W+')}</div>
                    <div>{t('渲染画面')}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Progress
            style={{}}
            showInfo={false}
            percent={progress * 100}
            strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
          />
          <div className="promptContainer">
            <div className="promptLeft">
              <img src="/imgs/icon_tsc.png" />
              <span>{t('提示词')}</span>
            </div>
            <Input
              value={text}
              onChange={(e) => {
                setText(e.target.value);
              }}
              placeholder={t('沙发、别墅，游泳池，…')}
              className="input"
            />
          </div>
        </div>
        <div className="right">
          <div className="title">
            <img src="/imgs/icon_drsy.png" />
            <span>{`${t('当日剩余渲染次数：')}${live_tickets}${t('次')}`}</span>
          </div>
          <div className="buttonContainer">
            <div
              className="btn2 joy3"
              onMouseLeave={() => set_show_start_tab(false)}
              onMouseEnter={() => {
                set_show_start_tab(true);
              }}
              onClick={() => {
                if (!userInfo?.userId) {
                  setWxLoginVisible(true);
                  return;
                }
                if (live_tickets == 0) {
                  setShowRechargeModal(true);
                  message.info(t('今天实时渲染次数已用尽'));
                  return;
                }
                if (has_start) {
                  message.info(t('正在渲染中'));
                  return;
                }
                if (!window._mixlab_share_screen) {
                  message.error(t('请先选择窗口和渲染区域'));
                  return;
                }
                setProgress(0.1);
                startSingle();
              }}
            >
              {t('单次渲染')}
              {show_start_tab ? (
                <div className="continue_down">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!userInfo?.userId) {
                        setWxLoginVisible(true);
                        return;
                      }
                      if (live_tickets == 0) {
                        setShowRechargeModal(true);
                        message.info(t('今天实时渲染次数已用尽'));
                        return;
                      }
                      if (has_start) {
                        message.info(t('正在渲染中'));
                        return;
                      }
                      if (!window._mixlab_share_screen) {
                        message.error(t('请先选择窗口和渲染区域'));
                        return;
                      }
                      setProgress(0.1);
                      startSingle();
                    }}
                  >
                    {t('单次渲染')}
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      Modal.success({
                        title: <div style={{ fontWeight: 'bold' }}>{t('联系我们')}</div>,
                        okText: t('知道了'),
                        content: (
                          <div>
                            <div>{t('连续实时渲染，一秒一张')}</div>
                            <div>
                              {t(
                                '该功能需要专门的服务器，收费在2500-3500/月，仅对企业用户开放。若有需要，可联系微信yyhyyh159',
                              )}
                            </div>
                            <div>
                              {t('ps：你也可以在客户端永久免费使用该功能（若你电脑显寸不小于8G）')}
                            </div>
                          </div>
                        ),
                      });
                    }}
                  >
                    {t('连续渲染')}
                    <img src="/imgs/icon_qyyh.png" />
                  </div>
                </div>
              ) : null}
            </div>
            <div
              className="btn2 btn_white"
              onClick={() => {
                downloadImg(resultImg, userInfo);
              }}
            >
              {t('保存')}
            </div>
          </div>
          <Divider dashed style={{ margin: '32px 0', borderColor: 'rgba(255,255,255,0.2)' }} />
          <div className="space">
            <div className="space-title">
              <Tooltip title={t('渲染氛围：对应不同的风格大模型')}>
                <img src="/imgs/icon_xrfw.png" />
                <span>{t('渲染氛围：')}</span>
              </Tooltip>
            </div>
            <div className="select">
              <Select
                value={ckpt}
                onChange={(e) => {
                  setCkpt(e);
                }}
                placeholder={t('请选择渲染氛围')}
              >
                {ckpt_list.map((v) => {
                  return (
                    <Select.Option key={v.ckpt} value={v.ckpt}>
                      {v.title}
                    </Select.Option>
                  );
                })}
              </Select>
            </div>
          </div>
          <div className="space">
            <div className="space-title">
              <Tooltip title={t('渲染空间：画面的描述词，可自定义')}>
                <img src="/imgs/icon_xrkj.png" />
                <span>{t('渲染空间：')}</span>
              </Tooltip>
            </div>
            <div className="select">
              <Select
                value={activeClassify}
                onChange={(e) => {
                  setText(classify[e].prompt);
                  setActiveClassify(e);
                }}
                placeholder={t('请选择渲染空间')}
              >
                {classify.map((v, i) => {
                  return (
                    <Select.Option key={i} value={i}>
                      {v.title}
                    </Select.Option>
                  );
                })}
              </Select>
            </div>
          </div>
          <div className="space">
            <div className="space-title">
              <Tooltip title={t('底图相似度：越高，则渲染出来的图和底图越相似，AI想象力越差')}>
                <img src="/imgs/icon_dtxsd.png" />
                <span>{t('底图相似度：')}</span>
              </Tooltip>
            </div>
            <div className="select">
              <InputNumber
                max={1}
                min={0}
                step={0.05}
                controls={true}
                value={contronet}
                onChange={(e) => {
                  setContronet(e);
                }}
              />
            </div>
          </div>
          <div className="space">
            <div className="space-title">
              <Tooltip title={t('风格一致性：开启后，渲染的图片将保持同种风格')}>
                <img src="/imgs/icon_fgsd.png" style={{ width: 14, marginRight: 14 }} />
                <span>{t('风格一致性：')}</span>
              </Tooltip>
            </div>
            <div className="select">
              <Select
                value={lockSeed}
                onChange={(e) => {
                  setLockSeed(e);
                }}
                placeholder={t('请选择风格锁定')}
              >
                {[
                  { title: t('开'), value: true },
                  { title: t('关'), value: false },
                ].map((v) => {
                  return (
                    <Select.Option key={v.title} value={v.value}>
                      {v.title}
                    </Select.Option>
                  );
                })}
              </Select>
            </div>
          </div>
        </div>
      </div>
      <div
        className="shareScreenBackground"
        style={{ backgroundImage: `url(${resultImg ? resultImg : '/imgs/share_init.jpg'})` }}
      ></div>
    </div>
  );
};

export default Draw;
