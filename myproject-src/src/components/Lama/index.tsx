import 'hacktimer';
import React from 'react';
import './styles/_index.scss';
import { RecoilRoot } from 'recoil';
import App from './App';

const Lama: React.FC = () => {
  return (
    <RecoilRoot>
      <App />
    </RecoilRoot>
  );
};

export default Lama;
