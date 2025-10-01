import JSZip from 'jszip';
import FileSaver from 'file-saver';
import axios from 'axios';
import { history } from '@umijs/max';
import { t } from '@/utils/lang'
import { now } from 'lodash';

export function getQueryVariable(url: string, variable: string) {
  var query = url.split('?')[1];
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (pair[0] == variable) {
      return pair[1];
    }
  }
  return false;
}

export function strPromptedit_nouse(txtprompt) {
  var newPrompttxt = txtprompt.replaceAll('、', ',').replaceAll('，', ',');
  newPrompttxt = newPrompttxt.replaceAll('：', ':').replaceAll('：', ':');
  newPrompttxt = newPrompttxt.replaceAll('（', '(').replaceAll('（', '(');
  newPrompttxt = newPrompttxt.replaceAll('）', ')').replaceAll('）', ')');
  
  newPrompttxt = newPrompttxt.replace(/,+/g, ',');

  var lastChar = newPrompttxt.slice(-1);
  if (',' == lastChar) {
    newPrompttxt = newPrompttxt.slice(0, -1);
    //console.log('newPrompttxt::', newPrompttxt);
  }
  
  var words = newPrompttxt.split(',');
  var strss= '';
  for (var i=0; i<words.length; i++) {
    if(words[i].includes(':') || 
       words[i].includes('(') ||
       words[i].includes(')') ||
       words[i].includes('[') ||
       words[i].includes(']') ||
       words[i].includes('{') ||
       words[i].includes('}')){}
    else{words[i]= '(' + words[i]+ ':1.2)';}

    if(i==0){strss = words[i]; }
    else{strss += ',' + words[i];}
  }

  return strss;
};

export function strPromptedit(txtprompt) {
  var newPrompttxt = txtprompt.replaceAll('、', ',').replaceAll('，', ',');
  newPrompttxt = newPrompttxt.replaceAll('：', ':').replaceAll('：', ':');
  newPrompttxt = newPrompttxt.replaceAll('（', '(').replaceAll('（', '(');
  newPrompttxt = newPrompttxt.replaceAll('）', ')').replaceAll('）', ')');
  newPrompttxt = newPrompttxt.replaceAll('[', '').replaceAll(']', '');
  newPrompttxt = newPrompttxt.replaceAll('{', '').replaceAll('}', '');
  
  newPrompttxt = newPrompttxt.replace(/,+/g, ',');

  var lastChar = newPrompttxt.slice(-1);
  if (',' == lastChar) {
    newPrompttxt = newPrompttxt.slice(0, -1);
     }

 // if (',' != lastChar) {
 //   newPrompttxt += ',';
 // }


 // console.log('newPrompttxt::', newPrompttxt);

  return newPrompttxt;
};

export function getFileNameFromURL(url: string) {
  // 使用正则表达式匹配URL中的文件名部分
  var matches = url.match(/\/([^\/?#]+)[^\/]*$/);

  // 如果有匹配，则返回匹配的文件名，否则返回空字符串
  return matches ? matches[1] : '';
}

// 同步forEach请求
export const customForeach = async (
  arr: any[],
  callback: (v: any, i: number, arr: any[]) => void,
) => {
  const length = arr.length;
  const O = Object(arr);
  let k = 0;
  while (k < length) {
    if (k in O) {
      const kValue = O[k];
      await callback(kValue, k, O);
    }
    k++;
  }
};

// 设置cookie
export const setCookie = (cname: string, cvalue: string, exdays: number, domain: string) => {
  var d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  var expires = 'expires=' + d.toUTCString();
  domain = domain ? `domain = ${domain};` : '';
  document.cookie = `${cname}=${cvalue};${expires};${domain}path=/`;
};

// 获取cookie
export const getCookie = (cname: string) => {
  var name = cname + '=';
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
};

export const clearCookie = (name: string) => {
  setCookie(name, '', -1, '.znztv.com');
};

// 判断是否是mac系统
export const isMac = () => navigator.appVersion.includes('Mac OS X');

// 判断浏览器类型
export const BrowserType = () => {
  var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
  var isOpera = userAgent.indexOf('Opera') > -1; //判断是否Opera浏览器
  var isIE = userAgent.indexOf('compatible') > -1 && userAgent.indexOf('MSIE') > -1 && !isOpera; //判断是否IE浏览器
  var isEdge = userAgent.indexOf('Edge') > -1; //判断是否IE的Edge浏览器
  var isFF = userAgent.indexOf('Firefox') > -1; //判断是否Firefox浏览器
  var isSafari = userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') == -1; //判断是否Safari浏览器
  var isChrome = userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Safari') > -1; //判断Chrome浏览器

  if (!!window.ActiveXObject || 'ActiveXObject' in window) {
    return 'IE';
  }
  if (isIE) {
    return 'IE';
  }
  if (isEdge) {
    return 'Edge';
  }
  if (isFF) {
    return 'FF';
  }
  if (isOpera) {
    return 'Opera';
  }
  if (isSafari) {
    return 'Safari';
  }
  if (isChrome) {
    return 'Chrome';
  }
};

const getFile = (url: string) => {
  return new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url,
      responseType: 'arraybuffer',
    })
      .then((data) => {
        resolve(data.data);
      })
      .catch((error) => {
        reject(error.toString());
      });
  });
};

