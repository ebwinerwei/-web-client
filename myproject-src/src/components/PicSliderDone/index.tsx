import { useState } from 'react';
import './index.scss';
const Index: React.FC = (props: any) => {
  const { back, forge, scale, win_scale, imgLoad } = props;
  const [sliderValue, setSliderValue] = useState(500); // 初始值为50，范围0-100
  const [img_width, set_img_width] = useState(10);
  const [img_height, set_img_height] = useState(10);

  function handleSliderChange(event) {
    setSliderValue(event.target.value);
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <div className="container" style={{ width: img_width, height: img_height }}>
        {scale[0] == 0 ? null : (
          <img
            src={forge}
            style={{ display: 'none' }}
            onLoad={(e: any) => {
              console.log('scale', scale, win_scale);
              if (scale[0] / scale[1] > win_scale[0] / win_scale[1]) {
                // 宽大于高
                let height = (e.target.height * win_scale[0]) / e.target.width;
                set_img_width(win_scale[0]);
                set_img_height(height);
              } else {
                // 高大于宽
                let width = (win_scale[1] / e.target.height) * e.target.width;
                set_img_width(width);
                set_img_height(win_scale[1]);
              }
              imgLoad(1);
            }}
          />
        )}
        <div
          className="img background-img"
          style={{ backgroundImage: `url('${back}')`, backgroundSize: `auto 100%` }}
        ></div>
        <div
          className="img foreground-img"
          style={{
            width: `${sliderValue / 10}%`,
            backgroundColor:'#000000',
            backgroundImage: `url('${forge}')`,
            backgroundSize: `auto 100%`,
            borderRight: '2px solid #FF0000',
          }}
        ></div>
        <input
          type="range"
          min="1"
          max="1000"
          value={sliderValue}
          className="slider2"
          name="slider"
          onChange={handleSliderChange}
        />
        <div className="slider-button" style={{ left: `calc(${sliderValue / 10}% - 16px)` }}></div>
      </div>
    </div>
  );
};

export default Index;
