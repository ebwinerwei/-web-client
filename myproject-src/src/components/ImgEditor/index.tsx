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
import { useModel, useLocation } from '@umijs/max';
import COS from '@/components/Cos';
import { message, Button, Divider, Modal, Carousel, Slider, Upload, Tooltip } from 'antd';
import { drawPolygon } from './drawPolygon';
import './index.scss';
import { t } from '@/utils/lang';

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
  // [BW-MASK START] 纯黑白图检测 & 转黄色蒙版（白->黄半透明，黑->全透明）
  function buildYellowMaskIfPureBW(srcEl: HTMLImageElement): string | null {
    // 容差：允许极少数像素轻微偏差（抗锯齿/压缩噪点）
    const BLACK_MAX = 10;   // <=10 视为黑
    const WHITE_MIN = 245;  // >=245 视为白
    const ALLOW_MID_RATIO = 0.05; // 中间灰度比例阈值（超过则视为非纯黑白）

    const w = srcEl.naturalWidth || srcEl.width;
    const h = srcEl.naturalHeight || srcEl.height;
    if (!w || !h) return null;

    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(srcEl, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const data = img.data;

    let midCount = 0;
    const total = w * h;

    // 第一遍：是否“纯黑白”
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a === 0) continue; // 透明像素忽略（一般不会有）
      // 均衡灰度（非常严格的黑/白判断）
      const isBlack = (r <= BLACK_MAX && g <= BLACK_MAX && b <= BLACK_MAX);
      const isWhite = (r >= WHITE_MIN && g >= WHITE_MIN && b >= WHITE_MIN);
      if (!isBlack && !isWhite) {
        midCount++;
        // 早停：只要中间灰度比例超阈值，就判定为非纯黑白
        if (midCount / total > ALLOW_MID_RATIO) return null;
      }
    }

    // 第二遍：构造“黄色蒙版”
    // 规则：白色->黄(255,204,0, 半透明 127)；黑色->全透明
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      const isWhite = (r >= WHITE_MIN && g >= WHITE_MIN && b >= WHITE_MIN && a > 0);
      if (isWhite) {
        data[i] = 255;
        data[i + 1] = 204;
        data[i + 2] = 0;
        data[i + 3] = 127;
      } else {
        // 其余（黑/透明）全部透明
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(img, 0, 0);
    return cvs.toDataURL('image/png');
  }
  // [BW-MASK END]

  // [ADD START] 新增功能：检测上传的图片是否本身就是蒙版格式
  /**
   * 通过分析像素数据，判断图片是否可能是蒙版。
   * @param srcEl - 源图像的HTML元素。
   * @returns {Promise<boolean>} 如果图片很可能是蒙版，则返回 true。
   */
  function isLikelyMaskImage(srcEl: HTMLImageElement): Promise<boolean> {
    return new Promise((resolve) => {
      const w = srcEl.naturalWidth || srcEl.width;
      const h = srcEl.naturalHeight || src.height;
      if (!w || !h) {
        resolve(false);
        return;
      }
  
      const cvs = document.createElement('canvas');
      cvs.width = w;
      cvs.height = h;
      const ctx = cvs.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(false);
        return;
      }
  
      ctx.drawImage(srcEl, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
  
      let otherColorPixels = 0;
      let maskColorPixels = 0;
      const totalPixels = w * h;
      const OTHER_PIXEL_THRESHOLD_RATIO = 0.01; // 允许的非蒙版颜色像素比例阈值
  
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
  
        // 忽略完全透明的像素
        if (a === 0) {
          continue;
        }
        
        // 如果像素半透明，我们认为它可能是蒙版的一部分
        if (a > 0 && a < 255) {
            maskColorPixels++;
            continue;
        }

        // 如果像素完全不透明，但不是纯白（作为背景），则认为是“其他颜色”
        // 纯白(255,255,255)有时会作为抠图软件的背景，应忽略
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (a === 255 && (r < 250 || g < 250 || b < 250)) {
            otherColorPixels++;
        }
      }
  
      // 判断条件：
      // 1. “其他颜色”的像素占比极低。
      // 2. 必须存在一些半透明的“蒙版”像素。
      const isMask =
        otherColorPixels / totalPixels < OTHER_PIXEL_THRESHOLD_RATIO && maskColorPixels > 0;
        
      resolve(isMask);
    });
  }
  // [ADD END]
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
    // 放在文件顶部工具函数区域
  // [ADD START] 轮廓线生成：常量与核心算法
  const OUTLINE_ENABLED_DEFAULT = false;
  const OUTLINE_WIDTH = 10; // 轮廓线宽度（像素）
  const OUTLINE_COLOR = 'red'; // 轮廓线颜色
  const OUTLINE_OFFSET = 15; // 从图像边缘到轮廓线内边缘的距离（像素）

  /**
   * 使用像素处理技术为给定的图像元素生成一个外扩轮廓线。
   * @param {HTMLImageElement} sourceEl - 源图像的HTML元素。
   * @param {object} options - 轮廓线参数。
   * @param {number} options.width - 轮廓线的笔刷宽度。
   * @param {string} options.color - 轮廓线的颜色。
   * @param {number} options.offset - 从图像边缘到轮廓线内侧的距离。
   * @returns {Promise<HTMLCanvasElement>} 一个新的 a new canvas a new a new Canvas，仅包含生成的轮廓线。
   */
  function generateOutlineCanvas(sourceEl: HTMLImageElement | HTMLCanvasElement, { width, color, offset }: { width: number; color: string; offset: number }): Promise<HTMLCanvasElement> {
    return new Promise((resolve) => {
      const PADDING = offset + width;
      const sw = sourceEl.width;
      const sh = sourceEl.height;

      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = sw;
      sourceCanvas.height = sh;
      const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
      if (!sourceCtx) return;
      sourceCtx.drawImage(sourceEl, 0, 0);
      const sourceImageData = sourceCtx.getImageData(0, 0, sw, sh);
      const data = sourceImageData.data;

      // [FINAL REASONING] 增加Alpha阈值，忽略抗锯齿边缘的微弱像素，确保洪水填充能正确识别外部区域。
      const ALPHA_THRESHOLD = 10;
      const floodFillData = new Uint8Array(sw * sh);
      const stack = [[0, 0], [sw - 1, 0], [0, sh - 1], [sw - 1, sh - 1]];

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > ALPHA_THRESHOLD) {
          floodFillData[i / 4] = 1; // Opaque
        }
      }

      while (stack.length) {
        const [x, y] = stack.pop()!;
        const index = y * sw + x;
        if (x < 0 || x >= sw || y < 0 || y >= sh || floodFillData[index] !== 0) {
          continue;
        }
        floodFillData[index] = 2; // Background
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      
      // ... 后续代码（轮廓点查找和绘制）与上一版相同 ...
      const contourPoints = [];
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const index = y * sw + x;
          if (floodFillData[index] === 1) { 
            const hasBackgroundNeighbor =
              (x > 0 && floodFillData[index - 1] === 2) ||
              (x < sw - 1 && floodFillData[index + 1] === 2) ||
              (y > 0 && floodFillData[index - sw] === 2) ||
              (y < sh - 1 && floodFillData[index + sw] === 2);
            if (hasBackgroundNeighbor) {
              contourPoints.push({ x, y });
            }
          }
        }
      }

      const outlineCanvas = document.createElement('canvas');
      const ow = sw + PADDING * 2;
      const oh = sh + PADDING * 2;
      outlineCanvas.width = ow;
      outlineCanvas.height = oh;
      const outlineCtx = outlineCanvas.getContext('2d');
      if (!outlineCtx) return;

      outlineCtx.fillStyle = color;
      outlineCtx.beginPath();
      contourPoints.forEach(p => {
        outlineCtx.moveTo(p.x + PADDING, p.y + PADDING);
        outlineCtx.arc(p.x + PADDING, p.y + PADDING, offset + width, 0, 2 * Math.PI);
      });
      outlineCtx.fill();
      outlineCtx.globalCompositeOperation = 'destination-out';
      outlineCtx.beginPath();
      contourPoints.forEach(p => {
        outlineCtx.moveTo(p.x + PADDING, p.y + PADDING);
        outlineCtx.arc(p.x + PADDING, p.y + PADDING, offset, 0, 2 * Math.PI);
      });
      outlineCtx.fill();
      // [FIX-OUTLINE-INNER] 只保留“外扩”部分：把物体内部区域扣掉，去除红色内框
      outlineCtx.globalCompositeOperation = 'destination-out';
      outlineCtx.drawImage(sourceCanvas, PADDING, PADDING); // 用原图 alpha 作为遮罩扣掉内部
      outlineCtx.globalCompositeOperation = 'source-over';

      resolve(outlineCanvas);
    });
  }
  // [ADD END]

  // [PERSPECTIVE-SEAM-FIX] 轻微外扩，消除三角拼接缝
  const EPS = 2; // 0.5~1.0 之间可调，越大越重叠、越不易出缝
  function expandFromCenter(pt: Pt, center: Pt, eps = EPS): Pt {
    const vx = pt.x - center.x, vy = pt.y - center.y;
    const len = Math.hypot(vx, vy) || 1;
    return { x: pt.x + (vx / len) * eps, y: pt.y + (vy / len) * eps };
  }

  // [PERSPECTIVE-ADD START] 透视编辑：常量与算法工具
  const WARP_GRID = 22; // 网格细分，越大越精细，性能越低，可按需调整
  const warpIcon =
    "data:image/svg+xml,%3Csvg width='256' height='256' viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23007fff' d='M28 60l60-24 86 28 54-20v30l-52 19-88-28L28 90V60z'/%3E%3Cpath fill='%23007fff' d='M28 196l60-24 86 28 54-20v30l-52 19-88-28L28 226v-30z' opacity='.5'/%3E%3Cg fill='none' stroke='%23007fff' stroke-width='8'%3E%3Crect x='36' y='72' width='184' height='112' rx='6' ry='6'/%3E%3Cpath d='M36 72l60 28 64-28 60 28M36 184l60-28 64 28 60-28M96 100v56M160 72v112'/%3E%3C/g%3E%3C/svg%3E";

  function renderWarpIcon(ctx, left, top, styleOverride, fabricObject) {
    const size = this.cornerSize;
    const img = document.createElement('img');
    img.src = warpIcon;
    ctx.save();
    ctx.translate(left, top);
    ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  type Pt = { x: number; y: number };
  const lp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const quadLerp = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, tx: number, ty: number): Pt => {
    const L = lp(p0, p3, ty);
    const R = lp(p1, p2, ty);
    return lp(L, R, tx);
  };

  // 由三个点对求仿射矩阵 [a b c d e f]，使得 (x',y') = (a*x + c*y + e, b*x + d*y + f)
  function affineFromTriangles(src: [Pt, Pt, Pt], dst: [Pt, Pt, Pt]) {
    const [s0, s1, s2] = src;
    const [d0, d1, d2] = dst;
    const det = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
    const a = (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) / det;
    const c = (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) / det;
    const e = (d0.x * (s1.x * s2.y - s2.x * s1.y) + d1.x * (s2.x * s0.y - s0.x * s2.y) + d2.x * (s0.x * s1.y - s1.x * s0.y)) / det;
    const b = (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) / det;
    const d = (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) / det;
    const f = (d0.y * (s1.x * s2.y - s2.x * s1.y) + d1.y * (s2.x * s0.y - s0.x * s2.y) + d2.y * (s0.x * s1.y - s1.x * s0.y)) / det;
    return { a, b, c, d, e, f };
  }

  function drawTriangleWarp(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement | HTMLCanvasElement,
    s: [Pt, Pt, Pt],
    d: [Pt, Pt, Pt],
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(d[0].x, d[0].y);
    ctx.lineTo(d[1].x, d[1].y);
    ctx.lineTo(d[2].x, d[2].y);
    ctx.closePath();
    ctx.clip();

    const m = affineFromTriangles(s, d);
    ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
    // 以整张图作为源坐标系（仿射矩阵约束三点完美对齐，clip 限定绘制区域）
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }
  // [PERSPECTIVE-ADD END]