const downLoadImgs = async (imgs: string[], dir?: string) => {
  const data = imgs;
  const zip = new JSZip();
  const cache = {} as any;
  const promises = [] as any[];
  await data.forEach((item, index) => {
    const promise = getFile(
      `${item.replace('http:', 'https')}${
        item?.includes('?') ? '' : '?x-oss-process=image/format,jpg/resize,p_100'
      }`,
    ).then((data: any) => {
      const arr_name = item.split('/');
      let suffix = arr_name[arr_name.length - 1]?.split('.')[1];
      zip.file(`${index}.${suffix}`, data, {
        binary: true,
      }); // 逐个添加文件
      cache[`${index}.${suffix}`] = data;
    });
    promises.push(promise);
  });
  Promise.all(promises).then(() => {
    zip
      .generateAsync({
        type: 'blob',
      })
      .then((content) => {
        FileSaver.saveAs(content, dir ? `${dir}.zip` : 'photo.zip');
      });
  });
};

// 非同源图片下载
const downloadSingleImg = (src: string) => {
  if (['IE', 'Edge'].includes(BrowserType() ?? '')) {
    downLoadImgs([src]);
    return;
  }
  var canvas = document.createElement('canvas');
  var img = document.createElement('img');
  img.onload = function (e) {
    canvas.width = img.width;
    canvas.height = img.height;
    var context = canvas.getContext('2d');
    context?.drawImage(img, 0, 0, img.width, img.height);
    canvas?.getContext('2d')?.drawImage(img, 0, 0, img.width, img.height);
    canvas.toBlob((blob) => {
      let link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = generatefilename();
      link.click();
    }, 'image/png');
  };
  img.setAttribute('crossOrigin', 'Anonymous');
  img.src = src;
};

// 下载图片
export const downloadImg = (payload: string[] | string, userInfo: any, dir?: string) => {
  if (typeof payload === 'string') {
    downloadSingleImg(`${payload}`);
  } else {
    downLoadImgs(payload, dir);
  }
};

// 获取当前的页面名称
export const getPageName = () => {
  const {
    location: { pathname, hash },
  } = history;
  const links = pathname.split('/');
  const classifyTags = links[links.length - 1]?.split('-');
  const classify = classifyTags?.[0] ?? null;
  const secondClassify = classifyTags?.[1] ?? null;
  const thirdClassify = classifyTags?.[2] ?? null;
  if (pathname == '/') {
    return t('首页');
  } else if (pathname.includes('agreement')) {
    return t('协议页');
  } else if (
    pathname.includes('authorInspirationhome') ||
    pathname.includes('insHomeByCreate') ||
    pathname.includes('insHomeByCollect')
  ) {
    return t('图集详情页');
  } else if (pathname.includes('insHomeByCreate')) {
    return t('我创建的图集详情页');
  } else if (pathname.includes('insHomeByCollect')) {
    return t('我收藏的图集详情页');
  } else if (pathname.includes('insHomeByCase')) {
    return t('案例详情页');
  } else if (pathname.includes('searchCase')) {
    return t('搜索页');
  } else if (pathname.includes('moreCollections')) {
    return t('更多图集页');
  } else if (pathname.includes('myDownloads')) {
    return t('我的下载页面');
  } else if (pathname.includes('similar')) {
    return t('相似推荐页');
  } else if (pathname.includes('casemineByCreate')) {
    return t('我的主页-创建');
  } else if (pathname.includes('casemineByCollect')) {
    return t('我的主页-收藏');
  } else if (pathname.includes('casemineByCase')) {
    return t('我的主页-案例');
  } else if (pathname.includes('classifyPage')) {
    if (thirdClassify) {
      return `${t('三级分类页-分类id')}:${thirdClassify}`;
    } else if (secondClassify) {
      return `${t('二级分类页-分类id')}:${secondClassify}`;
    } else {
      return `${t('一级分类页-分类id')}:${classify}`;
    }
  } else if (pathname.includes('tupianHome')) {
    return t('图片首页');
  } else if (pathname.includes('caseHome')) {
    return t('案例首页');
  } else if (pathname.includes('aiToolPage')) {
    return t('AI室内工具');
  } else if (pathname.includes('anliSearch')) {
    return t('案例搜索页');
  } else if (pathname.includes('classifyCase')) {
    return t('案例分类页');
  } else if (pathname.includes('authorHomePage')) {
    return t('案例作者页');
  } else if (pathname.includes('seachInspiration')) {
    return t('图集列表页');
  } else if (pathname.includes('landing')) {
    return t('承接页');
  } else if (pathname.includes('myPersonCenter')) {
    return t('我的个人中心');
  } else if (pathname.includes('otherPersonCenter')) {
    return t('他人主页');
  } else if (pathname.includes('qaPage')) {
    return t('帮助中心');
  } else if (pathname.includes('findPage')) {
    return t('发现页');
  } else if (hash) {
    return t('图片详情页');
  } else {
    return t('未知页面');
  }
};

