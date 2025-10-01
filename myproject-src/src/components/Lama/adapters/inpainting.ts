import { PluginName } from '../components/Plugins/Plugins';
import { ControlNetMethodMap, Rect, Settings } from '../store/Atoms';
import { dataURItoBlob, loadImage, srcToFile } from '../utils';
import { clickMask } from '@/services/ant-design-pro/api';
import { api } from '@/utils/api';

// export const API_ENDPOINT = `${process.env.REACT_APP_INPAINTING_URL}`;
export const API_ENDPOINT = `http://localhost:8089`;

export default async function inpaint(
  imageFile: File,
  settings: Settings,
  croperRect: Rect,
  prompt?: string,
  negativePrompt?: string,
  seed?: number,
  maskBase64?: string,
  customMask?: File,
  paintByExampleImage?: File,
) {
  // 1080, 2000, Original
  const fd = new FormData();
  fd.append('image', imageFile);
  if (maskBase64 !== undefined) {
    fd.append('mask', dataURItoBlob(maskBase64));
  } else if (customMask !== undefined) {
    fd.append('mask', customMask);
  }

  const hdSettings = settings.hdSettings[settings.model];
  fd.append('ldmSteps', settings.ldmSteps.toString());
  fd.append('ldmSampler', settings.ldmSampler.toString());
  fd.append('zitsWireframe', settings.zitsWireframe.toString());
  fd.append('hdStrategy', hdSettings.hdStrategy);
  fd.append('hdStrategyCropMargin', hdSettings.hdStrategyCropMargin.toString());
  fd.append('hdStrategyCropTrigerSize', hdSettings.hdStrategyCropTrigerSize.toString());
  fd.append('hdStrategyResizeLimit', hdSettings.hdStrategyResizeLimit.toString());

  fd.append('prompt', prompt === undefined ? '' : prompt);
  fd.append('negativePrompt', negativePrompt === undefined ? '' : negativePrompt);
  fd.append('croperX', croperRect.x.toString());
  fd.append('croperY', croperRect.y.toString());
  fd.append('croperHeight', croperRect.height.toString());
  fd.append('croperWidth', croperRect.width.toString());
  fd.append('useCroper', settings.showCroper ? 'true' : 'false');

  fd.append('sdMaskBlur', settings.sdMaskBlur.toString());
  fd.append('sdStrength', settings.sdStrength.toString());
  fd.append('sdSteps', settings.sdSteps.toString());
  fd.append('sdGuidanceScale', settings.sdGuidanceScale.toString());
  fd.append('sdSampler', settings.sdSampler.toString());
  fd.append('sdSeed', seed ? seed.toString() : '-1');
  fd.append('sdMatchHistograms', settings.sdMatchHistograms ? 'true' : 'false');
  fd.append('sdScale', (settings.sdScale / 100).toString());

  fd.append('cv2Radius', settings.cv2Radius.toString());
  fd.append('cv2Flag', settings.cv2Flag.toString());

  fd.append('paintByExampleSteps', settings.paintByExampleSteps.toString());
  fd.append('paintByExampleGuidanceScale', settings.paintByExampleGuidanceScale.toString());
  fd.append('paintByExampleSeed', seed ? seed.toString() : '-1');
  fd.append('paintByExampleMaskBlur', settings.paintByExampleMaskBlur.toString());
  fd.append(
    'paintByExampleMatchHistograms',
    settings.paintByExampleMatchHistograms ? 'true' : 'false',
  );
  // TODO: resize image's shortest_edge to 224 before pass to backend, save network time?
  // https://huggingface.co/docs/transformers/model_doc/clip#transformers.CLIPImageProcessor
  if (paintByExampleImage) {
    fd.append('paintByExampleImage', paintByExampleImage);
  }

  // InstructPix2Pix
  fd.append('p2pSteps', settings.p2pSteps.toString());
  fd.append('p2pImageGuidanceScale', settings.p2pImageGuidanceScale.toString());
  fd.append('p2pGuidanceScale', settings.p2pGuidanceScale.toString());

  // ControlNet
  fd.append('controlnet_conditioning_scale', settings.controlnetConditioningScale.toString());
  fd.append('controlnet_method', ControlNetMethodMap[settings.controlnetMethod.toString()]);

  try {
    const res = await fetch(`${API_ENDPOINT}/inpaint`, {
      method: 'POST',
      body: fd,
    });
    if (res.ok) {
      const blob = await res.blob();
      const newSeed = res.headers.get('x-seed');
      return { blob: URL.createObjectURL(blob), seed: newSeed };
    }
    const errMsg = await res.text();
    throw new Error(errMsg);
  } catch (error) {
    throw new Error(`Something went wrong: ${error}`);
  }
}

export function getServerConfig() {
  return fetch(`${API_ENDPOINT}/server_config`, {
    method: 'GET',
  });
}

export function switchModel(name: string) {
  const fd = new FormData();
  fd.append('name', name);
  return fetch(`${API_ENDPOINT}/model`, {
    method: 'POST',
    body: fd,
  });
}

export function currentModel() {
  return fetch(`${API_ENDPOINT}/model`, {
    method: 'GET',
  });
}

export function isDesktop() {
  return fetch(`${API_ENDPOINT}/is_desktop`, {
    method: 'GET',
  });
}

export function modelDownloaded(name: string) {
  return fetch(`${API_ENDPOINT}/model_downloaded/${name}`, {
    method: 'GET',
  });
}

