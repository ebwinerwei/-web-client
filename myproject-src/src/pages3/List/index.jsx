import { useEffect, useState } from 'react';
import { Input, Checkbox, Button, Select, Pagination, message, Tooltip } from 'antd';
import Header from '@/components/Header';
import PicSlider from '@/components/PicSlider';
import PicSliderMine from '@/components/PicSliderMine';
import { useModel, history, useLocation } from '@umijs/max';
import { getTaskList, delTaskByTaskId } from '@/services/ant-design-pro/api';
import { SearchOutlined } from '@ant-design/icons';
import { t } from '@/utils/lang';
import './index.scss';
import dayjs from 'dayjs';

const tabs = [
  {
    name: t('建筑AI'),
    icon: '/imgs/jianzhu.png',
    id: 1,
    children: [
      {
        title: t('建筑灵感渲染'),
        content: t('建筑草图、手绘图、效果图、白模等，一键渲染，上百种风格可选'),
        path: '/architecturalRender',
        back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E5%BB%BA%E7%AD%91%E6%B8%B2%E6%9F%93/2.jpg',
        forge:
          'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E5%BB%BA%E7%AD%91%E6%B8%B2%E6%9F%93/1.jpeg',
      },
      {
        title: t('景观灵感渲染'),
        content: t('景观草图、手绘图、效果图、白模等，一键渲染，上百种风格可选'),
        path: '/landscapeRender',
        back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E6%99%AF%E8%A7%82%E6%B8%B2%E6%9F%93/Eva_AI_00024_.png',
        forge:
          'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E6%99%AF%E8%A7%82%E6%B8%B2%E6%9F%93/5d26ab96d92394c35711e702672b0e2b.jpeg',
      },
      {
        title: t('效果图洗图'),
        content: t('添加一张氛围参考图，提升底图细节，改变氛围（结构和造型保持一致）'),
        path: '/architecturalXitu',
        back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E6%95%88%E6%9E%9C%E5%9B%BE%E6%B4%97%E5%9B%BE/2.png?imageMogr2/quality/90/format/jpg/interlace/1/thumbnail/512x',
        forge:
          'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E6%95%88%E6%9E%9C%E5%9B%BE%E6%B4%97%E5%9B%BE/1.png?imageMogr2/quality/90/format/jpg/interlace/1/thumbnail/512x',
      },
      {
        title: t('大鸟瞰优化渲染'),
        content: t('城市大鸟瞰、公园大鸟瞰、居住区大鸟瞰等，一键渲染，自动添加细节和色彩搭配'),
        path: '/birdsViewRender',
        back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E5%A4%A7%E9%B8%9F%E7%9E%B0/ComfyUI_00021_.png',
        forge:
          'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E5%A4%A7%E9%B8%9F%E7%9E%B0/c.jpeg',
      },
      {
        title: t('总彩平图渲染'),
        content: t('一键完成对彩平图的渲染'),
        path: '/allPlan',
        back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E6%80%BB%E5%BD%A9%E5%B9%B3%E5%9B%BE/eva_img.jpg',
        forge:
          'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E6%80%BB%E5%BD%A9%E5%B9%B3%E5%9B%BE/qq.jpg',
      },
    ],
  },
  {
    name: t('室内AI'),
    icon: '/imgs/room.png',
    id: 2,
    children: [
      {
        title: t('家装灵感渲染'),
        content: t('客厅、卧室等多个空间，新中式、现代、欧式等三十几种风格，随心所欲渲染'),
        path: '/indoorRender',
        back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%AE%A4%E5%86%85AI/%E5%AE%B6%E8%A3%85%E6%B8%B2%E6%9F%93/2.png?imageMogr2/quality/90/format/jpg/interlace/1/thumbnail/512x',
        forge:
          'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%AE%A4%E5%86%85AI/%E5%AE%B6%E8%A3%85%E6%B8%B2%E6%9F%93/1.webp?imageMogr2/quality/90/format/jpg/interlace/1/thumbnail/512x',
      },
      {
        title: t('工装灵感渲染'),
        content: t('办公室、餐厅、商城、展厅等多个空间，一键渲染'),
        path: '/gongzhuangRender',
        back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%AE%A4%E5%86%85AI/%E5%B7%A5%E8%A3%85/2.png?imageMogr2/quality/90/format/jpg/interlace/1/thumbnail/512x',
        forge:
          'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%AE%A4%E5%86%85AI/%E5%B7%A5%E8%A3%85/1.png?imageMogr2/quality/90/format/jpg/interlace/1/thumbnail/512x',
      },
      // {
      //   title: '室内风格迁移',
      //   content: '保证主体结构不变，色彩和材质重新搭配，使得房间换个风格',
      //   path: '/indoorTransfer',
      //   back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%AE%A4%E5%86%85AI/%E9%A3%8E%E6%A0%BC%E8%BF%81%E7%A7%BB/2.png',
      //   forge:
      //     'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%AE%A4%E5%86%85AI/%E9%A3%8E%E6%A0%BC%E8%BF%81%E7%A7%BB/1.png',
      // },
      // {
      //   title: '室内材质保留渲染',
      //   content: '类似渲染器的渲染，最大程度的保证材质和颜色与底图一致',
      //   path: '/lockImg',
      //   back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%AE%A4%E5%86%85AI/%E6%9D%90%E8%B4%A8%E9%94%81%E5%AE%9A/2.jpg',
      //   forge:
      //     'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%AE%A4%E5%86%85AI/%E6%9D%90%E8%B4%A8%E9%94%81%E5%AE%9A/1.jpg',
      // },
      {
        title: t('室内彩平图'),
        content: t('一键完成对彩平图的渲染'),
        path: '/colorFlatPicture',
        back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%AE%A4%E5%86%85AI/%E5%BD%A9%E5%B9%B3%E5%9B%BE/2.png?imageMogr2/quality/90/format/jpg/interlace/1/thumbnail/512x',
        forge:
          'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%AE%A4%E5%86%85AI/%E5%BD%A9%E5%B9%B3%E5%9B%BE/1.png?imageMogr2/quality/90/format/jpg/interlace/1/thumbnail/512x',
      },
      // {
      //   title: '单体背景填充',
      //   content: '沙发、桌子、椅子等，为其搭配合适的背景氛围',
      //   path: '/indoorExterior',
      //   back: 'https://eva-1313581156.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%AE%A4%E5%86%85AI/%E5%8D%95%E4%BD%93%E8%83%8C%E6%99%AF/2.jpeg',
      //   forge:
      //     'https://eva-1313581156.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%AE%A4%E5%86%85AI/%E5%8D%95%E4%BD%93%E8%83%8C%E6%99%AF/1.png',
      // },
      // {
      //   title: '室内材质贴图替换',
      //   content: '可以对局部的材质，比如地板、桌子、沙发、墙壁等，进行重新渲染',
      //   path: '/materialChange',
      //   back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%AE%A4%E5%86%85AI/%E6%9D%90%E8%B4%A8%E8%B4%B4%E5%9B%BE/2.jpeg',
      //   forge:
      //     'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%AE%A4%E5%86%85AI/%E6%9D%90%E8%B4%A8%E8%B4%B4%E5%9B%BE/1.jpeg',
      // },
    ],
  },
  {
    name: t('通用AI'),
    icon: '/imgs/general.png',
    id: 3,
    children: [
      {
        title: t('清晰度提升'),
        content: t('不仅提升清晰度，同时增加更多细节！'),
        path: '/upScaleImg',
        back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E9%80%9A%E7%94%A8AI/%E6%B8%85%E6%99%B02.png',
        forge:
          'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E9%80%9A%E7%94%A8AI/%E6%B8%85%E6%99%B0%E5%BA%A61.jpeg',
      },
      // {
      //   title: '局部渲染',
      //   content: '选择需要重新渲染的区域，通常用于旧房改造、外景替换、主体风格变化等',
      //   path: '/architecturalPart',
      //   back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E5%BB%BA%E7%AD%91%E5%B1%80%E9%83%A8%E6%B8%B2%E6%9F%93/eva_img%20%283%29.jpg',
      //   forge:
      //     'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E5%BB%BA%E7%AD%91%E5%B1%80%E9%83%A8%E6%B8%B2%E6%9F%93/c215234cc00b4475ebc5c2ad2aa638f8.jpeg',
      // },
      {
        title: t('无损压缩'),
        content: t('按比例缩小图片尺寸'),
        path: '/compress',
        back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E9%80%9A%E7%94%A8AI/%E6%97%A0%E6%8D%9F%E5%8E%8B%E7%BC%A91.png?imageMogr2/quality/90/format/jpg/interlace/1/thumbnail/512x',
        forge:
          'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E9%80%9A%E7%94%A8AI/%E6%97%A0%E6%8D%9F%E5%8E%8B%E7%BC%A92.png?imageMogr2/quality/90/format/jpg/interlace/1/thumbnail/512x',
      },
      {
        title: t('物体移除'),
        content: t('让小物体直接消失，不用再p图'),
        path: '/clean',
        back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E9%80%9A%E7%94%A8AI/%E7%89%A9%E4%BD%93%E7%A7%BB%E9%99%A42.jpg',
        forge:
          'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E9%80%9A%E7%94%A8AI/%E7%89%A9%E4%BD%93%E7%A7%BB%E9%99%A41.jpeg',
      },
      {
        title: t('智能扩图'),
        content: t('自动联想区域，完成对图片内容的扩大'),
        path: '/extendImg',
        back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E9%80%9A%E7%94%A8AI/%E6%89%A9%E5%9B%BE2.jpg',
        forge:
          'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E9%80%9A%E7%94%A8AI/%E6%89%A9%E5%9B%BE1.jpg',
      },
      {
        title: t('一键抠图'),
        content: t('自动扣除单体'),
        path: '/matting',
        back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E9%80%9A%E7%94%A8AI/%E6%8A%A0%E5%9B%BE2.jpg',
        forge:
          'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E9%80%9A%E7%94%A8AI/%E6%8A%A0%E5%9B%BE1.jpg',
      },
    ],
  },
];
const mines = [
  {
    name: t('渲染历史'),
    icon: '/imgs/mine.png',
    id: 4,
  },
];

