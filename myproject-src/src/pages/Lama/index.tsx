import React from 'react';
import { Button } from 'antd';
import Lama from '@/components/Lama';
import { useModel } from '@umijs/max';

const Index: React.FC = () => {
  const { count, set_count } = useModel('global');
  return (
    <div>
      <Lama />
      <Button onClick={() => set_count(count + 1)} style={{ marginTop: 160 }}>
        12345
      </Button>
    </div>
  );
};

export default Index;