// ===== Auto Mask utilities START =====

// simple uid for pairing
let __AUTO_UID = 1;
const genUid = () => __AUTO_UID++;

/**
 * Create an auto mask (yellow semi-transparent) that matches the alpha of the given fabric.Image.
 * The mask is a cloned image with a Tint filter so only the opaque area is shown.
 * The mask is non-interactive and kept in sync with the source image's transforms.
 */
function createAutoMaskForImage(fabricCanvas, imgObj, opts = {}) {
  return new Promise((resolve) => {
    // Give source image a uid to pair with
    if (!imgObj.__uid) imgObj.__uid = genUid();

    imgObj.clone((maskClone) => {
      // Try Tint filter first; fallback to BlendColor or ColorMatrix if not available
      const applyMaskFilters = () => {
        try {
          if (fabric.Image.filters && fabric.Image.filters.Tint) {
            maskClone.filters = [
              new fabric.Image.filters.Tint({ color: '#FFCC00', opacity: 1 }),
            ];
          } else if (fabric.Image.filters && fabric.Image.filters.BlendColor) {
            maskClone.filters = [
              new fabric.Image.filters.BlendColor({ color: '#FFCC00', mode: 'tint', alpha: 1 }),
            ];
          } else if (fabric.Image.filters && fabric.Image.filters.ColorMatrix) {
            // ColorMatrix to push everything towards yellow-ish
            maskClone.filters = [
              new fabric.Image.filters.ColorMatrix({
                matrix: [
                  0, 0, 0, 0, 1, // R
                  0, 0, 0, 0, 0.8, // G
                  0, 0, 0, 0, 0, // B
                  0, 0, 0, 1, 0, // A
                ],
              }),
            ];
          }
        } catch (e) {
          // ignore filter errors; a plain clone with opacity will still hint the area
        }
      };

      applyMaskFilters();
      try { maskClone.applyFilters(); } catch(e) {}

      // Match transform and position
      maskClone.set({
        left: imgObj.left,
        top: imgObj.top,
        scaleX: imgObj.scaleX,
        scaleY: imgObj.scaleY,
        angle: imgObj.angle,
        flipX: imgObj.flipX,
        flipY: imgObj.flipY,
        originX: imgObj.originX,
        originY: imgObj.originY,
        selectable: false,
        evented: false,
        hoverCursor: 'default',
        opacity: 0.5,
        hasBorders: false,
        hasControls: false,
        perPixelTargetFind: false,
      });

      // pairing flags
      maskClone.isAutoMask = true; // [ADDED] auto-mask flag
      maskClone.isMask = true;     // [ADDED] participate in final mask export like brush/lasso
      maskClone.bindTo = imgObj.__uid;

      // ensure mask is above the image
      fabricCanvas.add(maskClone);
      imgObj._autoMaskPartner = maskClone;
      fabricCanvas.bringToFront(maskClone);
      fabricCanvas.requestRenderAll();

      // Keep the mask synced
      const syncMask = () => {
        if (!maskClone) return;
        maskClone.set({
          left: imgObj.left,
          top: imgObj.top,
          scaleX: imgObj.scaleX,
          scaleY: imgObj.scaleY,
          angle: imgObj.angle,
          flipX: imgObj.flipX,
          flipY: imgObj.flipY,
          originX: imgObj.originX,
          originY: imgObj.originY,
        });
        // Keep above
        fabricCanvas.bringToFront(maskClone);
        fabricCanvas.requestRenderAll();
      };

      const events = ['moving', 'scaling', 'rotating', 'skewing', 'modified'];
      events.forEach(ev => imgObj.on(ev, syncMask));

      // When the source is removed, remove the mask too
      imgObj.on('removed', () => {
        try {
          if (maskClone.canvas) maskClone.canvas.remove(maskClone);
        } catch(e) {}
      });

      resolve(maskClone);
    });
  });
}

/**
 * Remove paired auto mask for a given target if present.
 */
function removeAutoMaskForTarget(target) {
  if (target && target._autoMaskPartner && target.canvas) {
    try { target.canvas.remove(target._autoMaskPartner); } catch(e) {}
  } else if (target && target.__uid && target.canvas) {
    const list = target.canvas.getObjects();
    const partner = list.find(o => o.isAutoMask && o.bindTo === target.__uid);
    if (partner) {
      try { target.canvas.remove(partner); } catch(e) {}
    }
  }
}

// ===== Auto Mask utilities END =====

// ===== Outline utilities START =====

/**
 * 为目标对象移除配对的轮廓线。
 */
function removeOutlineForTarget(target: any) {
  if (target && target._outlinePartner && target.canvas) {
    try { target.canvas.remove(target._outlinePartner); } catch(e) {}
  } else if (target && target.__uid && target.canvas) {
    const list = target.canvas.getObjects();
    const partner = list.find(o => o.isOutline && o.bindTo === target.__uid);
    if (partner) {
      try { target.canvas.remove(partner); } catch(e) {}
    }
  }
}

/**
 * 为指定的 fabric.Image 创建、添加并同步一个外扩轮廓线。
 */
async function createAndSyncOutline(fabricCanvas: any, imgObj: any, options: any) {
    if (!options.enabled) return null;

    try {
        // 作为预防，我们依然保持对主图的硬化
        imgObj.set({
            stroke: null,
            shadow: null,
        });

        // 原有的轮廓线创建逻辑
        const sourceEl = imgObj._element;
        if (!sourceEl) throw new Error("Source element not found");
        const outlineCanvas = await generateOutlineCanvas(sourceEl, options);
        const outlineImg = new fabric.Image(outlineCanvas, {
            originX: 'center',
            originY: 'center',
            left: imgObj.getCenterPoint().x,
            top: imgObj.getCenterPoint().y,
            scaleX: imgObj.scaleX,
            scaleY: imgObj.scaleY,
            angle: imgObj.angle,
            flipX: imgObj.flipX,
            flipY: imgObj.flipY,
            selectable: false,
            evented: false,
            isOutline: true,
        });

        if (!imgObj.__uid) imgObj.__uid = genUid();
        outlineImg.bindTo = imgObj.__uid;
        imgObj._outlinePartner = outlineImg;

        fabricCanvas.add(outlineImg);
        const imgIndex = fabricCanvas.getObjects().indexOf(imgObj);
        if (imgIndex > -1) {
            fabricCanvas.moveTo(outlineImg, imgIndex);
        } else {
            fabricCanvas.sendToBack(outlineImg);
        }

        const syncOutline = () => {
            if (!outlineImg || !outlineImg.canvas) return;

            // [THE REAL FIX] 真正的修复在这里！
            // 我们在每次变换时，不仅要硬化主图，更要硬化其“蒙版伙伴”。
            const maskPartner = imgObj._autoMaskPartner;
            if (maskPartner) {
                maskPartner.set({
                    stroke: null,
                    shadow: null,
                });
            }
            // 同时保持对主图的硬化，确保万无一失
            imgObj.set({
                stroke: null,
                shadow: null,
            });
            
            // 后续的同步逻辑保持不变
            const center = imgObj.getCenterPoint();
            outlineImg.set({
                left: center.x,
                top: center.y,
                scaleX: imgObj.scaleX,
                scaleY: imgObj.scaleY,
                angle: imgObj.angle,
                flipX: imgObj.flipX,
                flipY: imgObj.flipY,
            });
            const imgIndex = outlineImg.canvas.getObjects().indexOf(imgObj);
            if(imgIndex > -1) {
                outlineImg.canvas.moveTo(outlineImg, imgIndex);
            }
            outlineImg.canvas.requestRenderAll();
        };

        const events = ['moving', 'scaling', 'rotating', 'skewing', 'modified'];
        events.forEach(ev => imgObj.on(ev, syncOutline));

        imgObj.on('removed', () => {
            if (outlineImg.canvas) outlineImg.canvas.remove(outlineImg);
        });

        fabricCanvas.requestRenderAll();
        return outlineImg;
    } catch (error) {
        console.error("Failed to create outline:", error);
        return null;
    }
}
// ===== Outline utilities END =====

