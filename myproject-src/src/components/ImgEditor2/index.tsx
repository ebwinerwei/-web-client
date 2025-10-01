import {
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  SyntheticEvent,
} from 'react';
import { ReactZoomPanPinchRef, TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { clickMask, getAllSuCai } from '@/services/ant-design-pro/api';
import { CloseOutlined } from '@ant-design/icons';
import LazyLoad from 'react-lazyload';
import COS from '@/components/Cos';
import { message, Button, Divider, Modal, Carousel, Slider } from 'antd';
import { drawPolygon } from './drawPolygon';
import './index.scss';

const TOOLBAR_SIZE = 200;
const MIN_BRUSH_SIZE = 5;
const MAX_BRUSH_SIZE = 200;
const BRUSH_COLOR = 'rgba(255, 204, 0, 1)';
const BRUSH_COLOR_FILL = 'rgba(255, 204, 0, 0.5)';

const deleteIcon =
  "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E";
const cloneIcon =
  "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='iso-8859-1'%3F%3E%3Csvg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 55.699 55.699' width='100px' height='100px' xml:space='preserve'%3E%3Cpath style='fill:%23010002;' d='M51.51,18.001c-0.006-0.085-0.022-0.167-0.05-0.248c-0.012-0.034-0.02-0.067-0.035-0.1 c-0.049-0.106-0.109-0.206-0.194-0.291v-0.001l0,0c0,0-0.001-0.001-0.001-0.002L34.161,0.293c-0.086-0.087-0.188-0.148-0.295-0.197 c-0.027-0.013-0.057-0.02-0.086-0.03c-0.086-0.029-0.174-0.048-0.265-0.053C33.494,0.011,33.475,0,33.453,0H22.177 c-3.678,0-6.669,2.992-6.669,6.67v1.674h-4.663c-3.678,0-6.67,2.992-6.67,6.67V49.03c0,3.678,2.992,6.669,6.67,6.669h22.677 c3.677,0,6.669-2.991,6.669-6.669v-1.675h4.664c3.678,0,6.669-2.991,6.669-6.669V18.069C51.524,18.045,51.512,18.025,51.51,18.001z M34.454,3.414l13.655,13.655h-8.985c-2.575,0-4.67-2.095-4.67-4.67V3.414z M38.191,49.029c0,2.574-2.095,4.669-4.669,4.669H10.845 c-2.575,0-4.67-2.095-4.67-4.669V15.014c0-2.575,2.095-4.67,4.67-4.67h5.663h4.614v10.399c0,3.678,2.991,6.669,6.668,6.669h10.4 v18.942L38.191,49.029L38.191,49.029z M36.777,25.412h-8.986c-2.574,0-4.668-2.094-4.668-4.669v-8.985L36.777,25.412z M44.855,45.355h-4.664V26.412c0-0.023-0.012-0.044-0.014-0.067c-0.006-0.085-0.021-0.167-0.049-0.249 c-0.012-0.033-0.021-0.066-0.036-0.1c-0.048-0.105-0.109-0.205-0.194-0.29l0,0l0,0c0-0.001-0.001-0.002-0.001-0.002L22.829,8.637 c-0.087-0.086-0.188-0.147-0.295-0.196c-0.029-0.013-0.058-0.021-0.088-0.031c-0.086-0.03-0.172-0.048-0.263-0.053 c-0.021-0.002-0.04-0.013-0.062-0.013h-4.614V6.67c0-2.575,2.095-4.67,4.669-4.67h10.277v10.4c0,3.678,2.992,6.67,6.67,6.67h10.399 v21.616C49.524,43.26,47.429,45.355,44.855,45.355z'/%3E%3C/svg%3E%0A";
const deleteImg = document.createElement('img');
deleteImg.src = deleteIcon;
const cloneImg = document.createElement('img');
cloneImg.src = cloneIcon;

const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// 将Base64字符串转换为Blob
function base64ToBlob(base64, mimeType) {
  var byteCharacters = atob(base64);
  var byteArrays = [];

  for (var offset = 0; offset < byteCharacters.length; offset += 1024) {
    var slice = byteCharacters.slice(offset, offset + 1024);

    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: mimeType });
}

