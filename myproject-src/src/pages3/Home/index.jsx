import Header from '@/components/Header';
import Icon from '@/components/Icon';
import { Carousel } from 'antd';
import { useModel, history } from '@umijs/max';
import PicSliderHome from '@/components/PicSliderHome';
import { useRef } from 'react';
import { t } from '@/utils/lang';
import './index.scss';

const contentStyle = {
  color: '#fff',
  textAlign: 'center',
  background: '#364d79',
  centerMode: true,
  infinite: true,
  centerPadding: '60px',
  slidesToShow: 3,
  dots: false,
};

const img_list = [
  {
    forge:
      'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/2.jpg',
    back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/22.jpg',
  },
  {
    forge:
      'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/7.jpeg',
    back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/77.jpeg',
  },
  {
    forge:
      'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/9.jpeg',
    back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/99.jpg',
  },
  {
    forge:
      'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/a.jpeg',
    back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/aa.jpg',
  },
];
const img_list2 = [
  {
    forge:
      'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/b.jpeg',
    back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/bb.png',
  },
  {
    forge:
      'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/c.jpeg',
    back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/cc.png',
  },
  {
    back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E5%BB%BA%E7%AD%91%E6%B8%B2%E6%9F%93/2.jpg',
    forge:
      'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E5%BB%BA%E7%AD%91%E6%B8%B2%E6%9F%93/1.jpeg',
  },
  {
    back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E6%99%AF%E8%A7%82%E6%B8%B2%E6%9F%93/Eva_AI_00024_.png',
    forge:
      'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E5%88%97%E8%A1%A8%E9%A1%B5%E5%9B%BE/%E5%BB%BA%E7%AD%91AI/%E6%99%AF%E8%A7%82%E6%B8%B2%E6%9F%93/5d26ab96d92394c35711e702672b0e2b.jpeg',
  },
];
const img_list3 = [
  {
    forge:
      'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/1.jpg',
    back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/11.png',
  },
  {
    forge:
      'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/3.png',
    back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/33.png',
  },
  {
    forge:
      'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/4.jpeg',
    back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/44.jpg',
  },
  {
    forge:
      'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/5.jpg',
    back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/55.png',
  },
];
const img_list4 = [
  {
    forge:
      'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/6.jpg',
    back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/66.png',
  },
  {
    forge:
      'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/8.png',
    back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/88.jpg',
  },
  {
    forge:
      'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/d.png',
    back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/dd.jpg',
  },
  {
    forge:
      'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/e.jpg',
    back: 'https://blue-1304000175.cos.ap-tokyo.myqcloud.com/Eva%E7%9B%B8%E5%85%B3/eva_imgs/web/%E9%A6%96%E9%A1%B5%E5%BE%AA%E7%8E%AF%E5%9B%BE/ee.jpg',
  },
];

const Dashboard = () => {
  const carousel = useRef(null);
  return (
    <>
      <Header />
      <div className="dash-wrapper">
        <div className="text1">{t('建筑室内AI应用社区')}</div>
        <div className="text2">{t('30W设计师已率先使用')}</div>
        <div className="button">{t('立即开启')}</div>
      </div>
      <div className="dash2-bottom">
        <div className="content">
          <div className="title">{t('任意草图 一键渲染')}</div>
          <div className="check" onClick={() => history.push('/list')}>
            {t('立即体验')}&gt;
          </div>
          <div className="carousel-wrapper">
            <Carousel ref={carousel} autoplay dots={false}>
              <div className="imgs_wrap">
                {img_list.map((img, i) => {
                  return (
                    <div className="imgItem" key={i}>
                      <img src={img.forge} />
                      <img src={img.back} />
                    </div>
                  );
                })}
              </div>
              <div className="imgs_wrap">
                {img_list2.map((img, i) => {
                  return (
                    <div className="imgItem" key={i}>
                      <img src={img.forge} />
                      <img src={img.back} />
                    </div>
                  );
                })}
              </div>
              <div className="imgs_wrap">
                {img_list3.map((img, i) => {
                  return (
                    <div className="imgItem" key={i}>
                      <img src={img.forge} />
                      <img src={img.back} />
                    </div>
                  );
                })}
              </div>
              <div className="imgs_wrap">
                {img_list4.map((img, i) => {
                  return (
                    <div className="imgItem" key={i}>
                      <img src={img.forge} />
                      <img src={img.back} />
                    </div>
                  );
                })}
              </div>
            </Carousel>
            <div
              className="left"
              onClick={() => {
                carousel?.current.prev();
              }}
            >
              <span class="iconfont icon-jiantou_xiangzuo"></span>
            </div>
            <div
              className="right"
              onClick={() => {
                carousel?.current.next();
              }}
            >
              <span class="iconfont icon-jiantou_xiangyou"></span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