function blobToFile(theBlob, fileName) {
  theBlob.lastModifiedDate = new Date();
  theBlob.name = fileName;
  return new File([theBlob], fileName, { type: a.type });
}

const ImgEditor = (props: any, ref: any) => {
  const { upload_img, upload_show_img, initMask, offsetXY, rightContentHeight, leftWidth } = props;
  const { window_size } = useModel('global');
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
  const [isOutlineEnabled, setOutlineEnabled] = useState(OUTLINE_ENABLED_DEFAULT); // [ADD THIS LINE]
  const [imageRenderInfo, setImageRenderInfo] = useState({
      width: 0,
      height: 0,
      offsetX: 0,
      offsetY: 0,
      scale: 1,
    });
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  // [EDIT VISUAL FEEDBACK] 当前正在编辑的图片引用
  const editingTargetRef = useRef<any | null>(null);
  // [EDIT VISUAL FEEDBACK] 编辑态透明度（普通编辑 + 透视编辑共用）
  const [editOpacity, setEditOpacity] = useState<number>(0.5);
  const editOpacityRef = useRef(0.5);

  useEffect(() => {
    editOpacityRef.current = editOpacity;
  }, [editOpacity]);
  // [AUTO-FIT] 仅在底图首次显示时做一次适配
  const didAutoFitRef = useRef(false);

// [ROUTE FIX] 每次“进入编辑页（路由变化）”时，视图层先强制归一，避免残留缩放
const location = useLocation();
useEffect(() => {
  const wrapper = viewportRef.current as any;
  try {
    if (typeof wrapper?.resetTransform === 'function') {
      wrapper.resetTransform();
    }
    if (typeof wrapper?.setTransform === 'function') {
      wrapper.setTransform(0, 0, 1); // 归一：左上基点、缩放=1
    }
  } catch {}
  // 同时允许下一次 onLoad 重新自适应（即便是同一张底图）
  didAutoFitRef.current = false;
}, [location.pathname, location.search, location.hash]);
// [ROUTE FIX] 每次“进入编辑页（路由变化）”或“图片变更”时，视图层先强制归一，避免残留缩放
useEffect(() => {
  const wrapper = viewportRef.current as any;
  try {
    if (typeof wrapper?.resetTransform === 'function') {
      wrapper.resetTransform();
    }
    if (typeof wrapper?.setTransform === 'function') {
      wrapper.setTransform(0, 0, 1); // 归一：左上基点、缩放=1
    }
  } catch {}
  // 同时允许下一次 onLoad 重新自适应（即便是同一张底图）
  didAutoFitRef.current = false;
  // [MODIFICATION START] Added image URLs to the dependency array.
  // This consolidates the logic from the removed useEffect, creating a single, robust
  // reset mechanism that fires whenever the route OR the image source changes.
  // This resolves the race condition by ensuring a reset occurs reliably upon re-entry.
}, [location.pathname, location.search, location.hash, upload_img, upload_show_img]);
// [MODIFICATION END]
// [NEW AUTO-FIT LOGIC]
  // This useEffect is dedicated to auto-fitting the image.
  // It depends on all necessary data: container dimensions (props) and natural image dimensions (state).
  // This ensures it only runs when all values are valid and greater than 0, fixing the race condition.
  useEffect(() => {
    const wrapper = viewportRef.current as any;
    const [naturalWidth, naturalHeight] = origin_wh;

    // Guard clause: Only proceed if the viewport is ready, auto-fit hasn't happened yet,
    // and all dimension data is valid (greater than 0).
    if (
      wrapper &&
      !didAutoFitRef.current &&
      leftWidth > 0 &&
      rightContentHeight > 0 &&
      naturalWidth > 0 &&
      naturalHeight > 0
    ) {
      const fitScale = Math.min(
        leftWidth / naturalWidth,
        rightContentHeight / naturalHeight
      );

      if (typeof wrapper.setTransform === 'function') {
        wrapper.setTransform(0, 0, fitScale);
      }
      
      // IMPORTANT: Only set the flag after a SUCCESSFUL fit.
      didAutoFitRef.current = true;
    }
  }, [leftWidth, rightContentHeight, origin_wh]);
  // Dependencies ensure this runs only when data is ready.

  // [EDIT VISUAL FEEDBACK] 普通编辑：按下→半透明且隐藏自动蒙版；松开/修改完成→恢复
  useEffect(() => {
    if (!fabric_context) return;

    const handleMouseDown = (opt: any) => {
      const t = opt?.target;
      // 仅对“用户手动上传 / 素材库添加”的图片生效
      if (t && t.type === 'image' && t.uploadImg === true) {
        // 记录原始透明度
        if (t._prevOpacity === undefined) t._prevOpacity = t.opacity ?? 1;
        t.set('opacity', editOpacityRef.current);

        // 隐藏自动黄色蒙版（若存在配对）
        if (t._autoMaskPartner) t._autoMaskPartner.visible = false;

        fabric_context.requestRenderAll();
      }
    };

    const restore = () => {
      const t = fabric_context?.getActiveObject?.();
      if (t && t.type === 'image' && t.uploadImg === true) {
        // 恢复透明度
        t.set('opacity', t._prevOpacity ?? 1);
        // 显示自动黄色蒙版（若存在配对）
        if (t._autoMaskPartner) t._autoMaskPartner.visible = true;
        fabric_context.requestRenderAll();
      }
    };

    fabric_context.on('mouse:down', handleMouseDown);
    fabric_context.on('mouse:up', restore);
    fabric_context.on('object:modified', restore);
    fabric_context.on('selection:cleared', restore);

    return () => {
      fabric_context.off('mouse:down', handleMouseDown);
      fabric_context.off('mouse:up', restore);
      fabric_context.off('object:modified', restore);
      fabric_context.off('selection:cleared', restore);
    };
  }, [fabric_context]);

  useEffect(() => {
    if (fabric_context) {
      clear_mask();
    }
  }, [upload_img, upload_show_img]);

  useImperativeHandle(ref, () => ({
    // 准备上传
    prepare: (fun: (mask: string, maskData: any, baseImg: string) => void) => {
      complete_polygon(async () => {
        if (has_upload_img) await completeNodeImg();
        
        // [MODIFICATION START] (上次修改)
        // 修改原因: 
        // 通过筛选 `isMask: true` 属性，我们可以准确地识别所有类型的蒙层（自动生成、套索、画笔等）。
        const allObjects = fabric_context.getObjects();
        const maskItems = allObjects.filter(obj => obj.isMask === true);
        // [MODIFICATION END] (上次修改)

        const dataURL = fabric_context.toDataURL({
          format: 'png',
          quality: 1,
        });
        const newBaseURL = canvasEl.current.toDataURL('image/png', 1);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = newBaseURL;

        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = origin_wh[0];
          canvas.height = origin_wh[1];
          ctx.drawImage(img, 0, 0, origin_wh[0], origin_wh[1]);

          const canvasUrl = canvas.toDataURL('image/png', 1);
          const blob3 = base64ToBlob(canvasUrl.split(',')[1], 'image/png');
          const file3 = new File([blob3], 'img_base.png', { type: 'image/png' });
          const key2 = `${new Date().getTime()}_${file3.size}_base.png`;

          COS.uploadFile(
            {
              Bucket: 'blue-user-1304000175',
              Region: 'ap-tokyo',
              Key: key2,
              Body: file3,
            },
            async (err, data2) => {
              if (err || !data2.Location) {
                message.error(t('图片上传失败'));
                return;
              }

              const img2 = new Image();
              img2.src = dataURL;
              img2.crossOrigin = 'anonymous';
              img2.onload = async () => {
                const canvas2 = document.createElement('canvas');
                const ctx2 = canvas2.getContext('2d');
                canvas2.width = origin_wh[0];
                canvas2.height = origin_wh[1];
                ctx2.drawImage(img2, 0, 0, origin_wh[0], origin_wh[1]);
                const imageData = ctx?.getImageData(0, 0, origin_wh[0], origin_wh[1]);
                const imageData2 = ctx2?.getImageData(0, 0, origin_wh[0], origin_wh[1]);

                for (var i = 0; i < imageData2.data.length; i += 4) {
                  // [MODIFICATION START] (上次修改)
                  // 使用精确筛选过的 `maskItems` 进行判断
                  if (maskItems.length) {
                  // [MODIFICATION END] (上次修改)
                    if (imageData2.data[i + 3] !== 0) {
                      imageData.data[i + 3] = 0;
                    }
                  } else {
                    if (i > 0) imageData.data[i + 3] = 0;
                  }
                }

                ctx?.putImageData(imageData, 0, 0);
                const newDataURL = canvas.toDataURL('image/png', 1);
                
                const canvas_base = document.createElement('canvas');
                const ctx_base = canvas_base.getContext('2d');
                canvas_base.width = origin_wh[0];
                canvas_base.height = origin_wh[1];
                ctx_base.drawImage(img, 0, 0, origin_wh[0], origin_wh[1]);

                const blob = base64ToBlob(newDataURL.split(',')[1], 'image/png');
                const blob2 = base64ToBlob(dataURL.split(',')[1], 'image/png');

                var file = new File([blob], 'img.png', { type: 'image/png' });
                var file2 = new File([blob2], 'img_mask.png', { type: 'image/png' });
                const key = `${new Date().getTime()}_${file.size}.png`;
                const key1 = `${new Date().getTime()}_${file.size}_mask.png`;

                COS.uploadFile(
                  {
                    Bucket: 'blue-user-1304000175',
                    Region: 'ap-tokyo',
                    Key: key,
                    Body: file,
                  },
                  async (err, data) => {
                    if (err || !data.Location) {
                      message.error(t('图片上传失败'));
                      return;
                    }
                    // [MODIFICATION START] (上次修改)
                    // 使用精确筛选过的 `maskItems` 进行判断
                    if (maskItems.length) {
                    // [MODIFICATION END] (上次修改)
                      COS.uploadFile(
                        {
                          Bucket: 'blue-user-1304000175',
                          Region: 'ap-tokyo',
                          Key: key1,
                          Body: file2,
                        },
                        async (err, data1) => {
                          if (err || !data1.Location) {
                            message.error(t('图片上传失败'));
                            return;
                          }
                          fun(data.Location, data1.Location, data2.Location);
                        },
                      );
                    } else {
                      fun(data.Location, '', data2.Location);
                    }
                  },
                );
              };
            },
          );
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
      fabric_context.isDrawingMode = false;
      set_do_draw(false);
      set_do_erase(false);
      set_use_polygon(false);
      set_seg_use(false);
      set_active_imgs([]);
      set_active_tab([0, 0]);
    }
  }, [sucaiVisible]);

useEffect(() => {
  // [MODIFICATION START]
  // 核心修复：确保仅在底图的原始尺寸 (origin_wh) 准备就绪后，才初始化套索工具。
  // 套索画布的尺寸和行为完全由 origin_wh 决定，与容器尺寸 wh 无关。
  // 这样可以避免在 wh 变化但 origin_wh 未变时进行不必要的重初始化，
  // 并确保在小图加载（origin_wh 首次从 [0,0] 变为有效值）时，能稳定地创建套索实例。
  if (origin_wh[0] > 0 && origin_wh[1] > 0) {
    const polygonCanvas = document.getElementById('polygon') as HTMLCanvasElement;
    // 确保DOM元素也已渲染并具有正确的尺寸
    if (polygonCanvas && polygonCanvas.width > 0 && polygonCanvas.height > 0) {
      const polygonDrawer = drawPolygon('polygon', {
        strokeStyle: BRUSH_COLOR,
        lineWidth: 4,
        fillColor: BRUSH_COLOR_FILL,
        pointRadius: 8,
      });
      polygonEl.current = polygonDrawer;
    }
  }
  // 依赖项仅保留 origin_wh，因为这是决定套索画布尺寸的唯一状态
}, [origin_wh]);
// [MODIFICATION END]

  // [FIX END]
  useEffect(() => {
    const fabricCanvas = new fabric.Canvas(fabricEl.current);
    // [MODIFICATION START] 解决图片缩小后出现摩尔纹的问题
    // 通过将画布的图像平滑质量设置为“高”，我们请求浏览器在执行所有图像缩放操作时，
    // 使用其内部质量最高的重采样算法。这能有效地对图像进行预处理和插值，
    // 从而显著减少因降采样高频细节（如布料纹理）而产生的摩尔纹和锯齿。
    // 这与专业图像软件的处理思路一致，可以在不引入复杂库的情况下，最大化图像缩小后的视觉质量。
    if (fabricCanvas.getContext()) {
      fabricCanvas.getContext().imageSmoothingQuality = 'high';
    }
    // [MODIFICATION END]
    set_fabric_context(fabricCanvas);
    if (initMask) {
      const img = new Image();
      img.src = initMask;
      img.crossOrigin = 'Anonymous';
      img.onload = function () {
        const fabricImg = new fabric.Image(img, {
          left: 0,
          top: 0,
          scaleX: 1,
          scaleY: 1,
          // [MODIFICATION START] (上次修改)
          isMask: true,
          // [MODIFICATION END] (上次修改)
        });
        fabricCanvas.add(fabricImg);
        fabricImg.selectable = false;
        fabricCanvas.renderAll();
      };
    }
    return () => {
      set_fabric_context(null);
      fabricCanvas.dispose();
    };
  }, []);

  // [MODIFICATION START] (上次修改)
  // 监听画笔创建事件，为涂抹出的路径添加 isMask 标识
  useEffect(() => {
      if (!fabric_context) return;
      const onPathCreated = (e) => {
          if (e.path) {
              e.path.isMask = true;
          }
      };
      fabric_context.on('path:created', onPathCreated);
      return () => {
        if (fabric_context) {
          fabric_context.off('path:created', onPathCreated);
        }
      }
  }, [fabric_context]);
  // [MODIFICATION END] (上次修改)

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
          // [MODIFICATION START] (上次修改)
          isMask: true,
          // [MODIFICATION END] (上次修改)
        });
        fabric_context.add(fabricImg);
        fabricImg.selectable = false;
        fabric_context.renderAll();
      };
    }
  }, [initMask, fabric_context]);

  useEffect(() => {
    // 并把“CSS 显示尺寸”保持为 wh，这样编辑坐标系与底图一致，显示仍按 UI 缩放。
    if (fabric_context && fabric_context.setDimensions && origin_wh[0]) {
      fabric_context.controlsAboveOverlay = true;
      // 内部像素尺寸：与原图一致（编辑范围=整张底图）
      fabric_context.setDimensions({ width: origin_wh[0], height: origin_wh[1] });
      try {
        // CSS 显示尺寸：保持 UI 的 wh，不影响布局与视觉大小
        fabric_context.setDimensions({ width: wh[0], height: wh[1] }, { cssOnly: true });
      } catch {}
    }
  }, [fabric_context, origin_wh, wh]);

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
    // [HIRES-CORE] 使用“原始像素尺寸”绘制底图到 canvasEl，避免先缩小后再放大导致的模糊
    if (origin_wh[0] && canvasEl.current ) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        requestAnimationFrame(() => {
          const canvas = canvasEl.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // 提示浏览器以像素方式缩放画布，避免 CSS 缩放时视觉模糊（仅影响预览）
          canvas.style.imageRendering = 'pixelated';

          // 【关键】把 <canvas> 的“属性尺寸”同步为原图尺寸（不是 CSS 样式尺寸）
          if (canvas.width !== origin_wh[0] || canvas.height !== origin_wh[1]) {
            canvas.width = origin_wh[0];
            canvas.height = origin_wh[1];
          }

          // 关闭绘制插值，减少预览软化
          (ctx as any).imageSmoothingEnabled = false;
          (ctx as any).msImageSmoothingEnabled = false;
          (ctx as any).webkitImageSmoothingEnabled = false;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // 1:1 原分辨率绘制
          ctx.drawImage(img, 0, 0, origin_wh[0], origin_wh[1]);
        });
      };
      img.src = upload_show_img
        ? upload_show_img
        : upload_img.includes('http')
        ? upload_img
        : `https://${upload_img}`;
      return () => { (img as any).onload = null; };
    }
  }, [canvasEl.current, origin_wh, upload_show_img, upload_img]);

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
    try { removeAutoMaskForTarget(transform.target); } catch(e) {}
    try { removeOutlineForTarget(transform.target); } catch(e) {} // [ADD THIS LINE]
    const target = transform.target;
    const canvas = target.canvas;
    canvas.remove(target);
    canvas.requestRenderAll();
  };

  const cloneObject = (eventData, transform) => {
    const target = transform.target;
    const canvas = target.canvas;
    target.clone(async function (cloned) {
      cloned.left += 10;
      cloned.top += 10;
      canvas.add(cloned);
      if (target._autoMaskPartner) {
        try { await createAutoMaskForImage(canvas, cloned); } catch(e) {}
      }
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
  // [COPY-BTN REMOVE] 取消“复制”控制点
  delete (fabric.Object.prototype as any).controls.clone;

  // [ROTATE-CURSOR START] 统一设置旋转控件(mtr)的鼠标指针为“旋转”图标（Base64 PNG）
  const __ROTATE_CURSOR_DATAURL__ =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAApklEQVR4nO2WzQ6AIAyDh/H9XxmvZmGjrYAx0osetvaD+YPZ1t9VxL46ypMFyIIlbxSACab8EYBWeNZXXU3N6nsAPpwZmQdp6pwQTo0rA2DD2VGZmdkBmKErl17pCEBVCe4pAGX1EYQEMEIwxCwAWBtgA7QA7k+w+hd8BLBUEcCyXUB3QIXo9mUA/mvGQlR3hUIyI7SPqp99JuxmfOZUzIConlvv6AIy0RkvY/WWWQAAAABJRU5ErkJggg==";

  // 悬停在旋转控制点（mtr）时显示旋转图标；兼容不同 Fabric 版本的读取路径
  if ((fabric.Object.prototype as any).controls && (fabric.Object.prototype as any).controls.mtr) {
    (fabric.Object.prototype as any).controls.mtr.cursorStyle =
      `url(${__ROTATE_CURSOR_DATAURL__}) 14 14, auto`;
    // 个别版本通过 cursorStyleHandler 取值
    (fabric.Object.prototype as any).controls.mtr.cursorStyleHandler = () =>
      `url(${__ROTATE_CURSOR_DATAURL__}) 14 14, auto`;
  }
  // 兜底：对象级别的旋转光标（少数版本会读这个）
  (fabric.Object.prototype as any).rotationCursor =
    `url(${__ROTATE_CURSOR_DATAURL__}) 14 14, auto`;
  // 再兜底：更老版本字段名
  (fabric.Object.prototype as any).rotatingPointCursor =
    `url(${__ROTATE_CURSOR_DATAURL__}) 14 14, auto`;
  // [ROTATE-CURSOR END]


  const completeNodeImg = async () => {
    return new Promise((resolve, reject) => {
      if (!fabric_context || !canvasEl.current) { resolve(1); return; }
      const ctx = canvasEl.current.getContext('2d');

      const objs = fabric_context.getObjects();
      const hidden = [];
      objs.forEach(o => {
        if (!o.uploadImg) {
          hidden.push(o);
          o._wasVisible = o.visible;
          o.visible = false;
        }
      });
      fabric_context.requestRenderAll();

      const imageDataURL = fabric_context.toDataURL({ format: 'png', quality: 1 });
      const img2 = new Image();
      img2.crossOrigin = 'Anonymous';
      img2.src = imageDataURL;

      img2.onload = () => {
        ctx.drawImage(img2, 0, 0, img2.width, img2.height);

        hidden.forEach(o => { o.visible = o._wasVisible !== false; delete o._wasVisible; });
        fabric_context.requestRenderAll();

        const toRemove = fabric_context.getObjects().filter(o => o.uploadImg === true);
        toRemove.forEach(o => {
          // [MODIFICATION START] (本次关键修复)
          // 修改原因:
          // 在 createAutoMaskForImage 中，源图片对象(o)上被绑定了一个 'removed' 事件。
          // 这个事件会导致当源图片被移除时，它所关联的自动蒙层（auto mask）也会被一同移除。
          // 在 completeNodeImg 的逻辑中，我们需要移除源图片，但必须保留其自动蒙层。
          // 因此，在移除源图片之前，我们先解绑这个 'removed' 事件，以防止自动蒙层被意外删除。
          o.off('removed');
          // [MODIFICATION END] (本次关键修复)
          
          fabric_context.remove(o);
        });

        set_has_upload_img(false);
        resolve(1);
      };
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
        // [MODIFICATION START] (上次修改)
        // 为套索工具生成的蒙层添加 isMask 标识
        isMask: true,
        // [MODIFICATION END] (上次修改)
      });

      fabric_context.add(fabricImg);
      fabricImg.selectable = false;
      fabric_context.renderAll();
      polygonEl.current.clear();
      set_use_polygon(false);
      if (fun) {
        fun();
      }
    };
  };

  const invertColorsAndReimport = () => {
    const dataURL = fabric_context.toDataURL({ format: 'png', quality: 1 });
    const hiddenCanvas = document.createElement('canvas');
    const ctx = hiddenCanvas.getContext('2d');
    // [MODIFICATION START] 确保临时画布尺寸与原图一致
    hiddenCanvas.width = origin_wh[0];
    hiddenCanvas.height = origin_wh[1];
    // [MODIFICATION END]

    const img = new Image();
    fabric_context.clear().renderAll();
    fabric_context.isDrawingMode = false;
    img.onload = function () {
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, hiddenCanvas.width, hiddenCanvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha === 0) {
          data[i] = 255;
          data[i + 1] = 204;
          data[i + 2] = 0;
          data[i + 3] = 127;
        } else {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);

      const dataURL = hiddenCanvas.toDataURL('image/png');
      const img2 = new Image();
      img2.onload = function () {
        const fabricImg = new fabric.Image(img2, {
          left: 0,
          top: 0,
          scaleX: 1,
          scaleY: 1,
          // [MODIFICATION START] (上次修改)
          // 为反选后生成的蒙层添加 isMask 标识
          isMask: true,
          // [MODIFICATION END] (上次修改)
        });
        fabric_context.add(fabricImg);
        fabricImg.selectable = false;
        fabric_context.renderAll();
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
      content: t('AI选取中..'),
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
      message.error(t('AI 拾取失败，请手动涂抹'));
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
    const hiddenCanvas = document.createElement('canvas');
    const ctx = hiddenCanvas.getContext('2d');
    hiddenCanvas.width = origin_wh[0];
    hiddenCanvas.height = origin_wh[1];
    const img = new Image();
    img.width = origin_wh[0];
    img.height = origin_wh[1];
    img.onload = () => {
      // [MODIFICATION START] 强制将蒙版图像绘制到整个画布，避免尺寸不匹配问题
      ctx.drawImage(img, 0, 0, origin_wh[0], origin_wh[1]);
      // [MODIFICATION END]
      const imageData = ctx.getImageData(0, 0, hiddenCanvas.width, hiddenCanvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha === 0) {
          data[i + 3] = 0;
        } else {
          data[i] = 255;
          data[i + 1] = 204;
          data[i + 2] = 0;
          data[i + 3] = 127;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      const dataURL = hiddenCanvas.toDataURL('image/png');
      const img2 = new Image();
      img2.onload = function () {
        const fabricImg = new fabric.Image(img2, {
          left: 0,
          top: 0,
          scaleX: 1,
          scaleY: 1,
          // [MODIFICATION START] (上次修改)
          // 为AI识别生成的蒙层添加 isMask 标识
          isMask: true,
          // [MODIFICATION END] (上次修改)
        });
        fabric_context.add(fabricImg);
        fabricImg.selectable = false;
        fabric_context.renderAll();
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
        content: t('素材添加中..'),
        duration: 0,
      });
      clear_mask();
      array.forEach((img: any, index: any) => {
        const image = new Image();
        image.onload = async (e) => {
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
          try { 
            await createAutoMaskForImage(fabric_context, fabricImg); 
            // [ADD START]
            await createAndSyncOutline(fabric_context, fabricImg, {
              enabled: isOutlineEnabled,
              width: OUTLINE_WIDTH,
              color: OUTLINE_COLOR,
              offset: OUTLINE_OFFSET,
            });
            // [ADD END]
          } catch(e) { console.warn('auto mask failed', e); }
          fabric_context?.renderAll();
          set_has_upload_img(true);
          set_use_polygon(false);
          polygonEl.current.clear();
          set_seg_use(false);
        };
        image.crossOrigin = 'Anonymous';
        image.src = img;
      });
      message.destroy();
    } catch (e) {
      alert(`error: ${(e as any).message}`);
    }
  };

  const onNodeImgUpload = async (file: File) => {
    if (!file) {
      return;
    }
    const isImage = file.type.match('image.*');
    if (!isImage) {
      message.error(t('请上传图片'));
      return;
    }
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('文件过大');
      }
      const image = new Image();
      image.onload = async (e) => {
      // [BW-MASK HOOK - NODE UPLOAD START]
      const bwMaskDataURL = buildYellowMaskIfPureBW(image);
      if (bwMaskDataURL) {
        // 命中“纯黑白图” => 直接作为蒙版放入画布
        const maskImg = new Image();
        maskImg.onload = function () {
          const fabricImg = new fabric.Image(maskImg, {
            left: 0,
            top: 0,
            scaleX: 1,
            scaleY: 1,
            selectable: false,
            evented: false,
            isMask: true, // 关键：标记为蒙层
          });
          fabric_context?.add(fabricImg);
          fabric_context?.renderAll();
          // 和原逻辑保持一致：进入编辑状态的收尾
          set_has_upload_img(true);
          set_use_polygon(false);
          polygonEl.current.clear();
          set_seg_use(false);
        };
        maskImg.crossOrigin = 'Anonymous';
        maskImg.src = bwMaskDataURL;
        return; // 提前返回：不再把该图当“普通图片”加入
      }
      // [BW-MASK HOOK - NODE UPLOAD END]
      // [ADD START] 新增逻辑：检测上传的图片是否本身就是蒙版
      const isMask = await isLikelyMaskImage(image);
      if (isMask) {
        // 逻辑与命中“纯黑白图”完全一致，直接将上传的图作为蒙版放入
        const fabricImg = new fabric.Image(image, {
          left: 0,
          top: 0,
          scaleX: 1,
          scaleY: 1,
          selectable: false,
          evented: false,
          isMask: true, // 关键：标记为蒙层
        });
        fabric_context?.add(fabricImg);
        fabric_context?.renderAll();
        // 和原逻辑保持一致：进入编辑状态的收尾
        set_has_upload_img(true);
        set_use_polygon(false);
        polygonEl.current.clear();
        set_seg_use(false);
        return; // 提前返回：不再把该图当“普通图片”加入
      }
      // [ADD END]
        if (image.width >= 2000 || image.height >= 2000) {
          message.info(t('图片尺寸过大，宽高不得超过2000'));
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
        try { 
          await createAutoMaskForImage(fabric_context, fabricImg);
          // [ADD START]
          await createAndSyncOutline(fabric_context, fabricImg, {
            enabled: isOutlineEnabled,
            width: OUTLINE_WIDTH,
            color: OUTLINE_COLOR,
            offset: OUTLINE_OFFSET,
          });
          // [ADD END] 
        } catch(e) { console.warn('auto mask failed', e); }
        fabric_context?.renderAll();
        set_has_upload_img(true);
        set_use_polygon(false);
        polygonEl.current.clear();
        set_seg_use(false);
      };
      image.src = URL.createObjectURL(file);
    } catch (e) {
      alert(`error: ${(e as any).message}`);
    }
  };
  
  // [MODIFICATION START] 解决“清空蒙层”误删图片的问题
  // 原有的函数会移除画布上的所有对象，包括用户上传的图片。
  // 解决方案是：在删除前，先筛选出所有带有 `isMask: true` 属性的对象。
  // 这个属性是我们为所有类型的蒙层（画笔、套索、AI蒙版、自动蒙版等）设定的统一标识。
  // 这样，函数将只精确地移除所有蒙层，而保留用户上传的图片和其他非蒙层元素。
  const clear_mask = () => {
    if (!fabric_context) return;
    
    // 1. 获取画布上的所有对象
    const allObjects = fabric_context.getObjects();
    
    // 2. 筛选出所有 isMask 属性为 true 的对象
    const maskObjects = allObjects.filter(obj => obj.isMask === true);
    
    // 3. 遍历并只移除被识别为蒙层的对象
    maskObjects.forEach((obj: any) => {
      fabric_context.remove(obj);
    });

    // 4. 请求重新渲染画布以应用更改
    fabric_context.requestRenderAll();
  };
  // [MODIFICATION END]

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
    let site_scale_x = 1;
    let site_scale_y = 1;
    if (window_size?.width > 1450 && window_size?.width < 1550) {
      site_scale_x = 0.88;
      site_scale_y = 0.985;
    } else if (window_size?.width > 1390 && window_size?.width < 1450) {
      site_scale_x = 0.826;
      site_scale_y = 0.97;
    } else if (window_size?.width > 1330 && window_size?.width < 1390) {
      site_scale_x = 0.77;
      site_scale_y = 0.955;
    } else if (window_size?.width < 1330) {
      site_scale_x = 0.915;
      site_scale_y = 0.92;
    }
    return {
      width: `${brushSize * curScale}px`,
      height: `${brushSize * curScale}px`,
      left: `${_x / site_scale_x}px`,
      top: `${_y / site_scale_y}px`,
      transform: 'translate(-50%, -50%)',
    };
  };

  const onBrushChanged = (e) => {
    setBrushSize(e);
    fabric_context.freeDrawingBrush.width = e;
  };

  // [PERSPECTIVE-ADD START] 透视编辑：会话与主流程
  const warpSessionRef = useRef<null | {
    source: any; // 原 fabric.Image
    handles: any[];
    quad: any; // fabric.Polygon
    warpCanvas: HTMLCanvasElement;
    warpImg: any; // fabric.Image(canvas)
    srcEl: HTMLImageElement | HTMLCanvasElement;
    srcW: number;
    srcH: number;
  }>(null);

  // 计算当前四点的包围盒
  function quadBounds(p0: Pt, p1: Pt, p2: Pt, p3: Pt) {
    const xs = [p0.x, p1.x, p2.x, p3.x];
    const ys = [p0.y, p1.y, p2.y, p3.y];
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    return { minX, minY, maxX, maxY, w: Math.ceil(maxX - minX), h: Math.ceil(maxY - minY) };
  }

  function currentQuad(): [Pt, Pt, Pt, Pt] | null {
    const ss = warpSessionRef.current;
    if (!ss) return null;
    const [h0, h1, h2, h3] = ss.handles;
    return [
      { x: h0.left, y: h0.top }, // TL
      { x: h1.left, y: h1.top }, // TR
      { x: h2.left, y: h2.top }, // BR
      { x: h3.left, y: h3.top }, // BL
    ];
  }

// 替换现有的 renderWarp 函数
  // 重新渲染透视画布
  function renderWarp() {
    const ss = warpSessionRef.current;
    if (!ss) return;
    const quad = currentQuad();
    if (!quad) return;
    const [p0, p1, p2, p3] = quad;
    const { minX, minY, w, h } = quadBounds(p0, p1, p2, p3);

    // [PERSPECTIVE-FIX] 同步 fabric.Image 与离屏 canvas 的尺寸，并确保在最上层显示
    const newW = Math.max(2, w);
    const newH = Math.max(2, h);
    if (ss.warpCanvas.width !== newW || ss.warpCanvas.height !== newH) {
      ss.warpCanvas.width = newW;
      ss.warpCanvas.height = newH;

      // 关键：同步 fabric.Image 的 width/height，关闭缓存避免旧缓存裁剪
      ss.warpImg.set({
        left: minX,
        top: minY,
        width: newW,
        height: newH,
        objectCaching: false, // 防止缓存尺寸不一致导致的裁剪
        dirty: true,
      });
      // Fabric 内部也更新一次（不同版本对 <canvas> 源的尺寸同步不一致）
      // @ts-ignore（如果有 TS）
      if (typeof ss.warpImg._setWidthHeight === 'function') ss.warpImg._setWidthHeight();

      ss.warpImg.setCoords();
      fabric_context.bringToFront(ss.warpImg); // 保证在底图之上
    }

    const ctx = ss.warpCanvas.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ss.warpCanvas.width, ss.warpCanvas.height);
    // 使用图像平滑处理，可以获得更好的视觉效果
    ctx.imageSmoothingEnabled = true;

    // 网格三角化：把源矩形拆成小三角，分别做仿射映射到目标四边形
    for (let gy = 0; gy < WARP_GRID; gy++) {
      const ty0 = gy / WARP_GRID,
        ty1 = (gy + 1) / WARP_GRID;
      for (let gx = 0; gx < WARP_GRID; gx++) {
        const tx0 = gx / WARP_GRID,
          tx1 = (gx + 1) / WARP_GRID;

        // 源三角两块（以整张源图坐标）
        const s00 = { x: tx0 * ss.srcW, y: ty0 * ss.srcH };
        const s10 = { x: tx1 * ss.srcW, y: ty0 * ss.srcH };
        const s01 = { x: tx0 * ss.srcW, y: ty1 * ss.srcH };
        const s11 = { x: tx1 * ss.srcW, y: ty1 * ss.srcH };

        // 目标四边形内的双线性插值点（减去 minX/minY 让它落在 warpCanvas 内）
        const d00 = quadLerp(p0, p1, p2, p3, tx0, ty0);
        d00.x -= minX;
        d00.y -= minY;
        const d10 = quadLerp(p0, p1, p2, p3, tx1, ty0);
        d10.x -= minX;
        d10.y -= minY;
        const d01 = quadLerp(p0, p1, p2, p3, tx0, ty1);
        d01.x -= minX;
        d01.y -= minY;
        const d11 = quadLerp(p0, p1, p2, p3, tx1, ty1);
        d11.x -= minX;
        d11.y -= minY;

        // [MODIFICATION START] 解决图像渲染时出现的网格缝隙问题
        // 通过对每个独立的三角形进行微小的扩张，使其互相重叠，从而覆盖渲染缝隙。
        const s_tri1: [Pt, Pt, Pt] = [s00, s10, s11];
        const d_tri1: [Pt, Pt, Pt] = [d00, d10, d11];
        const s_tri2: [Pt, Pt, Pt] = [s00, s11, s01];
        const d_tri2: [Pt, Pt, Pt] = [d00, d11, d01];

        const center1 = {
          x: (d_tri1[0].x + d_tri1[1].x + d_tri1[2].x) / 3,
          y: (d_tri1[0].y + d_tri1[1].y + d_tri1[2].y) / 3,
        };
        const ed_tri1: [Pt, Pt, Pt] = [
          expandFromCenter(d_tri1[0], center1),
          expandFromCenter(d_tri1[1], center1),
          expandFromCenter(d_tri1[2], center1),
        ];
        drawTriangleWarp(ctx, ss.srcEl, s_tri1, ed_tri1);

        const center2 = {
          x: (d_tri2[0].x + d_tri2[1].x + d_tri2[2].x) / 3,
          y: (d_tri2[0].y + d_tri2[1].y + d_tri2[2].y) / 3,
        };
        const ed_tri2: [Pt, Pt, Pt] = [
          expandFromCenter(d_tri2[0], center2),
          expandFromCenter(d_tri2[1], center2),
          expandFromCenter(d_tri2[2], center2),
        ];
        drawTriangleWarp(ctx, ss.srcEl, s_tri2, ed_tri2);
        // [MODIFICATION END]
      }
    }

    ss.warpImg.dirty = true;
    fabric_context.requestRenderAll();

    // [PERSPECTIVE-FIX] 每帧保持 warp 图像在最上层（四角手柄、多边形再置顶）
    fabric_context.bringToFront(ss.warpImg);

    // 更新可视多边形连线
    ss.quad.set({
      points: [
        { x: p0.x, y: p0.y },
        { x: p1.x, y: p1.y },
        { x: p2.x, y: p2.y },
        { x: p3.x, y: p3.y },
      ],
    });
    fabric_context.bringToFront(ss.quad);
    ss.handles.forEach((h) => fabric_context.bringToFront(h));
  }

  async function finishPerspectiveEdit(apply: boolean) {
    const ss = warpSessionRef.current;
    if (!ss) return;
    if (ss?.warpImg) ss.warpImg.set('opacity', 1);

    // 移除辅助元素
    ss.handles.forEach((h) => fabric_context.remove(h));
    fabric_context.remove(ss.quad);
    fabric_context.remove(ss.warpImg); // 移除临时的、不可交互的预览图

    if (apply) {
      // ---- STEP 1: 彻底清理旧的对象 ----
      const oldSource = ss.source;
      if (oldSource && oldSource.canvas) {
        if (oldSource._autoMaskPartner) oldSource.canvas.remove(oldSource._autoMaskPartner);
        if (oldSource._outlinePartner) oldSource.canvas.remove(oldSource._outlinePartner);
        oldSource.off();
        oldSource.canvas.remove(oldSource);
      }
      
      // ---- STEP 2: 创建并添加最终的、可交互的透视图像 ----
      const finalWarpImg = new fabric.Image(ss.warpCanvas, {
        left: ss.warpImg.left,
        top: ss.warpImg.top,
        objectCaching: false, // 建议对这种复杂形变的对象关闭缓存
        selectable: true,
        evented: true,
        uploadImg: true,
      });
      fabric_context.add(finalWarpImg);

      // ---- STEP 3: [FINAL REASONING] 回归标准、统一的伙伴创建流程 ----
      try {
        // 调用全局标准函数创建蒙版
        await createAutoMaskForImage(fabric_context, finalWarpImg);
        
        // 调用全局标准函数创建轮廓线
        await createAndSyncOutline(fabric_context, finalWarpImg, {
          enabled: isOutlineEnabled,
          width: OUTLINE_WIDTH,
          color: OUTLINE_COLOR,
          offset: OUTLINE_OFFSET,
        });
      } catch(e) {
        console.error("Failed to create partners for warped image", e);
      }
      
      set_has_upload_img(true);

    } else {
      // 取消操作: 恢复旧对象可见性
      ss.source.visible = ss.source._wasVisible !== false;
      if (ss.source._autoMaskPartner) ss.source._autoMaskPartner.visible = true;
      if (ss.source._outlinePartner) ss.source._outlinePartner.visible = true;
    }

    warpSessionRef.current = null;
    fabric_context.requestRenderAll();
  }
