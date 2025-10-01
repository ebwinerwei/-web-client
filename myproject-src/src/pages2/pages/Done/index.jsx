import { useState } from 'react';
import Header from '@/components/Header';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useModel, history } from '@umijs/max';
import PicSlider from '@/components/PicSliderDone';
import { downloadImg } from '@/utils';
import { t } from '@/utils/lang'
import './index.scss';

const DoneContinue = () => {
  const { function_page, start_img, result_single_img, set_result_single_img } = useModel('global');
  const [showTab, setShowTab] = useState(false);
  const [tab, setTab] = useState(0);

  console.log('result_imgs', function_page);
  return (
    <>
      <Header />
      <div className="DoneContinue">
        <div className="top">
          <div
            className="title"
            onClick={() => {
              set_result_single_img('');
              window.history.back();
            }}
          >
            <ArrowLeftOutlined style={{ marginRight: 12, cursor: 'pointer' }} />
            <span>{t('返回上一级')}</span>
          </div>
          <div className="btn">
            <div className="save" onClick={() => downloadImg(result_single_img)}>
              {t('保存')}
            </div>
            <div className="continue" onClick={() => setShowTab(!showTab)}>
              {t('继续加工')}
            </div>
            {showTab ? (
              <div className="continue_down">
                {[0, 1, 2, 3, 4, 5].includes(function_page) ? (
                  <div
                    onClick={() => {
                      history.push('/upScaleImg');
                    }}
                  >
                    {t('清晰度提升')}
                  </div>
                ) : null}
                {[0].includes(function_page) ? (
                  <div
                    onClick={() => {
                      history.push('/architecturalPart');
                    }}
                  >
                    {t('建筑局部渲染')}
                  </div>
                ) : null}
                {[0].includes(function_page) ? (
                  <div
                    onClick={() => {
                      history.push('/materialChange');
                    }}
                  >
                    {t('建筑材质贴图替换')}
                  </div>
                ) : null}
                {[1, 2].includes(function_page) ? (
                  <div
                    onClick={() => {
                      history.push('/materialChange');
                    }}
                  >
                    {t('室内材质贴图替换')}
                  </div>
                ) : null}
                {[0, 1, 2, 4, 5].includes(function_page) ? (
                  <div
                    onClick={() => {
                      history.push('/extendImg');
                    }}
                  >
                    {t('AI扩图')}
                  </div>
                ) : null}
                {[1].includes(function_page) ? (
                  <div
                    onClick={() => {
                      history.push('/indoorTransfer');
                    }}
                  >
                    {t('风格迁移')}
                  </div>
                ) : null}
                {[4].includes(function_page) ? (
                  <div
                    onClick={() => {
                      history.push('/clean');
                    }}
                  >
                    {t('物体移除')}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className="bottom">
          <div className="picture">
            <PicSlider
              back={result_single_img}
              forge={start_img.includes('http') ? start_img : `https://${start_img}`}
              width={'100%'}
              height={'100%'}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DoneContinue;