// 使用Blob对象创建File对象
function blobToFile(theBlob, fileName) {
  theBlob.lastModifiedDate = new Date();
  theBlob.name = fileName;
  return new File([theBlob], fileName, { type: theBlob.type });
}

const ImgEditor = (props: any, ref: any) => {
  const { upload_img, upload_show_img, initMask, offsetXY } = props;
  const [origin_wh, set_origin_wh] = useState([0, 0]);
  const [wh, set_wh] = useState([0, 0]);
  // 用来存放临时蒙层信息
  const canvasEl = useRef<any | null>(null);
  // 用来存放钢笔canvas
  const polygonEl = useRef<any | null>(null);
  const viewportRef = useRef<ReactZoomPanPinchRef | undefined | null>();
  const [use_polygon, set_use_polygon] = useState<boolean>(false);
  // 用来存放fabric信息
  const fabricEl = useRef<HTMLCanvasElement | null>(null);
  const [fabric_context, set_fabric_context] = useState<any | null>(null);
  // AI 选取
  const [seg_use, set_seg_use] = useState<any | null>(false);
  const [seg_running, set_seg_running] = useState<boolean>(false);
  // 进行涂抹
  const [do_draw, set_do_draw] = useState<boolean>(false);
  // 进行擦除
  const [do_erase, set_do_erase] = useState<boolean>(false);

  const carousel = useRef(null);
  const [sucaiVisible, setSucaiVisible] = useState(false);
  const [sucai_data, set_sucai_data] = useState<any>([]);
  const [active_tab, set_active_tab] = useState([0, 0]);
  const [active_imgs, set_active_imgs] = useState([]);

  const [has_upload_img, set_has_upload_img] = useState(false);
  const [brushSize, setBrushSize] = useState(25);
  const [{ x, y }, setCoords] = useState({ x: -1, y: -1 });

  useEffect(() => {
    if (fabric_context) {
      clear_mask();
    }
  }, [upload_img, upload_show_img]);

  useImperativeHandle(ref, () => ({
    // 准备上传
    prepare: (fun: (mask: string, maskData: any) => void) => {
      complete_polygon(async () => {
        const maskItems = fabric_context.getObjects();
        const dataURL = fabric_context.toDataURL({
          format: 'png', // 或者其他格式如'jpeg'
          quality: 1, // 图片质量，如果是jpeg格式，这个值介于0到1之间
        });

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = upload_show_img
          ? upload_show_img
          : upload_img.includes('http')
          ? upload_img
          : `https://${upload_img}`;

        // 当图片加载完成时执行调整尺寸操作
        img.onload = async () => {
          // 创建canvas元素
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          // 设置canvas的尺寸为你想要的输出尺寸
          canvas.width = origin_wh[0];
          canvas.height = origin_wh[1];
          // 将图片按新尺寸绘制到canvas上
          ctx.drawImage(img, 0, 0, origin_wh[0], origin_wh[1]);

          const img2 = new Image();
          img2.src = dataURL;
          img2.crossOrigin = 'anonymous';
          img2.onload = async () => {
            // 创建canvas元素
            const canvas2 = document.createElement('canvas');
            const ctx2 = canvas2.getContext('2d');
            // 设置canvas的尺寸为你想要的输出尺寸
            canvas2.width = origin_wh[0];
            canvas2.height = origin_wh[1];
            // 将图片按新尺寸绘制到canvas上
            ctx2.drawImage(img2, 0, 0, origin_wh[0], origin_wh[1]);
            const imageData = ctx?.getImageData(0, 0, origin_wh[0], origin_wh[1]);
            const imageData2 = ctx2?.getImageData(0, 0, origin_wh[0], origin_wh[1]);

            for (var i = 0; i < imageData2.data.length; i += 4) {
              // 如果没有蒙层，全部设为透明
              if (maskItems.length) {
                // 如果颜色不是透明色，将其设置为透明
                if (imageData2.data[i + 3] !== 0) {
                  imageData.data[i + 3] = 0; // 将 Alpha 通道设置为 0，使像素变为透明
                }
              } else {
                if (i > 0) imageData.data[i + 3] = 0;
              }
            }

            // 将修改后的图像数据绘制回画布
            ctx?.putImageData(imageData, 0, 0);

            // 将调整尺寸后的canvas内容导出为新的dataURL
            const newDataURL = canvas.toDataURL('image/png', 1); // 或者'image/png'，根据需要选择

            const blob = base64ToBlob(newDataURL.split(',')[1], 'image/png');
            const blob2 = base64ToBlob(dataURL.split(',')[1], 'image/png');

            var file = new File([blob], 'img.png', { type: 'image/png' });
            var file2 = new File([blob2], 'img_mask.png', { type: 'image/png' });
            const key = `${new Date().getTime()}_${file.size}.png`;
            const key1 = `${new Date().getTime()}_${file.size}_mask.png`;
            // 上传带蒙层的图片
            COS.uploadFile(
              {
                Bucket: 'blue-user-1304000175' /* 填入您自己的存储桶，必须字段 */,
                Region: 'ap-tokyo' /* 存储桶所在地域，例如ap-beijing，必须字段 */,
                Key: key /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */,
                Body: file /* 必须，上传文件对象，可以是input[type="file"]标签选择本地文件后得到的file对象 */,
                // 支持自定义headers 非必须
              },
              async (err, data) => {
                console.log(err || data.Location);
                if (!data.Location) {
                  message.error('图片上传失败');
                  return;
                }
                if (maskItems.length) {
                  // 上传蒙层
                  COS.uploadFile(
                    {
                      Bucket: 'blue-user-1304000175' /* 填入您自己的存储桶，必须字段 */,
                      Region: 'ap-tokyo' /* 存储桶所在地域，例如ap-beijing，必须字段 */,
                      Key: key1 /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */,
                      Body: file2 /* 必须，上传文件对象，可以是input[type="file"]标签选择本地文件后得到的file对象 */,
                      // 支持自定义headers 非必须
                    },
                    async (err, data1) => {
                      console.log(err || data1.Location);
                      if (!data1.Location) {
                        message.error('图片上传失败');
                        return;
                      }
                      fun(data.Location, data1.Location);
                    },
                  );
                } else {
                  fun(data.Location, '');
                }
              },
            );
          };
        };
      });
    },
  }));

  useEffect(() => {
    const init = async () => {
      if (fabric_context) {
        clear_mask();
      }
    };
    if (upload_img) {
      init();
    }
  }, [upload_img]);

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
    const polygonDrawer = drawPolygon('polygon', {
      strokeStyle: BRUSH_COLOR,
      lineWidth: 4,
      fillColor: BRUSH_COLOR_FILL,
      pointRadius: 8,
    });
    polygonEl.current = polygonDrawer;
  }, []);

  useEffect(() => {
    const fabricCanvas = new fabric.Canvas(fabricEl.current);
    // make the fabric.Canvas instance available to your app
    set_fabric_context(fabricCanvas);
    if (initMask) {
      const img = new Image();
      img.src = initMask;
      img.crossOrigin = 'Anonymous';
      //console.log('imgimgimgimgimgimg', img);
      img.onload = function () {
        const fabricImg = new fabric.Image(img, {
          left: 0,
          top: 0,
          scaleX: 1,
          scaleY: 1,
        });
        // 添加到Fabric Canvas
        fabricCanvas.add(fabricImg);
        fabricImg.selectable = false;
        fabricCanvas.renderAll(); // 渲染Canvas以显示新添加的图像
      };
    }
    return () => {
      set_fabric_context(null);
      fabricCanvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (initMask && fabric_context) {
      const img = new Image();
      img.src = initMask;
      img.crossOrigin = 'Anonymous';
      img.onload = function () {
        const fabricImg = new fabric.Image(img, {
          left: 0,
          top: 0,
          scaleX: 1,
          scaleY: 1,
        });
        // 添加到Fabric Canvas
        fabric_context.add(fabricImg);
        fabricImg.selectable = false;
        fabric_context.renderAll(); // 渲染Canvas以显示新添加的图像
      };
    }
  }, [initMask, fabric_context]);

  useEffect(() => {
    if (fabric_context && fabric_context.setDimensions && wh[0]) {
      fabric_context.controlsAboveOverlay = true;
      fabric_context?.setDimensions({
        width: wh[0],
        height: wh[1],
      });
    }
  }, [fabric_context, wh]);

  useEffect(() => {
    if (seg_use && fabric_context && has_upload_img) {
      completeNodeImg();
    }
  }, [seg_use]);

  useEffect(() => {
    if (!fabric_context) {
      return;
    }
    if (do_draw) {
      fabric_context.freeDrawingBrush = new fabric.PencilBrush(fabric_context);
      fabric_context.freeDrawingBrush.color = BRUSH_COLOR_FILL;
      fabric_context.freeDrawingBrush.width = 25;
      fabric_context.isDrawingMode = true;
    }

    if (do_draw && fabric_context && has_upload_img) {
      completeNodeImg();
    }
    if (do_draw && use_polygon && fabric_context) {
      complete_polygon();
      set_use_polygon(false);
    }
    if (seg_use) {
      set_seg_use(false);
    }
  }, [do_draw]);

  useEffect(() => {
    if (!fabric_context) {
      return;
    }
    if (do_erase) {
      fabric_context.freeDrawingBrush = new fabric.EraserBrush(fabric_context);
      fabric_context.freeDrawingBrush.width = 25;
      fabric_context.isDrawingMode = true;
    }

    if (do_erase && fabric_context && has_upload_img) {
      completeNodeImg();
    }
    if (do_erase && use_polygon && fabric_context) {
      complete_polygon();
      set_use_polygon(false);
    }
    if (seg_use) {
      set_seg_use(false);
    }
  }, [do_erase]);

  useEffect(() => {
    if (!use_polygon && polygonEl.current) {
      polygonEl.current.clear();
    }
    if (use_polygon && fabric_context && has_upload_img) {
      completeNodeImg();
    }
  }, [use_polygon, fabric_context]);

  useEffect(() => {
    if (wh[0] && canvasEl.current) {
      const ctx = canvasEl.current.getContext('2d');
      // 创建Image对象
      const img = new Image();
      // 设置图片源
      img.src = upload_show_img
        ? upload_show_img
        : upload_img.includes('http')
        ? upload_img
        : `https://${upload_img}`;
      img.onload = () => {
        // 在canvas上绘制图片
        ctx.drawImage(img, 0, 0, wh[0], wh[1]);
      };
    }
  }, [canvasEl.current, wh]);

  function renderIcon(icon: any) {
    return function renderIcon(ctx, left, top, styleOverride, fabricObject) {
      const size = this.cornerSize;
      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
      ctx.drawImage(icon, -size / 2, -size / 2, size, size);
      ctx.restore();
    };
  }

  const deleteObject = (eventData, transform) => {
    const target = transform.target;
    const canvas = target.canvas;
    canvas.remove(target);
    canvas.requestRenderAll();
  };
  const cloneObject = (eventData, transform) => {
    const target = transform.target;
    const canvas = target.canvas;
    target.clone(function (cloned) {
      cloned.left += 10;
      cloned.top += 10;
      canvas.add(cloned);
    });
  };

  fabric.Object.prototype.controls.deleteControl = new fabric.Control({
    x: 0.5,
    y: -0.5,
    offsetY: -16,
    offsetX: 16,
    cursorStyle: 'pointer',
    mouseUpHandler: deleteObject,
    render: renderIcon(deleteImg),
    cornerSize: 24,
  });
  fabric.Object.prototype.controls.clone = new fabric.Control({
    x: -0.5,
    y: -0.5,
    offsetY: -16,
    offsetX: -16,
    cursorStyle: 'pointer',
    mouseUpHandler: cloneObject,
    render: renderIcon(cloneImg),
    cornerSize: 24,
  });

  // 当添加元素结束时,把蒙层同步到底图上
  const completeNodeImg = async () => {
    return new Promise((resolve, reject) => {
      // 将图像绘制到新的 Canvas 上
      const ctx = canvasEl.current.getContext('2d');

      const imageDataURL = fabric_context.toDataURL({
        format: 'png', // 指定图像格式，例如 png、jpeg 等
        quality: 1, // 图像质量，取值范围 0 到 1
      });
      const img2 = new Image();
      img2.src = imageDataURL;

      img2.onload = () => {
        ctx.drawImage(img2, 0, 0, img2.width, img2.height);
        fabric_context.clear();
        set_has_upload_img(false);
      };

      // const image = new Image();
      // image.onload = () => {
      //   let render = original;
      //   if (renders.length) {
      //     render = renders[renders.length - 1];
      //   }
      //   fabric_context.clearRect(0, 0, fabric_context.canvas.width, fabric_context.canvas.height);
      //   context_mask.clearRect(0, 0, context_mask.canvas.width, context_mask.canvas.height);
      //   context_mask.drawImage(original, 0, 0, imageWidth, imageHeight);
      //   pic_mask.current = image;
      //   resolve(1);
      // };
      // image.src = context.canvas.toDataURL();
    });
  };

  const complete_polygon = (fun?: any) => {
    const pllygon_canvas = polygonEl.current.drawPolygonFromPoints(BRUSH_COLOR_FILL);
    if (!pllygon_canvas) {
      if (fun) {
        fun();
      }
      return;
    }
    const dataURL = pllygon_canvas.toDataURL('image/png');
    const img = new Image();
    img.src = dataURL;

    img.onload = function () {
      const fabricImg = new fabric.Image(img, {
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      });

      // 添加到Fabric Canvas
      fabric_context.add(fabricImg);
      fabricImg.selectable = false;
      fabric_context.renderAll(); // 渲染Canvas以显示新添加的图像
      polygonEl.current.clear();
      set_use_polygon(false);
      if (fun) {
        fun();
      }
    };
  };

  const invertColorsAndReimport = () => {
    // 导出画布为图片URL
    const dataURL = fabric_context.toDataURL({ format: 'png', quality: 1 });
    // 创建隐藏的HTML5 Canvas元素
    const hiddenCanvas = document.createElement('canvas');
    const ctx = hiddenCanvas.getContext('2d');
    // 设置隐藏Canvas尺寸与原画布相同
    hiddenCanvas.width = wh[0];
    hiddenCanvas.height = wh[1];

    const img = new Image();
    // 先清除所有元素
    fabric_context.clear().renderAll();
    fabric_context.isDrawingMode = false;
    img.onload = function () {
      ctx.drawImage(img, 0, 0);

      // 获取并操作像素数据
      const imageData = ctx.getImageData(0, 0, hiddenCanvas.width, hiddenCanvas.height);
      const data = imageData.data;

      // 遍历像素
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3]; // Alpha channel

        // 反转颜色：透明变黄色，有颜色变透明
        if (alpha === 0) {
          // 透明
          data[i] = 255; // R
          data[i + 1] = 204; // G
          data[i + 2] = 0; // B
          data[i + 3] = 127; // A (make it visible)
        } else {
          // 有颜色
          data[i + 3] = 0; // Make it transparent
        }
      }

      // 放回修改后的像素数据
      ctx.putImageData(imageData, 0, 0);

      const dataURL = hiddenCanvas.toDataURL('image/png');
      const img2 = new Image();
      img2.onload = function () {
        const fabricImg = new fabric.Image(img2, {
          left: 0,
          top: 0,
          scaleX: 1,
          scaleY: 1,
        });
        // 添加到Fabric Canvas
        fabric_context.add(fabricImg);
        fabricImg.selectable = false;
        fabric_context.renderAll(); // 渲染Canvas以显示新添加的图像
        polygonEl.current.clear();
        set_use_polygon(false);
      };
      img2.src = dataURL;
    };
    img.src = dataURL;
  };

  const runInteractiveSeg = async (x: number, y: number) => {
    set_seg_running(true);
    message.loading({
      type: 'loading',
      content: 'AI选取中..',
      duration: 0,
    });
    const imgUrl = upload_img.includes('http') ? upload_img : `https://${upload_img}`;
   
    const res = await clickMask({
      imgUrl: imgUrl,
      type: '1',
      clickList: `${x},${y}`,
    });
    if (!res.data.masks) {
      message.destroy();
      message.error('AI 拾取失败，请手动涂抹');
      set_seg_running(false);
      return;
    }
    localStorage.setItem('gpuId', res.data.gpuId);
    const byteCharacters = atob(res.data.masks);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    // 创建隐藏的HTML5 Canvas元素
    const hiddenCanvas = document.createElement('canvas');
    const ctx = hiddenCanvas.getContext('2d');
    // 设置隐藏Canvas尺寸与原图相同
    hiddenCanvas.width = origin_wh[0];
    hiddenCanvas.height = origin_wh[1];
    const img = new Image();
    img.width = origin_wh[0];
    img.height = origin_wh[1];
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      // 获取并操作像素数据
      const imageData = ctx.getImageData(0, 0, hiddenCanvas.width, hiddenCanvas.height);
      const data = imageData.data;
      // 遍历像素
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3]; // Alpha channel

        // 反转颜色：透明变黄色，有颜色变透明
        if (alpha === 0) {
          // 有颜色
          data[i + 3] = 0; // Make it transparent
        } else {
          // 透明
          data[i] = 255; // R
          data[i + 1] = 204; // G
          data[i + 2] = 0; // B
          data[i + 3] = 127; // A (make it visible)
        }
      }
      // 放回修改后的像素数据
      ctx.putImageData(imageData, 0, 0);
      const dataURL = hiddenCanvas.toDataURL('image/png');
      const img2 = new Image();
      img2.onload = function () {
        const fabricImg = new fabric.Image(img2, {
          left: 0,
          top: 1,
          scaleX: wh[0] / origin_wh[0],
          scaleY: wh[1] / origin_wh[1],
        });
        // 添加到Fabric Canvas
        fabric_context.add(fabricImg);
        fabricImg.selectable = false;
        fabric_context.renderAll(); // 渲染Canvas以显示新添加的图像
      };
      img2.src = dataURL;
      document.body.appendChild(img2);
      set_seg_running(false);
      message.destroy();
    };
    img.src = URL.createObjectURL(blob);
  };

  const onArrImgUpload = async (array: any) => {
    try {
      message.loading({
        type: 'loading',
        content: '素材添加中..',
        duration: 0,
      });
      clear_mask();
      array.forEach((img: any, index: any) => {
        const image = new Image();
        image.onload = async (e) => {
          console.log('eeeeee', image);
          // for keeping original sized image
          const tmp_canvas = document.createElement('canvas');
          tmp_canvas.width = image.width;
          tmp_canvas.height = image.height;
          let scaleX = 1;
          let scaleY = 1;
          if (image.width > 1000 || image.height > 1000) {
            scaleX = 0.3;
            scaleY = 0.3;
          }
          if (image.width > 500 || image.height > 500) {
            scaleX = 0.6;
            scaleY = 0.6;
          }
          const fabricImg = new fabric.Image(image, {
            left: 200 + index * 20,
            top: 200 + index * 20,
            scaleX: scaleX,
            scaleY: scaleY,
            uploadImg: true,
          });
          fabric_context?.add(fabricImg);
          fabric_context?.renderAll();
          set_has_upload_img(true);
          set_use_polygon(false);
          polygonEl.current.clear();
          set_seg_use(false);
        };
        // TODO
        image.crossOrigin = 'Anonymous';
        image.src = img;
      });
      message.destroy();
    } catch (e) {
      // eslint-disable-next-line
      alert(`error: ${(e as any).message}`);
    }
  };

  const onNodeImgUpload = async (file: File) => {
    if (!file) {
      return;
    }
    // Skip non-image files
    const isImage = file.type.match('image.*');
    if (!isImage) {
      message.error('请上传图片');
      return;
    }
    try {
      // Check if file is larger than 3mb
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('文件过大');
      }
      const image = new Image();
      image.onload = async (e) => {
        //console.log('eeeeee', image);
        // for keeping original sized image
        const tmp_canvas = document.createElement('canvas');
        tmp_canvas.width = image.width;
        tmp_canvas.height = image.height;
        if (image.width >= 2000 || image.height >= 2000) {
          message.info('图片尺寸过大，宽高不得超过2000');
          return;
        }
        clear_mask();
        let scaleX = 1;
        let scaleY = 1;
        if (image.width > 1000 || image.height > 1000) {
          scaleX = 0.3;
          scaleY = 0.3;
        }
        if (image.width > 500 || image.height > 500) {
          scaleX = 0.6;
          scaleY = 0.6;
        }
        const fabricImg = new fabric.Image(image, {
          left: 200,
          top: 200,
          scaleX: scaleX,
          scaleY: scaleY,
          uploadImg: true,
        });
        fabric_context?.add(fabricImg);
        fabric_context?.renderAll();
        set_has_upload_img(true);
        set_use_polygon(false);
        polygonEl.current.clear();
        set_seg_use(false);
      };
      image.src = URL.createObjectURL(file);
    } catch (e) {
      // eslint-disable-next-line
      alert(`error: ${(e as any).message}`);
    }
  };

  const clear_mask = () => {
    // 移除所有对象
    fabric_context?.getObjects().forEach((obj: any) => {
      fabric_context.remove(obj);
    });
  };

  const clickPolygon = () => {
    if (do_draw) {
      set_do_draw(false);
    }
    if (do_erase) {
      set_do_erase(false);
    }
    if (seg_use) {
      set_seg_use(false);
    }
    if (use_polygon) {
      complete_polygon();
      set_use_polygon(false);
    } else {
      set_use_polygon(true);
    }
  };

  const onMouseMove = (ev: SyntheticEvent) => {
    const mouseEvent = ev.nativeEvent as MouseEvent;
    setCoords({
      x: mouseEvent.pageX - (offsetXY?.x || 425),
      y: mouseEvent.pageY - (offsetXY?.y || 163),
    });
  };

  const getCurScale = (): number => {
    let s = 1;
    if (viewportRef.current?.state?.scale !== undefined) {
      s = viewportRef.current?.state?.scale;
    }
    return s!;
  };

  const getBrushStyle = (_x: number, _y: number) => {
    const curScale = getCurScale();
    return {
      width: `${brushSize * curScale}px`,
      height: `${brushSize * curScale}px`,
      left: `${_x}px`,
      top: `${_y}px`,
      transform: 'translate(-50%, -50%)',
    };
  };

  const onBrushChanged = (e) => {
    setBrushSize(e);
    fabric_context.freeDrawingBrush.width = e;
  };

  return (
    <div className={seg_use ? 'seg_use editor_wrap' : 'editor_wrap'}>
      {seg_running ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 999,
          }}
        ></div>
      ) : null}
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
            <span>素材库</span>
          </div>
          <div className="sub_title">上传后，记得涂抹该元素，再开始渲染!</div>
          <div className="carousel-wrapper">
            <div
              className="left"
              onClick={() => {
                carousel?.current.prev();
              }}
            >
              <span className="iconfont icon-jiantou_xiangzuo"></span>
            </div>
            <div
              className="right"
              onClick={() => {
                carousel?.current.next();
              }}
            >
              <span className="iconfont icon-jiantou_xiangyou"></span>
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
                    onArrImgUpload(active_imgs);
                  }
                  setSucaiVisible(false);
                }}
              >{`确定添加（已选${active_imgs.length}张）`}</div>
            </div>
          </div>
        </div>
      </Modal>
      {do_draw || do_erase ? <div className="brush-shape" style={getBrushStyle(x, y)} /> : null}
      <TransformWrapper
        ref={(r) => {
          if (r) {
            viewportRef.current = r;
          }
        }}
        panning={{
          disabled: use_polygon || seg_use || do_draw || do_erase,
          velocityDisabled: true,
        }}
        wheel={{ step: 0.05 }}
        centerZoomedOut
        // centerOnInit
        initialScale={0.5}
        alignmentAnimation={{ disabled: true }}
        limitToBounds={false}
        minScale={0.3}
        doubleClick={{ disabled: true }}
      >
        <TransformComponent>
          <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            onMouseMove={onMouseMove}
            onMouseUp={(e: any) => {
              if (!seg_use) {
                return;
              }
              const ratio = origin_wh[0] / wh[0];
              runInteractiveSeg(
                Math.round(e.nativeEvent.offsetX * ratio),
                Math.round(e.nativeEvent.offsetY * ratio),
              );
            }}
          >
            <img
              id="image_node"
              src={
                upload_show_img
                  ? upload_show_img
                  : upload_img.includes('http')
                  ? upload_img
                  : `https://${upload_img}`
              }
              style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0 }}
              onLoad={(e: any) => {
                console.log('first', e);
                set_origin_wh([e.target.naturalWidth, e.target.naturalHeight]);
                set_wh([e.target.width, e.target.height]);
              }}
            />
            <canvas
              width={wh[0]}
              height={wh[1]}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 2,
              }}
              ref={canvasEl}
            ></canvas>
            <canvas
              width={wh[0]}
              height={wh[1]}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 3,
              }}
              ref={fabricEl}
            />
            <canvas
              id="polygon"
              width={wh[0]}
              height={wh[1]}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: use_polygon ? 10 : -1,
              }}
            ></canvas>
          </div>
        </TransformComponent>
      </TransformWrapper>
      <div style={{ display: 'flex', position: 'absolute', bottom: 10, left: 10 }}>
        {do_draw || do_erase ? (
          <div className="slider" style={{ left: do_draw ? 0 : 280 }}>
            <Slider
              min={MIN_BRUSH_SIZE}
              max={MAX_BRUSH_SIZE}
              onChange={onBrushChanged}
              value={brushSize}
            />
          </div>
        ) : null}
        {/* <div
          className={`img_editor_btn ${do_draw ? 'active_img_editor_btn' : ''}`}
          onClick={() => {
            if (do_erase) {
              set_do_erase(false);
            }
            if (do_draw) {
              fabric_context.isDrawingMode = false;
            }
            set_do_draw(!do_draw);
          }}
        >
          涂抹
        </div>
        <div
          className={`img_editor_btn ${use_polygon ? 'active_img_editor_btn' : ''}`}
          onClick={clickPolygon}
        >
          套索
        </div>
        <div
          className={`img_editor_btn ${seg_use ? 'active_img_editor_btn' : ''}`}
          onClick={() => {
            if (use_polygon && fabric_context) {
              complete_polygon();
              set_use_polygon(false);
            }
            fabric_context.isDrawingMode = false;
            set_seg_use(!seg_use);
          }}
        >
          自动识别
        </div>
        <div
          className={`img_editor_btn`}
          onClick={() => {
            if (use_polygon) {
              complete_polygon(invertColorsAndReimport);
            } else {
              invertColorsAndReimport();
            }
          }}
        >
          反选
        </div>
        <div
          className={`img_editor_btn ${do_erase ? 'active_img_editor_btn' : ''}`}
          onClick={() => {
            if (do_draw) {
              set_do_draw(false);
            }
            if (do_erase) {
              fabric_context.isDrawingMode = false;
            }
            set_do_erase(!do_erase);
          }}
        >
          橡皮
        </div>
        <div className={`img_editor_btn`} onClick={clear_mask}>
          清空蒙层
        </div> */}
        {/* <div className={`img_editor_btn`} onClick={() => setSucaiVisible(true)}>
          素材库
        </div>
        <Upload
          name="image"
          multiple={false}
          maxCount={1}
          showUploadList={false}
          beforeUpload={(file) => {
            const img_size = file.size / 1024 / 1024;
            const isImg = file.type.includes('image');
            if (!isImg) {
              message.error(`请上传图片`);
              return false;
            }
            if (img_size > 10) {
              message.info('图片大小不能超过10M哦');
              return false;
            }
            console.log('file', file);
            onNodeImgUpload(file);
            return true;
          }}
        >
          <div className={`img_editor_btn`}>上传元素</div>
        </Upload> */}
      </div>
    </div>
  );
};
export default forwardRef(ImgEditor);
