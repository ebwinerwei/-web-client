import { useState } from 'react';
import './index.scss';
const Index: React.FC = (props: any) => {
  const { back, forge, width, height } = props;
  const [sliderValue, setSliderValue] = useState(5000); // 初始值为50，范围0-100

  function handleSliderChange(event) {
    setSliderValue(event.target.value);
  }

  return (
    <div className="container_home" style={{ width: width, height: height }}>
      <div
        className="img background-img"
        style={{ backgroundImage: `url('${back}')`, backgroundSize: `${width}px 100%` }}
      ></div>
      <div
        className="img foreground-img"
        style={{
          width: `${sliderValue / 100}%`,
          backgroundImage: `url('${forge}')`,
          backgroundSize: `${width}px 100%`,
        }}
      ></div>
      <input
        type="range"
        min="1"
        max="10000"
        value={sliderValue}
        className="slider"
        name="slider"
        onChange={handleSliderChange}
      />
      <div className="slider-button" style={{ left: `calc(${sliderValue / 100}% - 10px)` }}></div>
    </div>
  );
};

export default Index;
