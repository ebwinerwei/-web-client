import { SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react';
import { CursorArrowRaysIcon } from '@heroicons/react/24/outline';
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { useWindowSize } from 'react-use';
import { saveAs } from 'file-saver';
import COS from '@/components/Cos';
import { message } from 'antd';
import { t } from '@/utils/lang';
import inpaint, { runPlugin } from '../../adapters/inpainting';
import { isMidClick, isRightClick, loadImage, srcToFile, useImage } from '../../utils';
import {
  brushSizeState,
  croperState,
  fileState,
  originFileState,
  imageHeightState,
  imageWidthState,
  interactiveSegClicksState,
  isDiffusionModelsState,
  isInpaintingState,
  isInteractiveSegRunningState,
  isInteractiveSegState,
  isPix2PixState,
  isPluginRunningState,
  isProcessingState,
  negativePropmtState,
  propmtState,
  runManuallyState,
  seedState,
  settingState,
  toastState,
  isPanned,
  isNoose,
  fileCosUrl,
} from '../../store/Atoms';
import Croper from '../Croper/Croper';
import emitter, {
  EVENT_BRUSH_CHANGE,
  EVENT_PAINT_BY_CLEAN,
  EVENT_USE_PEN,
  EVENT_USE_SEG,
  EVENT_USE_CLEAR,
  EVENT_USE_REVERSE,
  EVENT_USE_COMPLETE,
  EVENT_DO_USE,
  EVENT_NODE_IMG_UPLOAD,
  EVENT_NODE_DRAW_BEGIN,
  EVENT_NODE_DRAW_CLEAN,
  EVENT_NODE_IMG_CLEAR,
  EVENT_NODE_IMG_COMPLETE,
  EVENT_USE_CLEAN_ALL,
  EVENT_FILE_UPLOAD_COS,
  EVENT_FILE_UPLOAD_COS_SUCCESS,
  EVENT_AI_DISABLED,
} from '../../event';
import { comfyui_ip, local_server, dev_suffix } from '@/config/global';

import FileSelect from '../FileSelect/FileSelect';
import InteractiveSeg from '../InteractiveSeg/InteractiveSeg';
import { PluginName } from '../Plugins/Plugins';

const TOOLBAR_SIZE = 200;
const MIN_BRUSH_SIZE = 5;
const MAX_BRUSH_SIZE = 200;
const BRUSH_COLOR = 'rgba(255, 204, 0, 255)';

const deleteIcon =
  "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E";
const cloneIcon =
  "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='iso-8859-1'%3F%3E%3Csvg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 55.699 55.699' width='100px' height='100px' xml:space='preserve'%3E%3Cpath style='fill:%23010002;' d='M51.51,18.001c-0.006-0.085-0.022-0.167-0.05-0.248c-0.012-0.034-0.02-0.067-0.035-0.1 c-0.049-0.106-0.109-0.206-0.194-0.291v-0.001l0,0c0,0-0.001-0.001-0.001-0.002L34.161,0.293c-0.086-0.087-0.188-0.148-0.295-0.197 c-0.027-0.013-0.057-0.02-0.086-0.03c-0.086-0.029-0.174-0.048-0.265-0.053C33.494,0.011,33.475,0,33.453,0H22.177 c-3.678,0-6.669,2.992-6.669,6.67v1.674h-4.663c-3.678,0-6.67,2.992-6.67,6.67V49.03c0,3.678,2.992,6.669,6.67,6.669h22.677 c3.677,0,6.669-2.991,6.669-6.669v-1.675h4.664c3.678,0,6.669-2.991,6.669-6.669V18.069C51.524,18.045,51.512,18.025,51.51,18.001z M34.454,3.414l13.655,13.655h-8.985c-2.575,0-4.67-2.095-4.67-4.67V3.414z M38.191,49.029c0,2.574-2.095,4.669-4.669,4.669H10.845 c-2.575,0-4.67-2.095-4.67-4.669V15.014c0-2.575,2.095-4.67,4.67-4.67h5.663h4.614v10.399c0,3.678,2.991,6.669,6.668,6.669h10.4 v18.942L38.191,49.029L38.191,49.029z M36.777,25.412h-8.986c-2.574,0-4.668-2.094-4.668-4.669v-8.985L36.777,25.412z M44.855,45.355h-4.664V26.412c0-0.023-0.012-0.044-0.014-0.067c-0.006-0.085-0.021-0.167-0.049-0.249 c-0.012-0.033-0.021-0.066-0.036-0.1c-0.048-0.105-0.109-0.205-0.194-0.29l0,0l0,0c0-0.001-0.001-0.002-0.001-0.002L22.829,8.637 c-0.087-0.086-0.188-0.147-0.295-0.196c-0.029-0.013-0.058-0.021-0.088-0.031c-0.086-0.03-0.172-0.048-0.263-0.053 c-0.021-0.002-0.04-0.013-0.062-0.013h-4.614V6.67c0-2.575,2.095-4.67,4.669-4.67h10.277v10.4c0,3.678,2.992,6.67,6.67,6.67h10.399 v21.616C49.524,43.26,47.429,45.355,44.855,45.355z'/%3E%3C/svg%3E%0A";
const deleteImg = document.createElement('img');
deleteImg.src = deleteIcon;
const cloneImg = document.createElement('img');
cloneImg.src = cloneIcon;

interface Line {
  size?: number;
  pts: { x: number; y: number }[];
}

type LineGroup = Array<Line>;

function drawLines(ctx: CanvasRenderingContext2D, lines: LineGroup, color = BRUSH_COLOR) {
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  lines.forEach((line) => {
    if (!line?.pts.length || !line.size) {
      return;
    }
    ctx.lineWidth = line.size;
    ctx.beginPath();
    ctx.moveTo(line.pts[0].x, line.pts[0].y);
    line.pts.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.stroke();
  });
}

function mouseXY(ev: SyntheticEvent) {
  const mouseEvent = ev.nativeEvent as MouseEvent;
  return { x: mouseEvent.offsetX, y: mouseEvent.offsetY };
}

export default function Editor() {
  const [file, setFile] = useRecoilState(fileState);
  const [file_cos_url, set_file_cos_url] = useRecoilState(fileCosUrl);
  const [originFile, setOriginFile] = useRecoilState(originFileState);
  const promptVal = useRecoilValue(propmtState);
  const negativePromptVal = useRecoilValue(negativePropmtState);
  const settings = useRecoilValue(settingState);
  const [seedVal, setSeed] = useRecoilState(seedState);
  const croperRect = useRecoilValue(croperState);
  const setToastState = useSetRecoilState(toastState);
  const [isInpainting, setIsInpainting] = useRecoilState(isInpaintingState);
  const isProcessing = useRecoilValue(isProcessingState);
  const runMannually = useRecoilValue(runManuallyState);
  const isDiffusionModels = useRecoilValue(isDiffusionModelsState);
  const isPix2Pix = useRecoilValue(isPix2PixState);
  const [isInteractiveSeg, setIsInteractiveSeg] = useRecoilState(isInteractiveSegState);
  const setIsInteractiveSegRunning = useSetRecoilState(isInteractiveSegRunningState);

  const [interactiveSegMask, setInteractiveSegMask] = useState<HTMLImageElement | null | undefined>(
    null,
  );
  // only used while interactive segmentation is on
  const [tmpInteractiveSegMask, setTmpInteractiveSegMask] = useState<
    HTMLImageElement | null | undefined
  >(null);
  const [clicks, setClicks] = useRecoilState(interactiveSegClicksState);
  const [brushSize, setBrushSize] = useRecoilState(brushSizeState);
  const [original, isOriginalLoaded] = useImage(file);
  const [renders, setRenders] = useState<HTMLImageElement[]>([]);
  const [context, setContext] = useState<CanvasRenderingContext2D>();
  const [context_mask, setContextMask] = useState<CanvasRenderingContext2D>();
  const [maskCanvas] = useState<HTMLCanvasElement>(() => {
    return document.createElement('canvas');
  });
  const [lineGroups, setLineGroups] = useState<LineGroup[]>([]);
  const [lastLineGroup, setLastLineGroup] = useState<LineGroup>([]);
  const [curLineGroup, setCurLineGroup] = useState<LineGroup>([]);
  const [{ x, y }, setCoords] = useState({ x: -1, y: -1 });
  const [showBrush, setShowBrush] = useState(false);
  const [showRefBrush, setShowRefBrush] = useState(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isChangingBrushSizeByMouse, setIsChangingBrushSizeByMouse] = useState<boolean>(false);
  const [changeBrushSizeByMouseInit, setChangeBrushSizeByMouseInit] = useState({
    x: -1,
    y: -1,
    brushSize: 20,
  });

  const [scale, setScale] = useState<number>(1);
  const [panned, setPanned] = useState<boolean>(false);
  const [showPanned, setShowPanned] = useRecoilState(isPanned);
  const [minScale, setMinScale] = useState<number>(1.0);
  const windowSize = useWindowSize();
  const windowCenterX = windowSize.width / 2;
  const windowCenterY = windowSize.height / 2;
  const viewportRef = useRef<ReactZoomPanPinchRef | undefined | null>();
  // Indicates that the image has been loaded and is centered on first load
  const [initialCentered, setInitialCentered] = useState(false);

  const [isDraging, setIsDraging] = useState(false);

  const [sliderPos, setSliderPos] = useState<number>(0);

  const [imageWidth, setImageWidth] = useRecoilState(imageWidthState);
  const [imageHeight, setImageHeight] = useRecoilState(imageHeightState);

  const [eraser, setEraser] = useState<boolean>(false);
  const [beginEraser, setBeginEraser] = useState<boolean>(false);
  const [hasEraser, setHasEraser] = useState<boolean>(false);
  const beginP = useRef<any>({ x: 0, y: 0 });

  const [showNoose, setShowNoose] = useRecoilState(isNoose);
  const [nooseDrawing, setNooseDrawing] = useState<boolean>(false);
  const nooseNodes = useRef<any>([]);
  const [tmpNooseSegMask, seTmpNooseSegMask] = useState<HTMLImageElement | null | undefined>(null);

  // 用来存放包含蒙层信息以及底图信息的canvas，主要用来多次编辑蒙层
  const pic_mask = useRef<HTMLImageElement | null>(null);
  // 用来存放fabric信息
  const canvasEl = useRef<HTMLCanvasElement | null>(null);
  const [fabric_context, set_fabric_context] = useState<any | null>(null);
  const [fabric_use, set_fabric_use] = useState<any | null>(false);
  const [do_draw, set_do_draw] = useState<boolean>(false);

  function renderIcon(icon: any) {
    return function renderIcon(ctx, left, top, styleOverride, fabricObject) {
      var size = this.cornerSize;
      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
      ctx.drawImage(icon, -size / 2, -size / 2, size, size);
      ctx.restore();
    };
  }

  const deleteObject = (eventData, transform) => {
    var target = transform.target;
    var canvas = target.canvas;
    canvas.remove(target);
    canvas.requestRenderAll();
  };
  const cloneObject = (eventData, transform) => {
    var target = transform.target;
    var canvas = target.canvas;
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

  const draw = useCallback(
    (render: HTMLImageElement, lineGroup: LineGroup) => {
      if (!context || !context_mask) {
        return;
      }
      console.log(
        `[draw] render size: ${render.width}x${render.height} image size: ${imageWidth}x${imageHeight} canvas size: ${context.canvas.width}x${context.canvas.height}`,
      );
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      // 如果使用橡皮擦的功能，就把底图蒙版给到canvas，用来擦除
      if (eraser && pic_mask.current) {
        context.drawImage(pic_mask.current, 0, 0, imageWidth, imageHeight);
      }
      if (tmpNooseSegMask) {
        context.drawImage(tmpNooseSegMask, 0, 0, imageWidth, imageHeight);
      }
      if (isInteractiveSeg && tmpInteractiveSegMask) {
        context.drawImage(tmpInteractiveSegMask, 0, 0, imageWidth, imageHeight);
      }
      if (!isInteractiveSeg && interactiveSegMask) {
        context.drawImage(interactiveSegMask, 0, 0, imageWidth, imageHeight);
      }
      // if (eraser) {
      //   cleanLines(context, lineGroup);
      // } else {
      // }
      drawLines(context, lineGroup);
    },
    [
      do_draw,
      pic_mask.current,
      eraser,
      context,
      context_mask,
      tmpNooseSegMask,
      isInteractiveSeg,
      tmpInteractiveSegMask,
      interactiveSegMask,
      imageHeight,
      imageWidth,
    ],
  );

  useEffect(() => {
    if (!fabric_context && file) {
      const fabricCanvas = new fabric.Canvas(canvasEl.current);
      // make the fabric.Canvas instance available to your app
      set_fabric_context(fabricCanvas);
      return () => {
        set_fabric_context(null);
        fabricCanvas.dispose();
      };
    }
  }, [file]);

  useEffect(() => {
    if (fabric_context) {
      fabric_context.controlsAboveOverlay = true;
      fabric_context?.setDimensions({
        width: imageWidth,
        height: imageHeight,
      });
    }
  }, [fabric_context, imageWidth, imageHeight]);

  useEffect(() => {
    if (!showPanned || eraser) {
      completeDraw();
      setLineGroups([]);
      setLastLineGroup([]);
      setCurLineGroup([]);
    }
  }, [showPanned, eraser]);

  const drawPic = useCallback(() => {
    if (!context || !context_mask) {
      return;
    }
    console.log(`[drawPic] render size: `, pic_mask, original, renders[renders.length - 1]);
    context_mask.clearRect(0, 0, context_mask.canvas.width, context_mask.canvas.height);
    let render = original;
    if (renders.length) {
      render = renders[renders.length - 1];
    }
    context_mask.drawImage(original, 0, 0, imageWidth, imageHeight);
    if (pic_mask.current && !eraser)
      context_mask.drawImage(pic_mask.current, 0, 0, imageWidth, imageHeight);
  }, [
    eraser,
    original,
    renders,
    pic_mask.current,
    context,
    context_mask,
    tmpNooseSegMask,
    isInteractiveSeg,
    tmpInteractiveSegMask,
    interactiveSegMask,
    imageHeight,
    imageWidth,
  ]);

  // 当绘制蒙层结束时,把蒙层同步到底图上
  const completeDraw = useCallback(async () => {
    return new Promise((resolve, reject) => {
      if (context_mask && context) {
        setNooseDrawing(false);
        nooseNodes.current = [];
        seTmpNooseSegMask(null);
        // 获取图像数据
        var imageData = context?.getImageData(0, 0, context?.canvas.width, context?.canvas.height);
        var imageData2 = context_mask?.getImageData(
          0,
          0,
          context_mask?.canvas.width,
          context_mask?.canvas.height,
        );
        var pixels = imageData.data;
        var pixels2 = imageData2.data;
        // 将有色像素设置为指定颜色，无色像素设置为透明
        for (var i = 0; i < pixels.length; i += 4) {
          var red = pixels[i];
          var green = pixels[i + 1];
          var blue = pixels[i + 2];
          var alpha = pixels[i + 3];
          var red2 = pixels2[i];
          var green2 = pixels2[i + 1];
          var blue2 = pixels2[i + 2];
          var alpha2 = pixels2[i + 3];
          // 判断像素是否有颜色
          var hasColor =
            red !== 0 ||
            green !== 0 ||
            blue !== 0 ||
            alpha !== 0 ||
            (red2 == 255 && green2 == 204 && blue2 == 0 && alpha2 == 255);

          var isBlue = red === 0 && green === 0 && blue === 255 && alpha !== 0;
          if (hasColor) {
            // 设置有颜色的像素为指定颜色
            pixels[i] = 255; // 设置红色通道
            pixels[i + 1] = 204; // 设置绿色通道
            pixels[i + 2] = 0; // 设置蓝色通道
            pixels[i + 3] = 255; // 设置透明度
          } else {
            // 设置无颜色的像素为透明
            pixels[i + 3] = 0; // 设置透明度
          }
        }
        // 将修改后的图像数据放回 Canvas
        context.putImageData(imageData, 0, 0);
        const image = new Image();
        image.onload = () => {
          let render = original;
          if (renders.length) {
            render = renders[renders.length - 1];
          }
          context.clearRect(0, 0, context.canvas.width, context.canvas.height);
          context_mask.clearRect(0, 0, context_mask.canvas.width, context.canvas.height);
          context_mask.drawImage(original, 0, 0, imageWidth, imageHeight);
          pic_mask.current = image;
          if (!eraser) {
            context_mask.drawImage(image, 0, 0, imageWidth, imageHeight);
          }
          console.log('erasererasererasereraser', eraser, hasEraser);
          if (eraser && !hasEraser) {
            context.drawImage(image, 0, 0, imageWidth, imageHeight);
          }
          setHasEraser(false);
          setTmpInteractiveSegMask(null);
          setInteractiveSegMask(null);
          emitter.emit(EVENT_DO_USE, 1);
          resolve(1);
        };
        image.src = context.canvas.toDataURL();
      }
    });
  }, [
    eraser,
    hasEraser,
    context,
    context_mask,
    showNoose,
    interactiveSegMask,
    tmpInteractiveSegMask,
    lineGroups,
    lastLineGroup,
    curLineGroup,
  ]);

  // 当添加元素结束时,把蒙层同步到底图上
  const completeNodeImg = useCallback(async () => {
    return new Promise((resolve, reject) => {
      console.log('fabric_contextfabric_context', fabric_context);
      if (!context_mask || !fabric_context) {
        return;
      }
      var imageDataURL = fabric_context.toDataURL({
        format: 'png', // 指定图像格式，例如 png、jpeg 等
        quality: 1, // 图像质量，取值范围 0 到 1
      });
      var img = new Image();
      img.src = imageDataURL;

      img.onload = () => {
        var newCanvas = document.createElement('canvas');
        newCanvas.width = img.width;
        newCanvas.height = img.height;
        // 将图像绘制到新的 Canvas 上
        var ctx = newCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        // 获取特定区域的像素数据
        var imageData = ctx.getImageData(0, 0, img.width, img.height);
        var imageData2 = context_mask.getImageData(
          0,
          0,
          context_mask.canvas.width,
          context_mask.canvas.height,
        );
        var pixels = imageData.data;
        var pixels2 = imageData2.data;
        // 将有色像素设置为指定颜色，无色像素设置为透明
        for (var i = 0; i < pixels.length; i += 4) {
          var red = pixels[i];
          var green = pixels[i + 1];
          var blue = pixels[i + 2];
          var alpha = pixels[i + 3];
          // 判断像素是否有颜色
          var hasColor = red !== 0 || green !== 0 || blue !== 0 || alpha !== 0;

          var left = pixels[i - 1];
          var right = pixels[i + 7];
          if (hasColor && left !== 0 && right !== 0) {
            // 设置有颜色的像素为指定颜色
            pixels2[i] = pixels[i]; // 设置红色通道
            pixels2[i + 1] = pixels[i + 1]; // 设置绿色通道
            pixels2[i + 2] = pixels[i + 2]; // 设置蓝色通道
            pixels2[i + 3] = pixels[i + 3]; // 设置透明度
          }
        }
        // 将修改后的图像数据放回 Canvas
        context_mask.putImageData(imageData2, 0, 0);
        context_mask.canvas.toBlob(function (blob) {
          // 使用 Blob 对象创建一个新的 File 对象
          const file = new File([blob], 'image.png', { type: 'image/png' });
          // 现在您可以使用这个 File 对象了
          setFile(file);
        }, 'image/png');
        fabric_context.clear();
        set_fabric_use(false);
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
  }, [
    eraser,
    hasEraser,
    context,
    context_mask,
    showNoose,
    interactiveSegMask,
    tmpInteractiveSegMask,
    lineGroups,
    lastLineGroup,
    curLineGroup,
    fabric_context,
    fabric_use,
  ]);

  useEffect(() => {
    if (!fabric_context) {
      return;
    }
    if (fabric_use) {
      const fabric_container = document.querySelector('.canvas-container');
      fabric_container.style.zIndex = 10;
    } else {
      const fabric_container = document.querySelector('.canvas-container');
      fabric_container.style.zIndex = -1;
    }
  }, [fabric_use]);

  const drawLinesOnMask = useCallback(
    (_lineGroups: LineGroup[], maskImage?: HTMLImageElement | null) => {
      if (!context?.canvas.width || !context?.canvas.height) {
        throw new Error('canvas has invalid size');
      }
      maskCanvas.width = context?.canvas.width;
      maskCanvas.height = context?.canvas.height;
      const ctx = maskCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('could not retrieve mask canvas');
      }

      if (maskImage !== undefined && maskImage !== null) {
        // TODO: check whether draw yellow mask works on backend
        ctx.drawImage(maskImage, 0, 0, imageWidth, imageHeight);
      }

      _lineGroups.forEach((lineGroup) => {
        drawLines(ctx, lineGroup, 'white');
      });

      if (
        (maskImage === undefined || maskImage === null) &&
        _lineGroups.length === 1 &&
        _lineGroups[0].length === 0 &&
        isPix2Pix
      ) {
        // For InstructPix2Pix without mask
        drawLines(
          ctx,
          [
            {
              size: 9999999999,
              pts: [
                { x: 0, y: 0 },
                { x: imageWidth, y: 0 },
                { x: imageWidth, y: imageHeight },
                { x: 0, y: imageHeight },
              ],
            },
          ],
          'white',
        );
      }
    },
    [context, maskCanvas, isPix2Pix, imageWidth, imageHeight],
  );

  const hadDrawSomething = useCallback(() => {
    if (isPix2Pix) {
      return true;
    }
    return curLineGroup.length !== 0;
  }, [curLineGroup, isPix2Pix]);

  const drawOnCurrentRender = useCallback(
    (lineGroup: LineGroup) => {
      console.log('[drawOnCurrentRender] draw on current render', renders, lineGroup);
      draw(original, lineGroup);
      drawPic();
    },
    [original, renders, draw],
  );

  const runInpainting = useCallback(
    async (
      useLastLineGroup?: boolean,
      customMask?: File,
      maskImage?: HTMLImageElement | null,
      paintByExampleImage?: File,
    ) => {
      // customMask: mask uploaded by user
      // maskImage: mask from interactive segmentation
      if (file === undefined) {
        return;
      }
      const useCustomMask = customMask !== undefined && customMask !== null;
      const useMaskImage = maskImage !== undefined && maskImage !== null;
      // useLastLineGroup 的影响
      // 1. 使用上一次的 mask
      // 2. 结果替换当前 render
      console.log('runInpainting');
      console.log({
        useCustomMask,
        useMaskImage,
      });

      let maskLineGroup: LineGroup = [];
      if (useLastLineGroup === true) {
        if (lastLineGroup.length === 0) {
          return;
        }
        maskLineGroup = lastLineGroup;
      } else if (!useCustomMask) {
        if (!hadDrawSomething() && !useMaskImage) {
          return;
        }

        setLastLineGroup(curLineGroup);
        maskLineGroup = curLineGroup;
      }

      const newLineGroups = [...lineGroups, maskLineGroup];

      setCurLineGroup([]);
      setIsDraging(false);
      setIsInpainting(true);
      if (settings.graduallyInpainting) {
        drawLinesOnMask([maskLineGroup], maskImage);
      } else {
        drawLinesOnMask(newLineGroups);
      }

      let targetFile = file;
      if (settings.graduallyInpainting === true) {
        if (useLastLineGroup === true) {
          // renders.length == 1 还是用原来的
          if (renders.length > 1) {
            const lastRender = renders[renders.length - 2];
            targetFile = await srcToFile(lastRender.currentSrc, file.name, file.type);
          }
        } else if (renders.length > 0) {
          console.info('gradually inpainting on last result');

          const lastRender = renders[renders.length - 1];
          targetFile = await srcToFile(lastRender.currentSrc, file.name, file.type);
        }
      }

      try {
        const res = await inpaint(
          targetFile,
          settings,
          croperRect,
          promptVal,
          negativePromptVal,
          seedVal,
          useCustomMask ? undefined : maskCanvas.toDataURL(),
          useCustomMask ? customMask : undefined,
          paintByExampleImage,
        );
        if (!res) {
          throw new Error('Something went wrong on server side.');
        }
        const { blob, seed } = res;
        if (seed) {
          setSeed(parseInt(seed, 10));
        }
        const newRender = new Image();
        await loadImage(newRender, blob);

        const newRenders = [newRender];
        setRenders(newRenders);

        draw(newRender, []);
        // Only append new LineGroup after inpainting success
        setLineGroups(newLineGroups);
      } catch (e: any) {
        setToastState({
          open: true,
          desc: e.message ? e.message : e.toString(),
          state: 'error',
          duration: 4000,
        });
        drawOnCurrentRender([]);
      }
      setIsInpainting(false);
      setTmpInteractiveSegMask(null);
      setInteractiveSegMask(null);
    },
    [
      lineGroups,
      curLineGroup,
      maskCanvas,
      settings.graduallyInpainting,
      settings,
      croperRect,
      promptVal,
      negativePromptVal,
      drawOnCurrentRender,
      hadDrawSomething,
      drawLinesOnMask,
      seedVal,
    ],
  );

  const getCurrentRender = useCallback(async () => {
    let targetFile = file;
    if (renders.length > 0) {
      const lastRender = renders[renders.length - 1];
      targetFile = await srcToFile(lastRender.currentSrc, file.name, file.type);
    }
    return targetFile;
  }, [file, renders]);

  useEffect(() => {
    emitter.on(EVENT_NODE_IMG_UPLOAD, (data: any) => {
      if (!file) {
        message.info(t('请上传底图'));
        return;
      }
      fabric_context.isDrawingMode = false;
      set_fabric_use(true);

      if (data instanceof File) {
        onNodeImgUpload(data);
      } else if (Array.isArray(data)) {
        onArrImgUpload(data);
      }
    });

    return () => {
      emitter.off(EVENT_NODE_IMG_UPLOAD);
    };
  }, [fabric_context, fabric_use]);

  useEffect(() => {
    emitter.on(EVENT_NODE_DRAW_BEGIN, (data: any) => {
      if (!fabric_context) {
        return;
      }
      fabric_context.freeDrawingBrush = new fabric.PencilBrush(fabric_context);
      fabric_context.freeDrawingBrush.width = 5;
      fabric_context.isDrawingMode = true;
      set_do_draw(true);
      set_fabric_use(true);
    });

    return () => {
      emitter.off(EVENT_NODE_DRAW_BEGIN);
    };
  }, [fabric_context, fabric_use]);

  useEffect(() => {
    emitter.on(EVENT_NODE_DRAW_CLEAN, (data: any) => {
      if (!fabric_context) {
        return;
      }
      fabric_context.freeDrawingBrush = new fabric.EraserBrush(fabric_context);
      fabric_context.freeDrawingBrush.width = 5;
      fabric_context.isDrawingMode = true;
      set_do_draw(true);
      set_fabric_use(true);
    });

    return () => {
      emitter.off(EVENT_NODE_DRAW_CLEAN);
    };
  }, [fabric_context, fabric_use]);

  useEffect(() => {
    emitter.on(EVENT_NODE_IMG_CLEAR, (data: any) => {
      if (fabric_context && originFile) {
        fabric_context.clear();
        context_mask.clearRect(0, 0, context_mask.canvas.width, context_mask.canvas.height);

        const reader = new FileReader();
        reader.onload = (event) => {
          const imageDataUrl = event.target.result;
          // 创建一个新的Image对象
          const img = new Image();
          // 监听图片加载完成事件
          img.onload = () => {
            context_mask.drawImage(img, 0, 0, imageWidth, imageHeight);
            setFile(originFile);
            emitter.emit(EVENT_AI_DISABLED, false);
          };
          img.src = imageDataUrl;
        };
        reader.readAsDataURL(originFile);
      }
    });

    return () => {
      emitter.off(EVENT_NODE_IMG_CLEAR);
    };
  }, [fabric_context, fabric_use, original, context_mask, originFile]);

  useEffect(() => {
    emitter.on(EVENT_NODE_IMG_COMPLETE, (data: any) => {
      const objects = fabric_context.getObjects();
      for (const i in objects) {
        fabric_context.item(0).hasControls = fabric_context.item(0).hasBorders = false;
        objects[i].selectable = false;
      }
      fabric_context.renderAll();

      completeNodeImg();
    });

    return () => {
      emitter.off(EVENT_NODE_IMG_COMPLETE);
    };
  }, [fabric_context, fabric_use]);

  const onNodeImgUpload = useCallback(
    async (file: File) => {
      if (!file) {
        return;
      }
      // Skip non-image files
      const isImage = file.type.match('image.*');
      if (!isImage) {
        return;
      }
      try {
        // Check if file is larger than 3mb
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(t('文件过大'));
        }
        const image = new Image();
        image.onload = async (e) => {
          console.log('eeeeee', image);
          // for keeping original sized image
          const tmp_canvas = document.createElement('canvas');
          tmp_canvas.width = image.width;
          tmp_canvas.height = image.height;
          if (image.width >= 2000 || image.height >= 2000) {
            message.info(t('图片尺寸过大，宽高不得超过2000'));
            return;
          }
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
          });
          fabric_context?.add(fabricImg);
          fabric_context?.renderAll();
          emitter.emit(EVENT_AI_DISABLED, true);
        };
        image.src = URL.createObjectURL(file);
      } catch (e) {
        // eslint-disable-next-line
        alert(`error: ${(e as any).message}`);
      }
    },
    [fabric_context, imageWidth, imageHeight],
  );

  const onArrImgUpload = useCallback(
    async (array: any) => {
      if (!file) {
        return;
      }
      try {
        message.loading({
          type: 'loading',
          content: t('素材添加中...'),
          duration: 0,
        });
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
            });
            fabric_context?.add(fabricImg);
            fabric_context?.renderAll();
            emitter.emit(EVENT_AI_DISABLED, true);
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
    },
    [fabric_context, imageWidth, imageHeight],
  );

  useEffect(() => {
    emitter.on(EVENT_FILE_UPLOAD_COS, (data: any) => {
      if (!original.src) {
        message.info(t('请上传图片'));
        return;
      }
      if (!pic_mask.current) {
        message.info(t('请涂抹需要修改的区域'));
        return;
      }
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      var canvas2 = document.createElement('canvas');
      var context2 = canvas2.getContext('2d');
      canvas.width = pic_mask.current.width;
      canvas.height = pic_mask.current.height;
      canvas2.width = pic_mask.current.width;
      canvas2.height = pic_mask.current.height;
      // 将图像绘制到画布上
      context?.drawImage(original, 0, 0, canvas.width, canvas.height);
      context2?.drawImage(pic_mask.current, 0, 0, canvas.width, canvas.height);

      var imageData = context?.getImageData(0, 0, canvas.width, canvas.height);
      var imageData2 = context2?.getImageData(0, 0, canvas2.width, canvas2.height);
      var site_data = imageData2?.data;

      if (!site_data || !imageData) {
        message.error(`site_data || imageData ${t('出错了')}~`);
        return;
      }
      for (var i = 0; i < site_data.length; i += 4) {
        var r = site_data[i]; // 红色分量
        var g = site_data[i + 1]; // 绿色分量
        var b = site_data[i + 2]; // 蓝色分量
        var a = site_data[i + 3]; // Alpha 通道

        // 如果颜色不是透明色，将其设置为透明
        if (r === 255 && g === 204 && b === 0 && a === 255) {
          imageData.data[i + 3] = 1; // 将 Alpha 通道设置为 0，使像素变为透明
        }
      }

      // 将修改后的图像数据绘制回画布
      context?.putImageData(imageData, 0, 0);

      // 将 canvas 转换为 Blob 对象
      canvas.toBlob(async (blob: any) => {
        // 创建 File 对象
        var file = new File([blob], 'img.png', { type: 'image/png' });

        const key = `${new Date().getTime()}_${file.size}.png`;
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
              message.error(t('图片上传失败'));
              return;
            }

            const targetFile = await getCurrentRender();
            const key1 = `${new Date().getTime()}_${targetFile.size}.png`;

            COS.uploadFile(
              {
                Bucket: 'blue-user-1304000175' /* 填入您自己的存储桶，必须字段 */,
                Region: 'ap-tokyo' /* 存储桶所在地域，例如ap-beijing，必须字段 */,
                Key: key1 /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */,
                Body: targetFile /* 必须，上传文件对象，可以是input[type="file"]标签选择本地文件后得到的file对象 */,
                // 支持自定义headers 非必须
              },
              async (err1, data1) => {
                console.log(err1 || data1.Location);
                if (!data1.Location) {
                  message.error(t('图片上传失败'));
                  return;
                }

                emitter.emit(EVENT_FILE_UPLOAD_COS_SUCCESS, {
                  image: data1.Location,
                  maskUrl: data.Location,
                });
              },
            );
          },
        );
      }, 'image/png');
    });
    return () => {
      emitter.off(EVENT_FILE_UPLOAD_COS);
    };
  });

  useEffect(() => {
    emitter.on(EVENT_USE_CLEAN_ALL, (data: any) => {
      setLineGroups([]);
      setLastLineGroup([]);
      setCurLineGroup([]);
      setShowNoose(false);
      setTmpInteractiveSegMask(null);
      setInteractiveSegMask(null);
      pic_mask.current = null;
    });
    return () => {
      emitter.off(EVENT_USE_CLEAN_ALL);
    };
  });

  useEffect(() => {
    emitter.on(EVENT_USE_COMPLETE, (data: any) => {
      if ([0, 3].includes(data)) {
        completeDraw();
        setLineGroups([]);
        setLastLineGroup([]);
        setCurLineGroup([]);
      } else if (data == 1) {
        setShowNoose(false);
      } else if (data == 2) {
        clearState();
        onInteractiveAccept();
      }
    });
    return () => {
      emitter.off(EVENT_USE_COMPLETE);
    };
  });

  useEffect(() => {
    emitter.on(EVENT_BRUSH_CHANGE, (data: any) => {
      if (data === false) {
        setShowRefBrush(false);
      } else {
        handleSliderChange(data);
      }
    });
    return () => {
      emitter.off(EVENT_BRUSH_CHANGE);
    };
  });

  useEffect(() => {
    emitter.on(EVENT_PAINT_BY_CLEAN, async (data: any) => {
      if (fabric_use) {
        const objects = fabric_context.getObjects();
        for (const i in objects) {
          fabric_context.item(0).hasControls = fabric_context.item(0).hasBorders = false;
          objects[i].selectable = false;
        }
        fabric_context.renderAll();

        completeNodeImg();
        set_fabric_use(false);
      }
      setShowPanned(!showPanned);
      setShowNoose(false);
    });
    return () => {
      emitter.off(EVENT_PAINT_BY_CLEAN);
    };
  });

  useEffect(() => {
    emitter.on(EVENT_USE_PEN, (data: any) => {
      if (fabric_use) {
        const objects = fabric_context.getObjects();
        for (const i in objects) {
          fabric_context.item(0).hasControls = fabric_context.item(0).hasBorders = false;
          objects[i].selectable = false;
        }
        fabric_context.renderAll();

        completeNodeImg();
        set_fabric_use(false);
      }

      if (data === -1) {
        setShowPanned(false);
      } else {
        setShowPanned(true);
      }
      setShowNoose(!showNoose);
    });
    return () => {
      emitter.off(EVENT_USE_PEN);
    };
  });

  useEffect(() => {
    emitter.on(EVENT_USE_SEG, (data: any) => {
      if (fabric_use) {
        const objects = fabric_context.getObjects();
        for (const i in objects) {
          fabric_context.item(0).hasControls = fabric_context.item(0).hasBorders = false;
          objects[i].selectable = false;
        }
        fabric_context.renderAll();

        completeNodeImg();
        set_fabric_use(false);
      }

      if (data === -1) {
        setShowPanned(false);
        clearState();
        onInteractiveAccept();
      } else {
        setShowPanned(true);
        setIsInteractiveSeg(true);
      }
    });
    return () => {
      emitter.off(EVENT_USE_SEG);
    };
  });

  useEffect(() => {
    emitter.on(EVENT_USE_CLEAR, (data: any) => {
      if (data === -1) {
        setShowPanned(false);
        setEraser(false);
      } else {
        setShowPanned(true);
        setEraser(true);
      }
    });
    return () => {
      emitter.off(EVENT_USE_CLEAR);
    };
  });

  useEffect(() => {
    emitter.on(EVENT_USE_REVERSE, (data: any) => {
      reverseMask();
    });
    return () => {
      emitter.off(EVENT_USE_REVERSE);
    };
  });

  const getCurrentWidthHeight = useCallback(() => {
    let width = 512;
    let height = 512;
    if (!isOriginalLoaded) {
      return [width, height];
    }
    if (renders.length === 0) {
      width = original.naturalWidth;
      height = original.naturalHeight;
    } else if (renders.length !== 0) {
      width = renders[renders.length - 1].width;
      height = renders[renders.length - 1].height;
    }

    return [width, height];
  }, [original, isOriginalLoaded, renders]);

  // Draw once the original image is loaded
  useEffect(() => {
    if (!isOriginalLoaded) {
      return;
    }

    const [width, height] = getCurrentWidthHeight();
    setImageWidth(width);
    setImageHeight(height);

    const rW = windowSize.width / width;
    const rH = (windowSize.height - TOOLBAR_SIZE) / height;

    let s = 1.0;
    if (rW < 1 || rH < 1) {
      s = Math.min(rW, rH);
    }
    setMinScale(s);
    setScale(s);

    console.log(
      `[on file load] image size: ${width}x${height}, canvas size: ${context?.canvas.width}x${context?.canvas.height} scale: ${s}, initialCentered: ${initialCentered}`,
    );

    if (context?.canvas && context_mask?.canvas && !hasEraser) {
      context.canvas.width = width;
      context.canvas.height = height;
      context_mask.canvas.width = width;
      context_mask.canvas.height = height;
      console.log('[on file load] set canvas size && drawOnCurrentRender');
      drawOnCurrentRender(curLineGroup);
    }

    if (!initialCentered) {
      // 防止每次擦除以后图片 zoom 还原
      viewportRef.current?.centerView(s, 1);
      console.log('[on file load] centerView');
      setInitialCentered(true);
    }
  }, [
    // context?.canvas,
    viewportRef,
    original,
    isOriginalLoaded,
    windowSize,
    initialCentered,
    drawOnCurrentRender,
    getCurrentWidthHeight,
  ]);

  useEffect(() => {
    console.log('[useEffect] centerView');
    // render 改变尺寸以后，undo/redo 重新 center
    viewportRef?.current?.centerView(minScale, 1);
  }, [context?.canvas.height, context?.canvas.width, viewportRef, minScale]);

  useEffect(() => {
    window.addEventListener('blur', () => {
      setIsChangingBrushSizeByMouse(false);
    });
    return () => {
      window.removeEventListener('blur', () => {
        setIsChangingBrushSizeByMouse(false);
      });
    };
  }, []);

  const nooseReDraw = () => {
    const canvas = context?.canvas;
    const ctx = context;
    if (ctx && canvas) {
      // 创建新的 Canvas 元素
      const newCanvas = document.createElement('canvas');
      newCanvas.width = canvas.width;
      newCanvas.height = canvas.height;
      const newCtx = newCanvas.getContext('2d');
      if (newCtx) {
        // 设置新的 Canvas 背景为透明
        newCtx.fillStyle = 'rgba(0, 0, 0, 0)';
        newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height);

        // 绘制路径和节点到新的 Canvas 上
        newCtx.beginPath();
        if (nooseNodes.current.length > 0) {
          newCtx.moveTo(nooseNodes.current[0].x, nooseNodes.current[0].y);
          for (let i = 1; i < nooseNodes.current.length; i++) {
            newCtx.lineTo(nooseNodes.current[i].x, nooseNodes.current[i].y);
          }
          // 闭合路径
          newCtx.closePath();
          // 填充背景色
          newCtx.fillStyle = 'rgba(255, 204, 0, 1)'; // 使用半透明黄色背景
          newCtx.fill();
          // 绘制节点
          for (var i = 0; i < nooseNodes.current.length; i++) {
            newCtx.beginPath();
            newCtx.arc(nooseNodes.current[i].x, nooseNodes.current[i].y, 2, 0, Math.PI * 2);
            newCtx.fillStyle = 'blue'; // 使用半透明黄色背景
            newCtx.fill();
            newCtx.closePath();
          }
        }
        newCtx.stroke();

        // 将新的 Canvas 转换为 HTMLImageElement 对象
        var image = new Image();
        image.onload = () => {
          seTmpNooseSegMask(image);
        };
        image.src = newCanvas.toDataURL();
      }
    }
  };

  useEffect(() => {
    if (tmpNooseSegMask) {
      if (renders.length === 0) {
        draw(original, curLineGroup);
      } else {
        draw(renders[renders.length - 1], curLineGroup);
      }
    }
  }, [tmpNooseSegMask]);

  const onMouseMove = (ev: SyntheticEvent) => {
    const mouseEvent = ev.nativeEvent as MouseEvent;
    setCoords({ x: mouseEvent.pageX - 424, y: mouseEvent.pageY - 162 });
  };

  const onMouseDrag = (ev: SyntheticEvent) => {
    if (!context) {
      return;
    }
    if (eraser && beginEraser) {
      const mouseEvent = ev.nativeEvent as MouseEvent;
      const tx = mouseEvent.offsetX;
      const ty = mouseEvent.offsetY;
      context.beginPath();
      context.lineJoin = context.lineCap = 'round';
      context.lineWidth = brushSize;
      context.moveTo(beginP.current.x, beginP.current.y);
      context.lineTo(tx, ty);
      context.closePath();
      context.stroke();
      beginP.current.x = tx;
      beginP.current.y = ty;
      return;
    }
    if (!showPanned) {
      return;
    }
    if (isChangingBrushSizeByMouse) {
      const initX = changeBrushSizeByMouseInit.x;
      // move right: increase brush size
      const newSize = changeBrushSizeByMouseInit.brushSize + (x - initX);
      if (newSize <= MAX_BRUSH_SIZE && newSize >= MIN_BRUSH_SIZE) {
        setBrushSize(newSize);
      }
      return;
    }
    if (isInteractiveSeg) {
      return;
    }
    if (showNoose) {
      if (nooseDrawing) {
        const mouseEvent = ev.nativeEvent as MouseEvent;
        setNooseDrawing(true);
        var x = mouseEvent.offsetX;
        var y = mouseEvent.offsetY;
        if (nooseNodes.current.length > 0) {
          nooseNodes.current[nooseNodes.current.length - 1] = { x: x, y: y };
        }
        nooseReDraw();
      }
      return;
    }
    if (isPanning) {
      return;
    }
    if (!isDraging) {
      return;
    }
    if (curLineGroup.length === 0) {
      return;
    }
    const lineGroup = [...curLineGroup];
    lineGroup[lineGroup.length - 1].pts.push(mouseXY(ev));
    setCurLineGroup(lineGroup);
    drawOnCurrentRender(lineGroup);
  };

  const runInteractiveSeg = useCallback(
    async (newClicks: number[][]) => {
      if (!file) {
        return;
      }

      setIsInteractiveSegRunning(true);
      const targetFile = await getCurrentRender();
      const prevMask = null;

      try {
        const res = await runPlugin(
          PluginName.InteractiveSeg,
          file_cos_url,
          undefined,
          prevMask,
          newClicks,
          imageWidth,
          imageHeight,
        );
        if (!res) {
          throw new Error('Something went wrong on server side.');
        }
        const { blob } = res;
        const img = new Image();
        img.onload = () => {
          setTmpInteractiveSegMask(img);
        };
        img.src = blob;
      } catch (e: any) {
        setToastState({
          open: true,
          desc: e.message ? e.message : e.toString(),
          state: 'error',
          duration: 4000,
        });
      }
      setIsInteractiveSegRunning(false);
    },
    [file_cos_url],
  );

  const onPointerUp = (ev: SyntheticEvent) => {
    if (isMidClick(ev)) {
      setIsPanning(false);
    }
    if (isInteractiveSeg) {
      return;
    }
    if (showNoose) {
      return;
    }
    if (isPanning) {
      return;
    }
    if (!original.src) {
      return;
    }
    const canvas = context?.canvas;
    if (!canvas) {
      return;
    }
    if (isInpainting) {
      return;
    }
    if (!isDraging) {
      return;
    }

    if (runMannually) {
      setIsDraging(false);
    } else {
      runInpainting();
    }
  };

  const isOutsideCroper = (clickPnt: { x: number; y: number }) => {
    if (clickPnt.x < croperRect.x) {
      return true;
    }
    if (clickPnt.y < croperRect.y) {
      return true;
    }
    if (clickPnt.x > croperRect.x + croperRect.width) {
      return true;
    }
    if (clickPnt.y > croperRect.y + croperRect.height) {
      return true;
    }
    return false;
  };

  const onCanvasMouseUp = (ev: SyntheticEvent) => {
    if (beginEraser) {
      setBeginEraser(false);
      setHasEraser(true);
    }
    if (!showPanned) {
      return;
    }
    if (showNoose) {
      if (nooseDrawing) {
        const mouseEvent = ev.nativeEvent as MouseEvent;
        var x = mouseEvent.offsetX;
        var y = mouseEvent.offsetY;
        if (nooseNodes.current.length > 0) {
          nooseNodes.current[nooseNodes.current.length - 1] = { x: x, y: y };
        }
        nooseReDraw();
      }
      setNooseDrawing(false);
      return;
    }
    if (isInteractiveSeg) {
      const xy = mouseXY(ev);
      const isX = xy.x;
      const isY = xy.y;
      const newClicks: number[][] = [...clicks];
      if (isRightClick(ev)) {
        newClicks.push([isX, isY, 0, newClicks.length]);
      } else {
        newClicks.push([isX, isY, 1, newClicks.length]);
      }
      runInteractiveSeg(newClicks);
      setClicks(newClicks);
    }
  };

  const onNooseOver = () => {
    setNooseDrawing(false);
    nooseNodes.current = [];
  };

  useEffect(() => {
    if (showNoose) {
      onNooseOver();
    } else {
      completeDraw();
    }
  }, [showNoose]);

  useEffect(() => {
    if (!eraser) {
      setBeginEraser(false);
      completeDraw();
    }
  }, [eraser]);

  const onMouseDown = (ev: SyntheticEvent) => {
    if (!context) {
      return;
    }
    if (eraser) {
      setBeginEraser(true);
      context.globalCompositeOperation = 'destination-out';
      const mouseEvent = ev.nativeEvent as MouseEvent;
      beginP.current.x = mouseEvent.offsetX;
      beginP.current.y = mouseEvent.offsetY;
      context.beginPath();
      context.arc(beginP.current.x, beginP.current.y, brushSize / 2, 0, Math.PI * 2);
      context.fill();
      context.closePath();
      return;
    }
    if (!showPanned) {
      return;
    }
    if (isProcessing) {
      return;
    }
    if (isInteractiveSeg) {
      return;
    }
    if (showNoose) {
      const mouseEvent = ev.nativeEvent as MouseEvent;
      setNooseDrawing(true);
      var x = mouseEvent.offsetX;
      var y = mouseEvent.offsetY;
      nooseNodes.current.push({ x: x, y: y });
      console.log('nooseNodes', nooseNodes);
      return;
    }
    if (isChangingBrushSizeByMouse) {
      return;
    }
    if (isPanning) {
      return;
    }
    if (!original.src) {
      return;
    }
    const canvas = context?.canvas;
    if (!canvas) {
      return;
    }

    if (isRightClick(ev)) {
      return;
    }

    if (isMidClick(ev)) {
      setIsPanning(true);
      return;
    }

    if (isDiffusionModels && settings.showCroper && isOutsideCroper(mouseXY(ev))) {
      return;
    }

    setIsDraging(true);

    let lineGroup: LineGroup = [];
    if (runMannually) {
      lineGroup = [...curLineGroup];
    }
    lineGroup.push({ size: brushSize, pts: [mouseXY(ev)] });
    setCurLineGroup(lineGroup);
    drawOnCurrentRender(lineGroup);
  };

  const toggleShowBrush = (newState: boolean) => {
    if (newState !== showBrush && !isPanning) {
      setShowBrush(newState);
    }
  };

  const getCursor = useCallback(() => {
    if (isPanning) {
      return 'grab';
    }
    if (showBrush) {
      return 'none';
    }
    return undefined;
  }, [showBrush, isPanning]);

  const getCurScale = (): number => {
    let s = minScale;
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

  const handleSliderChange = (value: number) => {
    setBrushSize(value);
    if (fabric_context) {
      fabric_context.freeDrawingBrush.width = value;
    }

    if (!showRefBrush) {
      setShowRefBrush(true);
      window.setTimeout(() => {
        setShowRefBrush(false);
      }, 10000);
    }
  };

  const renderFileSelect = () => {
    return (
      <div className="landing-file-selector">
        <FileSelect
          onSelection={async (f, url) => {
            setFile(f);
            localStorage.setItem('jubu_origin_img', `https://${url}`);
            set_file_cos_url(url);
            setOriginFile(f);
            emitter.emit(EVENT_AI_DISABLED, false);
          }}
        />
      </div>
    );
  };

  const renderInteractiveSegCursor = () => {
    return (
      <div
        className="interactive-seg-cursor"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          height: showNoose ? 10 : 20,
          width: showNoose ? 10 : 20,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <CursorArrowRaysIcon />
      </div>
    );
  };

  const renderCanvas = () => {
    return (
      <TransformWrapper
        ref={(r) => {
          if (r) {
            viewportRef.current = r;
          }
        }}
        panning={{ disabled: showPanned || fabric_use, velocityDisabled: true }}
        wheel={{ step: 0.05 }}
        centerZoomedOut
        alignmentAnimation={{ disabled: true }}
        centerOnInit
        limitToBounds={false}
        doubleClick={{ disabled: true }}
        initialScale={minScale * 0.5}
        minScale={minScale * 0.3}
        onPanning={(ref) => {
          if (!panned) {
            setPanned(true);
          }
        }}
        onZoom={(ref) => {
          setScale(ref.state.scale);
        }}
      >
        <TransformComponent
          contentClass={isProcessing ? 'editor-canvas-loading' : ''}
          contentStyle={{
            visibility: initialCentered ? 'visible' : 'hidden',
          }}
        >
          <div className="editor-canvas-container">
            <canvas
              className="editor-canvas2"
              style={{
                cursor: getCursor(),
                clipPath: `inset(0 ${sliderPos}% 0 0)`,
                transition: 'clip-path 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onContextMenu={(e) => {
                e.preventDefault();
              }}
              ref={(r) => {
                if (r && !context) {
                  const ctx = r.getContext('2d');
                  if (ctx) {
                    setContextMask(ctx);
                  }
                }
              }}
            />
            <canvas className="editor-canvas3" ref={canvasEl} />
            <canvas
              className="editor-canvas"
              style={{
                cursor: getCursor(),
                clipPath: `inset(0 ${sliderPos}% 0 0)`,
                transition: 'clip-path 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onContextMenu={(e) => {
                e.preventDefault();
              }}
              onMouseOver={() => {
                if (showPanned) {
                  toggleShowBrush(true);
                  setShowRefBrush(false);
                }
              }}
              onFocus={() => {
                if (showPanned) {
                  toggleShowBrush(true);
                }
              }}
              onMouseLeave={() => toggleShowBrush(false)}
              onMouseDown={onMouseDown}
              onMouseUp={onCanvasMouseUp}
              onMouseMove={onMouseDrag}
              ref={(r) => {
                if (r && !context) {
                  const ctx = r.getContext('2d');
                  if (ctx) {
                    setContext(ctx);
                  }
                }
              }}
            />
          </div>

          <Croper
            maxHeight={imageHeight}
            maxWidth={imageWidth}
            minHeight={Math.min(256, imageHeight)}
            minWidth={Math.min(256, imageWidth)}
            scale={scale}
            show={isDiffusionModels && settings.showCroper}
          />

          {isInteractiveSeg ? <InteractiveSeg /> : <></>}
        </TransformComponent>
      </TransformWrapper>
    );
  };

  const onInteractiveAccept = () => {
    setInteractiveSegMask(tmpInteractiveSegMask);
    completeDraw();
    if (!runMannually && tmpInteractiveSegMask) {
      runInpainting(false, undefined, tmpInteractiveSegMask);
    }
  };

  const clearMask = () => {
    setEraser(!eraser);
  };

  const reverseMask = useCallback(() => {
    // 创建 Canvas 元素
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx || !pic_mask.current || !context_mask) {
      return;
    }

    // 设置 Canvas 尺寸与图片尺寸相同
    canvas.width = pic_mask.current.width;
    canvas.height = pic_mask.current.height;

    // 在 Canvas 上绘制图片
    ctx.drawImage(pic_mask.current, 0, 0);

    // 获取图片像素数据
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var pixels = imageData.data;

    // 遍历像素数据，对颜色进行处理
    for (var i = 0; i < pixels.length; i += 4) {
      var r = pixels[i]; // 红色分量
      var g = pixels[i + 1]; // 绿色分量
      var b = pixels[i + 2]; // 蓝色分量
      var a = pixels[i + 3]; // Alpha 通道

      // 如果颜色不是透明色，将其设置为透明
      if (r === 255 && g === 204 && b === 0 && a === 255) {
        pixels[i + 3] = 0; // 将 Alpha 通道设置为 0，使像素变为透明
      } else {
        // 如果颜色是透明色，将其设置为指定颜色
        pixels[i] = 255; // 红色分量
        pixels[i + 1] = 204; // 绿色分量
        pixels[i + 2] = 0; // 蓝色分量
        pixels[i + 3] = 255; // Alpha 通道
      }
    }

    // 将修改后的像素数据放回 Canvas
    ctx.putImageData(imageData, 0, 0);

    const image = new Image();
    image.onload = () => {
      context_mask.clearRect(0, 0, context_mask.canvas.width, context_mask.canvas.height);
      context_mask.drawImage(original, 0, 0, imageWidth, imageHeight);
      pic_mask.current = image;
      context_mask.drawImage(image, 0, 0, imageWidth, imageHeight);
    };
    image.src = ctx.canvas.toDataURL();
  }, [
    pic_mask.current,
    curLineGroup,
    tmpInteractiveSegMask,
    interactiveSegMask,
    hasEraser,
    eraser,
    nooseDrawing,
    showNoose,
  ]);

  const clearState = () => {
    setIsInteractiveSeg(false);
    setIsInteractiveSegRunning(false);
    setClicks([]);
  };

  return (
    <div>
      <div
        className="editor-container"
        aria-hidden="true"
        onMouseMove={onMouseMove}
        onMouseUp={onPointerUp}
      >
        {file === undefined ? renderFileSelect() : renderCanvas()}
        {!isInpainting &&
          !isPanning &&
          (isInteractiveSeg || showNoose ? (
            renderInteractiveSegCursor()
          ) : showPanned ? (
            <div
              className="brush-shape"
              style={getBrushStyle(
                isChangingBrushSizeByMouse ? changeBrushSizeByMouseInit.x : x,
                isChangingBrushSizeByMouse ? changeBrushSizeByMouseInit.y : y,
              )}
            />
          ) : null)}

        {showRefBrush && (
          <div className="brush-shape" style={getBrushStyle(windowCenterX, windowCenterY)} />
        )}
      </div>
    </div>
  );
}
