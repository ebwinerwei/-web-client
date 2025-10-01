import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useModel, history, useLocation } from '@umijs/max';
import { downloadImg } from '@/utils';
import { getTaskByTaskId, getTaskList } from '@/services/ant-design-pro/api';
import { QuestionCircleOutlined, DownOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import PicSlider from '@/components/PicSliderDone';
import { useUpdate } from 'ahooks';
import { Divider, message } from 'antd';
import { t } from '@/utils/lang';
import './index.scss';

const path_map = {
  建筑渲染: '/architecturalRender',
  景观渲染: '/landscapeRender',
  大鸟瞰渲染: '/birdsViewRender',
  家装渲染: '/indoorRender',
  工装渲染: '/gongzhuangRender',
  风格迁移: '/indoorTransfer',
  单体背景填充: '/indoorExterior',
  物体移除: '/clean',
  室内材质保留渲染: '/lockImg',
  彩平图: '/colorFlatPicture',
  清晰度提升: '/upScaleImg',
  AI扩图: '/extendImg',
  一键抠图: '/matting',
  总彩平图: '/allPlan',
  局部渲染: '/architecturalPart',
  效果洗图: '/architecturalXitu',
  无损压缩: '/compress',
};

const Done2 = () => {
  const { search } = useLocation();
  const update = useUpdate();

  const searchParams = new URLSearchParams(search);
  const id = searchParams.get('id');
  const history2 = searchParams.get('fromlink');
  const {
    start_img,
    result_imgs,
    result_single_img,
    set_result_single_img,
    function_page,
    allClassify,
    set_check_history_data,
  } = useModel('global');
  const { userInfo } = useModel('loginModel');
  const [img_arr, set_img_arr] = useState([]);
  const [origin_img, set_origin_img] = useState('');
  const [showTab, setShowTab] = useState(false);
  const [img_width, set_img_width] = useState(0);
  const [img_height, set_img_height] = useState(0);
  const [historyTasks, setHistoryTasks] = useState([]);
  const [checkTask, setCheckTask] = useState(0);
  const [checkTaskOriginImg, setCheckTaskOriginImg] = useState('');
  const [checkTaskImgArr, setCheckTaskImgArr] = useState([]);
  const [checkImg, setCheckImg] = useState('');
  const [img_wh, set_img_wh] = useState([0, 0]);
  const [win_scale, set_win_scale] = useState([0, 0]);
  const [do_update, set_do_update] = useState(0);
  const [task_desc, set_task_desc] = useState({});

  useEffect(() => {
    const init = async () => {
      const res = await getTaskByTaskId({ taskId: id });
      const arr = res.data?.resultImg.split(';');
      set_img_arr(arr);
      if (arr.length == 1) {
        setCheckImg(arr[0]);
      }
      set_origin_img(res.data.image);
      set_task_desc(res.data);
    };
    init();

    if (history2 === 'history') {
      setCheckTask(-1);
    }
  }, []);

  useEffect(() => {
    const img = checkTaskOriginImg || origin_img;
    if (img) {
      const imgNode = new Image();
      imgNode.src = img;
      set_img_wh([0, 0]);
      imgNode.onload = () => {
        console.log('图片尺寸:', imgNode.width, 'x', imgNode.height);
        set_img_wh([imgNode.width, imgNode.height]);
      };
    }
  }, [origin_img, checkTaskOriginImg]);

  useEffect(() => {
    const pic = document.querySelector('.picture');
    set_img_width(pic?.offsetWidth);
    set_img_height(pic?.offsetHeight);
    set_win_scale([window.innerWidth - 510, window.innerHeight - 185]);
  }, [origin_img, checkTaskOriginImg, checkImg, img_wh, do_update]);

  useEffect(() => {
    const init = async () => {
      const res = await getTaskList({ pageNo: 1, pageSize: 10 });
      setHistoryTasks(res.data.list);
    };
    init();
  }, []);

  const checkItem = (i) => {
    setCheckImg('');
    if (i == checkTask) {
      return;
    } else {
      setCheckTask(i);
      const arr = historyTasks[i]?.resultImg.split(';');
      set_task_desc(historyTasks[i]);
      setCheckTaskImgArr(arr);
      set_img_arr([]);
      if (arr.length == 1) {
        setCheckImg(arr[0]);
      }
      setCheckTaskOriginImg(historyTasks[i]?.image);
    }
  };

  return (
    <>
      <Header />
      <div className="done2">
        <div className="left">
          <div className="top">
            <div
              className="btn"
              onClick={() => {
                if (checkImg && checkTaskImgArr.length != 1 && img_arr.length != 1) {
                  setCheckImg('');
                } else {
                  const jubu_img = localStorage.getItem('jubu_origin_img');
                  const task_name = task_desc?.classifyWord1;
                  const fetch_img = task_name == t('局部渲染') && jubu_img ? jubu_img : origin_img;
                  localStorage.removeItem('jubu_origin_img');
                  set_check_history_data(task_desc);
                  history.push(path_map[task_desc?.classifyWord1]); // + `?img=${fetch_img}`
                }
              }}
            >
              {checkImg && (checkTaskImgArr.length > 1 || img_arr.length > 1)
                ? t('返回')
                : t('重新渲染')}
            </div>
            <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
              {/* <div
                className="btn btn1"
                onClick={() => {
                  if (!checkImg) {
                    message.info(t('请选择图片'));
                    return;
                  }
                  history.push('/architecturalPart?img=' + checkImg);
                }}
              >
                局部修改
              </div> */}
              <div
                className="btn btn1"
                onClick={() => {
                  if (!checkImg) {
                    message.info(t('请选择图片'));
                    return;
                  }
                  setShowTab(!showTab);
                }}
              >
                {t('继续加工')} <DownOutlined style={{ marginLeft: 0, fontSize: 12 }} />
              </div>
              {showTab ? (
                <div className="continue_down">
                  {[0, 1, 9, 10, 11, 12].includes(function_page) ? (
                    <div
                      onClick={() => {
                        history.push('/architecturalRender?img=' + checkImg);
                      }}
                    >
                      {t('建筑渲染')}
                    </div>
                  ) : null}
                  {[0, 1, 9, 10, 11, 12].includes(function_page) ? (
                    <div
                      onClick={() => {
                        history.push('/landscapeRender?img=' + checkImg);
                      }}
                    >
                      {t('景观渲染')}
                    </div>
                  ) : null}
                  {[2].includes(function_page) ? (
                    <div
                      onClick={() => {
                        history.push('/birdsViewRender?img=' + checkImg);
                      }}
                    >
                      {t('大鸟瞰渲染')}
                    </div>
                  ) : null}
                  {[3, 4, 9, 10, 11, 12].includes(function_page) ? (
                    <div
                      onClick={() => {
                        history.push('/indoorRender?img=' + checkImg);
                      }}
                    >
                      {t('家装渲染')}
                    </div>
                  ) : null}
                  {[3, 4, 9, 10, 11, 12].includes(function_page) ? (
                    <div
                      onClick={() => {
                        history.push('/gongzhuangRender?img=' + checkImg);
                      }}
                    >
                      {t('工装渲染')}
                    </div>
                  ) : null}
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(function_page) ? (
                    <div
                      onClick={() => {
                        history.push('/upScaleImg?img=' + checkImg);
                      }}
                    >
                      {t('清晰度提升')}
                    </div>
                  ) : null}
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(function_page) ? (
                    <div
                      onClick={() => {
                        history.push('/clean?img=' + checkImg);
                      }}
                    >
                      {t('物体移除')}
                    </div>
                  ) : null}
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(function_page) ? (
                    <div
                      onClick={() => {
                        history.push('/extendImg?img=' + checkImg);
                      }}
                    >
                      {t('AI扩图')}
                    </div>
                  ) : null}
                  {/* {[3, 4, 5, 6, 7].includes(function_page) ? (
                    <div
                      onClick={() => {
                        history.push('/indoorTransfer?img=' + checkImg);
                      }}
                    >
                      {t('风格迁移')}
                    </div>
                  ) : null} */}
                  {/* {[3, 4, 5, 6, 7].includes(function_page) ? (
                    <div
                      onClick={() => {
                        history.push('/lockImg?img=' + checkImg);
                      }}
                    >
                      {t('室内材质保留渲染')}
                    </div>
                  ) : null} */}
                </div>
              ) : null}
            </div>
          </div>
          <div className="bottom">
            {checkImg ? (
              <div className="picture single_picture">
                <PicSlider
                  back={checkTaskImgArr.length ? checkTaskOriginImg : origin_img}
                  forge={checkImg}
                  scale={img_wh}
                  win_scale={win_scale}
                  imgLoad={() => {
                    update();
                    set_do_update(do_update + 1);
                  }}
                />
                <div className="download" onClick={() => downloadImg(checkImg, userInfo)}>
                  <img src={'/imgs/icon_ljxz.png'} alt="" className="load" />
                </div>
              </div>
            ) : (
              (checkTaskImgArr.length ? checkTaskImgArr : img_arr).map((img, i) => {
                if (!img_wh[0] || !img_wh[1]) {
                  return null;
                }
                if (i == 2) {
                  return null;
                }
                return (
                  <div className="picture" key={img}>
                    <div
                      className={`checkButton`}
                      onClick={() => {
                        setCheckImg(img);
                      }}
                    >
                      {t('查看大图')}
                    </div>
                    <PicSlider
                      back={checkTaskImgArr.length ? checkTaskOriginImg : origin_img}
                      forge={img}
                      scale={img_wh}
                      win_scale={[win_scale[0] / 2, win_scale[1] / 2]}
                      imgLoad={() => {
                        update();
                        set_do_update(do_update + 1);
                      }}
                    />
                    <div className="download" onClick={() => downloadImg(img, userInfo)}>
                      <img src={'/imgs/icon_ljxz.png'} alt="" className="load" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {checkImg ? null : (
            <div className="bottom" style={{ marginTop: 24 }}>
              {(checkTaskImgArr.length ? checkTaskImgArr : img_arr).map((img, i) => {
                if (!img_wh[0] || !img_wh[1]) {
                  return null;
                }
                if (i != 2) {
                  return null;
                }
                return (
                  <div className="picture" key={img}>
                    <div
                      className={`checkButton`}
                      onClick={() => {
                        setCheckImg(img);
                      }}
                    >
                      {t('查看大图')}
                    </div>
                    <PicSlider
                      back={checkTaskImgArr.length ? checkTaskOriginImg : origin_img}
                      forge={img}
                      scale={img_wh}
                      win_scale={[win_scale[0] / 2, win_scale[1] / 2]}
                      imgLoad={() => {
                        update();
                        set_do_update(do_update + 1);
                      }}
                    />
                    <div className="download" onClick={() => downloadImg(img, userInfo)}>
                      <img src={'/imgs/icon_ljxz.png'} alt="" className="load" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="right">
          <div className="top">
            <div className="title">{`${t(task_desc?.classifyWord1) || t('无')}${
              t(task_desc?.classifyWord2) ? '-' : ''
            }${t(task_desc?.classifyWord2) || ''}${t(task_desc?.classifyWord3) ? '-' : ''}${
              t(task_desc?.classifyWord3) || ''
            }`}</div>
            <div className="sub_title">
              <img src="/imgs/问号.svg" />
              <span>{`${t('与底图相似度：')}${task_desc?.cnStrength || t('无')}`}</span>
            </div>
            <div className="sub_title">
              <img src="/imgs/DTD3.0-智能问答_提示词编排.svg" />
              <span>{`${t('提示词：')}${task_desc?.text || t('无')}`}</span>
            </div>
          </div>
          <Divider dashed style={{ margin: '20px 0', borderColor: 'rgba(255,255,255,0.2)' }} />
          <div className="bottom_header">
            <div className="sub_title">
              <img src="/imgs/油漆桶.svg" />
              <span>{t('渲染记录')}</span>
            </div>
            <div
              className="seeMore"
              onClick={() => {
                window.open('/list?tab=4');
              }}
            >
              {t('查看更多')}
            </div>
          </div>
          <div className="scrollView">
            {historyTasks?.map((v, i) => {
              const arr = v?.resultImg?.split(';');
              return arr?.length ? (
                <div className="imgItem" key={i} onClick={() => checkItem(i)}>
                  <img src={arr[0]} />
                  {checkTask == i ? (
                    <div className="active_img">
                      <img src="/imgs/72act_选择图片库.svg" />
                    </div>
                  ) : null}
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Done2;