// [ADD START] 新增功能：下载蒙版图片
  const downloadMaskImage = async () => {
    if (!fabric_context) {
      console.error('Fabric context is not available.');
      return;
    }

    // 1. 筛选出所有 isMask 属性为 true 的蒙版对象
    const allObjects = fabric_context.getObjects();
    const maskObjects = allObjects.filter((obj) => obj.isMask === true);

    // 2. 处理没有蒙版的情况
    if (maskObjects.length === 0) {
      message.info(t('当前没有蒙版'));
      return;
    }

    // 3. 使用临时画布生成纯净的蒙版图片
    const [originalWidth, originalHeight] = origin_wh;
    const tempCanvas = new fabric.StaticCanvas(null, {
      width: originalWidth,
      height: originalHeight,
    });

    // 4. 将蒙版对象克隆到临时画布上
    const clonedMasks = await Promise.all(
      maskObjects.map((obj) => new Promise((resolve) => obj.clone(resolve))),
    );
    
    clonedMasks.forEach((clonedObj: any) => {
      tempCanvas.add(clonedObj);
    });

    // 5. 生成 Data URL
    const dataURL = tempCanvas.toDataURL({
      format: 'png',
      quality: 1,
    });

    // 6. 模仿 downloadImg 的逻辑，触发本地下载
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'mask.png'; // 设置下载的文件名
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 7. 清理临时画布资源
    tempCanvas.dispose();
  };
  // [ADD END]
  function createHandle(x: number, y: number) {
    const h = new fabric.Circle({
      left: x, top: y, radius: 6, originX: 'center', originY: 'center',
      fill: '#fff', stroke: '#1890ff', strokeWidth: 2,
      hasBorders: false, hasControls: false, hoverCursor: 'move'
    });
    h.on('moving', () => renderWarp());

    h.on('mousedown', () => {
      const ss = warpSessionRef.current;
      if (ss?.warpImg) {
        ss.warpImg.set('opacity', editOpacityRef.current);
        fabric_context.requestRenderAll();
      }
    });
    h.on('mouseup', () => {
      const ss = warpSessionRef.current;
      if (ss?.warpImg) {
        ss.warpImg.set('opacity', 1);
        fabric_context.requestRenderAll();
      }
    });

    return h;
  }

  // 开始：对选中的 uploadImg 图片进入透视编辑
  function startPerspectiveEditOn(target: any) {
    if (!fabric_context || !target || target.type !== 'image' || !target.uploadImg) {
      message.info(t('请先选中一张已上传/素材库的图片')); return;
    }
    if (warpSessionRef.current) {
      message.info(t('已在透视编辑中')); return;
    }

    // 原图四角（画布坐标）
    const coords = target.getCoords(); // TL, TR, BR, BL
    const p0 = { x: coords[0].x, y: coords[0].y };
    const p1 = { x: coords[1].x, y: coords[1].y };
    const p2 = { x: coords[2].x, y: coords[2].y };
    const p3 = { x: coords[3].x, y: coords[3].y };

    // 角点与辅助多边形
    const h0 = createHandle(p0.x, p0.y);
    const h1 = createHandle(p1.x, p1.y);
    const h2 = createHandle(p2.x, p2.y);
    const h3 = createHandle(p3.x, p3.y);
    // [CURSOR-FIX START] 透视拉伸手柄：与普通编辑的“形状变化”指针保持一致
    // TL (h0) / BR (h2) 用对角 'nwse-resize'，TR (h1) / BL (h3) 用 'nesw-resize'
    // 同时设置 hoverCursor / moveCursor / downCursor，保证悬停与拖拽时都显示拉伸箭头
    h0.set({ hoverCursor: 'nwse-resize', moveCursor: 'nwse-resize', downCursor: 'nwse-resize' });
    h1.set({ hoverCursor: 'nesw-resize', moveCursor: 'nesw-resize', downCursor: 'nesw-resize' });
    h2.set({ hoverCursor: 'nwse-resize', moveCursor: 'nwse-resize', downCursor: 'nwse-resize' });
    h3.set({ hoverCursor: 'nesw-resize', moveCursor: 'nesw-resize', downCursor: 'nesw-resize' });
    // [CURSOR-FIX END]

    const quad = new fabric.Polygon([p0, p1, p2, p3], {
      fill: 'rgba(24,144,255,0.08)', stroke: '#1890ff', strokeWidth: 1,
      selectable: false, evented: false, objectCaching: false
    });

    fabric_context.add(quad, h0, h1, h2, h3);

    // 构造透视绘制画布与承载图像
    const warpCanvas = document.createElement('canvas');
    // const warpImg = new fabric.Image(warpCanvas, { left: p0.x, top: p0.y, selectable: false, evented: false });
    // [PERSPECTIVE-FIX] 初始就关闭缓存，避免首帧裁剪
    const warpImg = new fabric.Image(warpCanvas, {
      left: p0.x,
      top: p0.y,
      selectable: false,
      evented: false,
      objectCaching: false
    });

    fabric_context.add(warpImg);
    fabric_context.bringToFront(warpImg);

    // 隐藏原图与其自动蒙层
    target._wasVisible = target.visible;
    target.visible = false;
    try { if (target._autoMaskPartner) target._autoMaskPartner.visible = false; } catch(e) {}
    // [ADD] 确保在开始透视编辑时，也隐藏轮廓线。
    try { if (target._outlinePartner) target._outlinePartner.visible = false; } catch(e) {}

    const srcEl: HTMLImageElement | HTMLCanvasElement = (target._element || target._originalElement);
    const srcW = (srcEl as HTMLImageElement).naturalWidth || srcEl.width;
    const srcH = (srcEl as HTMLImageElement).naturalHeight || srcEl.height;

    warpSessionRef.current = {
      source: target,
      handles: [h0, h1, h2, h3],
      quad,
      warpCanvas,
      warpImg,
      srcEl,
      srcW,
      srcH,
    };

    renderWarp();
    fabric_context.discardActiveObject();
    fabric_context.requestRenderAll();
    message.success(t('已进入透视编辑：拖拽四角对齐透视，完成后点“完成透视”'));
  }
  // [PERSPECTIVE-ADD END]


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
                      <Tooltip title={t(v.name)}>{t(v.name)}</Tooltip>
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
                      <Tooltip title={t(v.name)}>{t(v.name)}</Tooltip>
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
                      <img
                        src={
                          v.image + '?imageMogr2/quality/90/format/jpg/interlace/1/thumbnail/512x'
                        }
                      />
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
              >{`${t('确定添加')}（${t('已选')}${active_imgs.length}${t('张')}）`}</div>
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
          disabled: use_polygon || seg_use || do_draw || do_erase || has_upload_img,
          velocityDisabled: true,
        }}
        wheel={{ step: 0.05 }}
        centerZoomedOut
        // centerOnInit
        initialScale={0.5}
        alignmentAnimation={{ disabled: true }}
        limitToBounds={false}
        minScale={0.1}
        doubleClick={{ disabled: true }}
      >
        <TransformComponent>
          <div
            ref={editorContainerRef} // [MODIFICATION] Attach the new ref here
            style={{ position: 'relative', width: '100%', height: '100%' }}
            onMouseMove={onMouseMove}
            onMouseUp={(e: any) => {
            if (!seg_use) {
              return;
            }
            // 1) 必须拿到 fabric 画布实例；拿不到就不做（避免影响其它工具）
            const fc = fabric_context || (fabricRef?.current as any);
            if (!fc || !fc.getPointer) return;

            // 2) 用 Fabric 的指针解析，ignoreZoom=true ⇒ 忽略所有 viewportTransform（缩放/平移）
            //    注意：传入原生事件；在 React 里用 e.nativeEvent
            const pt = fc.getPointer(e.nativeEvent, true); // { x, y }：相对 fabric 内部坐标
            if (!pt) return;

            // 3) 边界保护：禁止留白区域（负值或超出 CSS 显示区域映射）
            //    这里不做“四舍五入前”的裁剪，以避免把边缘点击吞掉；只做极端保护
            if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return;
            // 4) 将 Fabric 内部坐标（显示基准）按“显示→原图”比例映射回原图像素
            //    —— 你的显示区域宽高就是 imageRenderInfo.width/height；
            //       原图像素是 origin_wh[0]/origin_wh[1]
            const dispW = imageRenderInfo?.width || fc.getWidth();    // 显示宽
            const dispH = imageRenderInfo?.height || fc.getHeight();  // 显示高
            const origW = origin_wh?.[0];
            const origH = origin_wh?.[1];
            if (!dispW || !dispH || !origW || !origH) return;

            const originalX = Math.round(pt.x + 1 );
            const originalY = Math.round(pt.y + 1 );

            // 4) 保护：若映射到原图范围之外，直接丢弃（不影响其它工具）
            if (originalX < 0 || originalY < 0 || originalX >= origW || originalY >= origH) return;

            // 5) 调用交互分割：用原图像素坐标 AI 识别服务
            runInteractiveSeg(originalX, originalY);
          }}
          // [MODIFICATION START] 最终、正确的AI点击坐标计算逻辑
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
                // [MODIFICATION START] This is the final and correct logic
                if (!editorContainerRef.current) return;

                const imgEl = e.target;
                const { naturalWidth, naturalHeight } = imgEl;

                // Use the stable, unscaled container dimensions as the source of truth
                const { clientWidth: containerWidth, clientHeight: containerHeight } =
                  editorContainerRef.current;
                
                set_origin_wh([naturalWidth, naturalHeight]);
                set_wh([containerWidth, containerHeight]);

                const hRatio = containerWidth / naturalWidth;
                const vRatio = containerHeight / naturalHeight;
                const scale = Math.min(hRatio, vRatio);

                const scaledWidth = naturalWidth * scale;
                const scaledHeight = naturalHeight * scale;

                const offsetX = (containerWidth - scaledWidth) / 2;
                const offsetY = (containerHeight - scaledHeight) / 2;

                setImageRenderInfo({
                  width: scaledWidth,
                  height: scaledHeight,
                  offsetX: offsetX,
                  offsetY: offsetY,
                  scale: scale,
                });
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
              width={origin_wh[0]}
              height={origin_wh[1]}
              style={{
                // [MODIFICATION START] 动态调整 style 使其完美覆盖可见图片
                position: 'absolute',
                top: `${imageRenderInfo.offsetY}px`,
                left: `${imageRenderInfo.offsetX}px`,
                // [MODIFICATION END]
                zIndex: use_polygon ? 10 : -1,
              }}
            ></canvas>
          </div>
        </TransformComponent>
      </TransformWrapper>
      <div className={'img_editor_btn_container'}>
        {do_draw || do_erase ? (
          <div className="slider" style={{ top: do_draw ? 0 : 0 }}>
            <Slider
              min={MIN_BRUSH_SIZE}
              max={MAX_BRUSH_SIZE}
              onChange={onBrushChanged}
              value={brushSize}
            />
          </div>
        ) : null}
        {/* [EDIT VISUAL FEEDBACK] 编辑透明度滑条：普通编辑 或 透视编辑 时显示 */}
        {(
          warpSessionRef.current ||
          (() => {
            const ao = fabric_context?.getActiveObject?.() as any;
            return !!(ao && ao.type === 'image' && ao.uploadImg === true);
          })()
        ) ? (
          <div className="slider" style={{ top: 44 }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>{t('透明度設定')}</div>
            <Slider
              min={0.1}
              max={1}
              step={0.05}
              value={editOpacity}
              onChange={setEditOpacity}
              tooltip={{ open: false }}
            />
          </div>
        ) : null}

        <div
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
          <Tooltip title={t('涂抹')} placement="left">
            <img src={'/imgs/jubu/位图(3).png'} />
          </Tooltip>
        </div>
        <div
          className={`img_editor_btn ${use_polygon ? 'active_img_editor_btn' : ''}`}
          onClick={clickPolygon}
        >
          <Tooltip title={t('套索')} placement="left">
            <img src={'/imgs/jubu/编组 7.png'} />
          </Tooltip>
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
          <Tooltip title={t('自动识别')} placement="left">
            <img src={'/imgs/jubu/i_dsetting_icon_cloud_aidetection.svg'} />
          </Tooltip>
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
          <Tooltip title={t('蒙层反选')} placement="left">
            <img src={'/imgs/jubu/位图(1).png'} />
          </Tooltip>
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
          <Tooltip title={t('橡皮擦')} placement="left">
            <img src={'/imgs/jubu/位图.png'} />
          </Tooltip>
        </div>
        <div className={`img_editor_btn`} onClick={() => setSucaiVisible(true)}>
          <Tooltip title={t('素材库')} placement="left">
            <img src={'/imgs/jubu/位图(2).png'} />
          </Tooltip>
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
          <Tooltip title={t('上传素材')} placement="left">
            <div className={`img_editor_btn`}>
              <img src={'/imgs/jubu/编组 6.png'} />
            </div>
          </Tooltip>
        </Upload>
        <div className={`img_editor_btn`} onClick={clear_mask}>
          <Tooltip title={t('清空蒙层')} placement="left">
            <img src={'/imgs/jubu/编组 3.png'} />
          </Tooltip>
        </div>

        {/* [ADD START] 轮廓线开关按钮 */}
        {/* <div
          className={`img_editor_btn ${isOutlineEnabled ? 'active_img_editor_btn' : ''}`}
          onClick={() => setOutlineEnabled(!isOutlineEnabled)}
        >
          <Tooltip title={isOutlineEnabled ? t('禁用轮廓线') : t('启用轮廓线')} placement="left">
            <img 
              src={'/imgs/jubu/位图(3).png'} 
              style={{ filter: isOutlineEnabled ? 'none' : 'grayscale(100%)', opacity: isOutlineEnabled ? 1 : 0.6 }} 
              alt={t('轮廓线开关')}
            />
          </Tooltip>
        </div> */}
        {/* [ADD END] */}

        {/* [PERSPECTIVE-ADD START] 透视编辑：按钮 */}
        <div
          className={`img_editor_btn`}
          onClick={() => {
            if (!warpSessionRef.current) {
              const cur = fabric_context?.getActiveObject();
              startPerspectiveEditOn(cur);
            } else {
              // 正在编辑则视为“完成”
              finishPerspectiveEdit(true);
            }
          }}
        >
          <Tooltip title={warpSessionRef.current ? t('完成透视') : t('透视拉伸')} placement="left">
              <img
                src={warpSessionRef.current
                  ? '/imgs/jubu/icon_perspective_done.png'
                  : '/imgs/jubu/icon_perspective_warp.png'}
                alt={warpSessionRef.current ? t('完成透视') : t('透视拉伸')}
              />
          </Tooltip>
        </div>

        {warpSessionRef.current ? (
          <div
            className={`img_editor_btn`}
            onClick={() => finishPerspectiveEdit(false)}
          >
            <Tooltip title={t('取消透视')} placement="left">
              <img src={'/imgs/jubu/icon_perspective_cancel.png'} />
            </Tooltip>
          </div>
        ) : null}
        {/* [PERSPECTIVE-ADD END] 透视编辑：按钮 */}
        {/* [ADD START] 新增功能：下载蒙版按钮 */}
        <div className={`img_editor_btn`} onClick={downloadMaskImage}>
          <Tooltip title={t('下载蒙版')} placement="left">
            {/* 复用一个现有图标，您可以替换为您自己的图标路径 */}
            <img src={'/imgs/jubu/maskdownload.png'} alt={t('下载蒙版')} />
          </Tooltip>
        </div>
        {/* [ADD END] */}

      </div>
    </div>
  );
};
export default forwardRef(ImgEditor);