const getImagedataFromImageClass = (Image, width, height) => {
  // Create a original size element and draw the image onto it
  let tmpcanvas = document.createElement('canvas');
  tmpcanvas.width = width;
  tmpcanvas.height = height;
  let tmpcontext = tmpcanvas.getContext('2d');

  tmpcontext.drawImage(Image, 0, 0);

  // Get the image data from the canvas
  let imageData = tmpcontext.getImageData(0, 0, tmpcanvas.width, tmpcanvas.height);
  let pixelData = imageData.data;

  const imageMask = maskcontext.getImageData(0, 0, tmpcanvas.width, tmpcanvas.height);
  const data = imageMask.data;

  let pixels = [];
  // Get the pixel indices of the mask
  for (let i = 0; i < pixelData.length; i += 4) {
    if (pixelData[i] == 255 && pixelData[i + 1] == 255 && pixelData[i + 2] == 255) {
      pixels.push(i);
    }
  }

  // Create a canvas size element and draw the image onto it
  tmpcanvas = document.createElement('canvas');
  tmpcanvas.width = width;
  tmpcanvas.height = height;
  tmpcontext = tmpcanvas.getContext('2d');

  tmpcontext.drawImage(Image, 0, 0, tmpcanvas.width, tmpcanvas.height);

  // Get the image data from the canvas
  imageData = tmpcontext.getImageData(0, 0, tmpcanvas.width, tmpcanvas.height);
  pixelData = imageData.data;

  return imageData.data;
};

async function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas to Blob conversion failed'));
      }
    });
  });
}

async function blobToByteArray(blob) {
  return new Uint8Array(await new Response(blob).arrayBuffer());
}

export async function runPlugin(
  name: string,
  image: any,
  upscale?: number,
  maskFile?: File | null,
  clicks?: number[][],
  imageWidth?: number,
  imageHeight?: number,
) {
  const fd = new FormData();
  if (clicks) {
    const click_list_arr = [] as any[];
    const type_arr = [] as any[];
    clicks.forEach((click) => {
      click_list_arr.push(click[0]);
      click_list_arr.push(click[1]);
      if (click[2] == 1) {
        type_arr.push('1');
      } else if (click[2] == 0) {
        type_arr.push('0');
      }
    });
    const res = await clickMask({
      imgUrl: `https://${image}`,
      type: type_arr.join(','),
      clickList: click_list_arr.join(','),
    });
    if (!res.data.masks) {
      throw new Error('Network response was not ok');
    }
    localStorage.setItem('gpuId', res.data.gpuId);
    // const byteCharacters = atob(`data:image/png;base64,${data.masks}`);
    const byteCharacters = atob(res.data.masks);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    return { blob: URL.createObjectURL(blob) };
  }
  fd.append('name', name);
  fd.append('image', imageFile);
  if (upscale) {
    fd.append('upscale', upscale.toString());
  }
  if (maskFile) {
    fd.append('mask', maskFile);
  }

  try {
    const res = await fetch(`${API_ENDPOINT}/run_plugin`, {
      method: 'POST',
      body: fd,
    });
    if (res.ok) {
      const blob = await res.blob();
      return { blob: URL.createObjectURL(blob) };
    }
    const errMsg = await res.text();
    throw new Error(errMsg);
  } catch (error) {
    throw new Error(`Something went wrong: ${error}`);
  }
}

export async function getMediaFile(tab: string, filename: string) {
  const res = await fetch(`${API_ENDPOINT}/media/${tab}/${encodeURIComponent(filename)}`, {
    method: 'GET',
  });
  if (res.ok) {
    const blob = await res.blob();
    const file = new File([blob], filename);
    return file;
  }
  const errMsg = await res.text();
  throw new Error(errMsg);
}

export async function getMedias(tab: string) {
  const res = await fetch(`${API_ENDPOINT}/medias/${tab}`, {
    method: 'GET',
  });
  if (res.ok) {
    const filenames = await res.json();
    return filenames;
  }
  const errMsg = await res.text();
  throw new Error(errMsg);
}

export async function downloadToOutput(
  image: HTMLImageElement,
  filename: string,
  mimeType: string,
) {
  const file = await srcToFile(image.src, filename, mimeType);
  const fd = new FormData();
  fd.append('image', file);
  fd.append('filename', filename);

  try {
    const res = await fetch(`${API_ENDPOINT}/save_image`, {
      method: 'POST',
      body: fd,
    });
    if (!res.ok) {
      const errMsg = await res.text();
      throw new Error(errMsg);
    }
  } catch (error) {
    throw new Error(`Something went wrong: ${error}`);
  }
}

export async function makeGif(
  originFile: File,
  cleanImage: HTMLImageElement,
  filename: string,
  mimeType: string,
) {
  const cleanFile = await srcToFile(cleanImage.src, filename, mimeType);
  const fd = new FormData();
  fd.append('name', PluginName.MakeGIF);
  fd.append('image', originFile);
  fd.append('clean_img', cleanFile);
  fd.append('filename', filename);

  try {
    const res = await fetch(`${API_ENDPOINT}/run_plugin`, {
      method: 'POST',
      body: fd,
    });
    if (!res.ok) {
      const errMsg = await res.text();
      throw new Error(errMsg);
    }

    const blob = await res.blob();
    const newImage = new Image();
    await loadImage(newImage, URL.createObjectURL(blob));
    return newImage;
  } catch (error) {
    throw new Error(`Something went wrong: ${error}`);
  }
}