// 判断浏览器是否支持webp
export const isSupportWebp = () => {
  try {
    return (
      document.createElement('canvas').toDataURL('image/webp', 0.5).indexOf('data:image/webp') === 0
    );
  } catch (error) {
    return false;
  }
};

// 秒转换为日时分秒
export const convertTime = (time: number) => ({
  day: Math.floor(time / 60 / 60 / 24),
  hour: Math.floor(time / 60 / 60) % 24,
  minute: Math.floor(time / 60) % 60,
  second: Math.floor(time) % 60,
});

export const toThousands = (num: number | string[]) => {
  var result = [],
    counter = 0;
  num = (num || 0).toString().split('');
  for (var i = num.length - 1; i >= 0; i--) {
    counter++;
    result.unshift(num[i]);
    if (!(counter % 3) && i != 0) {
      result.unshift(',');
    }
  }
  return result.join('');
};

// 生成用户唯一标识
export const generateUUID = () => {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
};

// 生成下载文件名
export const generatefilename = () => {
  var date = new Date();
  const str = date.toISOString().replace(/[^0-9]/g, '');  
  return 'ai-design-' + str;
};

// 打开新网页（防拦截）
export const openURL = (url: string, id: string) => {
  fetch('https://www.baidu.com')
    .then(function (response) {
      let a = document.createElement('a');
      a.setAttribute('target', '_blank');
      a.setAttribute('href', url);
      a.setAttribute('id', id);
      // 防止反复添加
      if (!document.getElementById(id)) {
        document.body.appendChild(a);
      }
      a.click();
    })
    .catch((err) => {
      let a = document.createElement('a');
      a.setAttribute('target', '_blank');
      a.setAttribute('href', url);
      a.setAttribute('id', id);
      // 防止反复添加
      if (!document.getElementById(id)) {
        document.body.appendChild(a);
      }
      a.click();
    });
};

export class cookieStorage {
  static setItem(key: string, value: string) {
    setCookie(key, value, 1000, '.znztv.com');
  }
  static getItem(key: string) {
    return getCookie(key);
  }
  static removeItem(key: string) {
    clearCookie(key);
  }
}

const IS_SUPPORT_WEBP = isSupportWebp();

export const imgSuffix = (w: number, h: number) => {
  return IS_SUPPORT_WEBP
    ? `?x-oss-process=image/auto-orient,1/resize,m_fill,w_${w},h_${h},limit_0/quality,q_100/format,webp`
    : `?x-oss-process=image/auto-orient,1/resize,m_fill,w_${w},h_${h},limit_0/quality,q_100/format,jpg`;
};

// 个人中心内容转化人数/次数(埋点)
export const personcenterContentConversionGio = (e$: any, isNew: boolean) => {
  if (
    document.referrer.includes('/myPersonCenter/') ||
    document.referrer.includes('/otherPersonCenter/') ||
    location.pathname.includes('/myPersonCenter/') ||
    location.pathname.includes('/otherPersonCenter/')
  ) {
    const page = localStorage.getItem('linggan_personCenter_page');
    if (page) e$.emit({ key: 69, data: isNew, data2: page });
  }
};

export const dateFormat = (date: Date, fmt: string = 'YYYY-mm-dd HH:MM') => {
  let ret;
  const opt = {
    'Y+': date.getFullYear().toString(), // 年
    'm+': (date.getMonth() + 1).toString(), // 月
    'd+': date.getDate().toString(), // 日
    'H+': date.getHours().toString(), // 时
    'M+': date.getMinutes().toString(), // 分
    'S+': date.getSeconds().toString(), // 秒
  };
  for (let k in opt) {
    ret = new RegExp('(' + k + ')').exec(fmt);
    if (ret) {
      fmt = fmt.replace(ret[1], ret[1].length == 1 ? opt[k] : opt[k].padStart(ret[1].length, '0'));
    }
  }
  return fmt;
};

export const getToday = () => {
  var date = new Date();

  var year = date.getFullYear().toString();
  var month = (date.getMonth() + 1).toString();
  var day = date.getDate().toString();

  return year + '-' + month + '-' + day;
};