const vipArr = [
  {
    name: t('AI功能全部可用'),
    icon: '/imgs/vip1.png',
  },
  {
    name: t('图片无限生成'),
    icon: '/imgs/vip2.png',
  },
  {
    name: t('全部超清图片'),
    icon: '/imgs/vip3.png',
  },
  {
    name: t('生图速度加快'),
    icon: '/imgs/vip4.png',
  },
  {
    name: t('批量多图生成'),
    icon: '/imgs/vip5.png',
  },
  {
    name: t('价格只涨不跌'),
    icon: '/imgs/vip6.png',
  },
];
const Login = () => {
  const {
    tickets,
    get_tickets,
    set_start_img,
    list_tab,
    set_list_tab,
    set_result_single_img,
    set_result_imgs,
    active_mine_key,
    set_active_mine_key,
  } = useModel('global');
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const tab = searchParams.get('tab');
  const { setWxLoginVisible, setShowRechargeModal, userInfo } = useModel('loginModel');
  const [showLogin, setShowLogin] = useState(false);
  const [showVip, setShowVip] = useState(false);
  const [countDown, setCountDown] = useState();
  const [discount, setDiscount] = useState(1);
  const [mine_data, set_mine_data] = useState([]);
  const [mine_total, set_mine_total] = useState(50);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    get_tickets();
    set_start_img('');
    set_result_imgs([]);
    set_result_single_img('');

    if (tab) {
      set_list_tab(Number(tab));
    }
  }, []);

  useEffect(() => {
    if (list_tab == 4) {
      get_mine();
    }
  }, [list_tab]);

  useEffect(() => {
    get_mine();
  }, [page, pageSize]);

  const get_mine = async () => {
    const res = await getTaskList({
      pageNo: page,
      pageSize,
    });
    set_mine_data(res.data.list);
    set_mine_total(res.data.total);
  };

  const handleCode = () => {
    if (countDown && count < 60) return;
    let count = 60;
    let timer = setInterval(() => {
      setCountDown(count);
      count--;
      if (count <= 0) {
        clearInterval(timer);
        count = 60;
        setCountDown('');
      }
    }, 1000);
  };

  const onPageChange = (page, pageSize) => {
    setPage(page);
    setPageSize(pageSize);
  };

  const doDelImg = async (item) => {
    console.log('item', item);
    const res = await delTaskByTaskId({ taskId: item.promptId });
    message.success('删除成功');
    get_mine();
  };

  return (
    <>
      <Header />
      <div className="login-wrapper">
        <div className="left-wrapper">
          <div className="login">
            <div className="info">
              <div className="info-top">
                <img
                  src={userInfo?.userId ? userInfo.avatar : '/imgs/user.png'}
                  alt=""
                  className="user"
                />
                <div className="content">
                  <div className="top">
                    {userInfo?.userId ? (
                      <span style={{ fontSize: 14 }}>{userInfo?.nickname}</span>
                    ) : (
                      t('未登录')
                    )}
                    {userInfo?.userId && (userInfo?.type == 1 || userInfo?.type == 2) ? (
                      <img src={'/imgs/iconvip.png'} className="vip-icon" />
                    ) : null}
                  </div>
                  <div className="down">
                    {userInfo?.userId && (userInfo?.type == 1 || userInfo?.type == 2) ? 'VIP' : ''}
                    {t('您好，欢迎登陆')}
                  </div>
                </div>
              </div>
              <div className="line" />
              {userInfo?.type == 2 ? (
                <div className="info-bottom">
                  <img src={'/imgs/icon1.png'} className="icon1" />
                  {t('每日免费渲染次数：无限次')}
                </div>
              ) : null}
              {userInfo?.type == 1 ? (
                <div className="info-bottom">
                  <img src={'/imgs/icon1.png'} className="icon1" />
                  {t('每日免费渲染次数：100次')}
                </div>
              ) : null}
              {userInfo?.type != 1 && userInfo?.type != 2 ? (
                <div className="info-bottom">
                  <img src={'/imgs/icon1.png'} className="icon1" />
                  {t('登陆后，每日免费渲染次数：10次')}
                </div>
              ) : null}
              {userInfo?.userId && userInfo?.type != 2 ? (
                <div className="info-bottom">
                  <img src={'/imgs/count-down.png'} className="icon1" />
                  {t('今日剩余免费渲染次数：')}
                  {tickets}
                  {t('次')}
                </div>
              ) : null}
            </div>
            {!userInfo?.userId ? (
              <div className="btn" onClick={() => setWxLoginVisible(true)}>
                {t('立即登录')}
              </div>
            ) : null}
            {userInfo?.userId && userInfo?.type != 1 && userInfo?.type != 2 ? (
              <div className="btn btn-vip" onClick={() => setShowRechargeModal(true)}>
                <img src={'/imgs/iconvip.png'} className="vip" />{' '}
                {userInfo?.type == 1
                  ? `${dayjs(userInfo.endTime).format('YYYY-MM-DD')}${t('到期，立即续费')}`
                  : t('联系我们')}
              </div>
            ) : null}
            {userInfo?.userId && userInfo?.type == 1 ? (
              <div className="btn btn-vip" onClick={() => setShowRechargeModal(true)}>
                <img src={'/imgs/iconvip.png'} className="vip" />{' '}
                {dayjs(userInfo.endTime).format('YYYY-MM-DD')}
                {t('到期，立即续费')}
              </div>
            ) : null}
            {userInfo?.userId && userInfo?.type == 2 ? (
              <div className="btn btn-vip" onClick={() => setShowRechargeModal(true)}>
                <img src={'/imgs/iconvip.png'} className="vip" />
                {dayjs(userInfo.endTime).format('YYYY-MM-DD')}
                {t('到期')}
              </div>
            ) : null}
          </div>
          <div className="type">
            <div className="title">{t('类型')}</div>
            <div className="type-content">
              {tabs.map((item, index) => {
                return (
                  <>
                    <div
                      className={`item ${index + 1 === list_tab ? 'active' : ''}`}
                      key={index + 10}
                      onClick={() => set_list_tab(index + 1)}
                    >
                      <img src={item.icon} className="icon" />
                      {item.name}
                      {index + 1 === list_tab ? (
                        <i
                          className="iconfont icon-sanjiaoxing"
                          style={{ marginLeft: 80, marginTop: 5 }}
                        />
                      ) : null}
                    </div>
                  </>
                );
              })}
            </div>
          </div>
          <div className="mine">
            <div className="title">{t('我的')}</div>
            <div className="type-content">
              {mines.map((item, index) => {
                return (
                  <div
                    className={`item ${list_tab === 4 ? 'active' : ''}`}
                    key={index}
                    onClick={() => {
                      if (!userInfo?.userId) {
                        setWxLoginVisible(true);
                        return;
                      }
                      set_list_tab(4);
                    }}
                  >
                    <img src={item.icon} className="icon" />
                    {item.name}
                    {list_tab === 4 ? (
                      <i
                        className="iconfont icon-sanjiaoxing"
                        style={{ marginLeft: 80, marginTop: 5 }}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="right-wrapper">
          <div className="type_list">
            {tabs[list_tab - 1]?.children.map((item, index) => {
              return (
                <div key={item.title} className="item">
                  <PicSlider back={item.forge} forge={item.back} width={486} height={290} />
                  <div
                    className="title"
                    onClick={() => {
                      if (!userInfo?.userId) {
                        setWxLoginVisible(true);
                        return;
                      }
                      window.open(item.path);
                    }}
                  >
                    <span>{item.title}</span>
                    <Button type="primary">{t('进入')}</Button>
                  </div>
                  <div
                    className="des"
                    onClick={() => {
                      if (!userInfo?.userId) {
                        setWxLoginVisible(true);
                        return;
                      }
                      window.open(item.path);
                    }}
                  >
                    {item.content}
                  </div>
                </div>
              );
            })}
            {list_tab == 4 ? (
              <div className="mine_list">
                {mine_data?.map((item, index) => {
                  const resultImg_arr = item.resultImg?.split(';');
                  return item.resultImg ? (
                    <div key={item.title} className="item_mine">
                      <img
                        className="item_mine_del"
                        src={'/imgs/icon_sc.png'}
                        onClick={(e) => {
                          e.stopPropagation();
                          doDelImg(item);
                        }}
                      />
                      <img
                        src={resultImg_arr[0]}
                        width={342}
                        height={260}
                        onClick={() => {
                          set_start_img(item.image);
                          if (resultImg_arr.length == 1) {
                            set_result_single_img(resultImg_arr[0]);
                            history.push('/done2?fromlink=history&id=' + item.promptId);
                          } else {
                            set_result_imgs(resultImg_arr);
                            history.push('/done2?fromlink=history&id=' + item.promptId);
                          }
                        }}
                      />
                      <Tooltip
                        title={`${t(item.classifyWord1) || t('无')}${
                          t(item?.classifyWord2) ? '-' : ''
                        }${t(item.classifyWord2) || ''}${t(item?.classifyWord3) ? '-' : ''}${
                          t(item.classifyWord3) || ''
                        }`}
                      >
                        <div
                          className="title"
                          onClick={() => {
                            set_start_img(item.image);
                            if (resultImg_arr.length == 1) {
                              set_result_single_img(resultImg_arr[0]);
                              history.push('/done2?id=' + item.promptId);
                            } else {
                              set_result_imgs(resultImg_arr);
                              history.push('/done2?id=' + item.promptId);
                            }
                          }}
                        >
                          <span>{`${t(item.classifyWord1) || t('无')}${
                            t(item?.classifyWord2) ? '-' : ''
                          }${t(item.classifyWord2) || ''}${t(item?.classifyWord3) ? '-' : ''}${
                            t(item.classifyWord3) || ''
                          }`}</span>
                        </div>
                      </Tooltip>
                    </div>
                  ) : null;
                })}
              </div>
            ) : null}
          </div>
          {list_tab == 4 ? (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 24,
                width: '100%',
                background: '#171717',
                paddingTop: 12,
                display: 'flex',
                width: '100%',
                justifyContent: 'right',
              }}
            >
              <Pagination
                showSizeChanger={false}
                total={mine_total}
                current={page}
                pageSize={pageSize}
                onChange={onPageChange}
              />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default Login;
