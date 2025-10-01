import { useRecoilState, useRecoilValue } from 'recoil';
import Editor from './Editor/Editor';
import Toast from './shared/Toast';
import { toastState } from '../store/Atoms';

const Workspace = () => {
  const [toastVal, setToastState] = useRecoilState(toastState);

  return (
    <>
      <Editor />
      {/* <Toast
        {...toastVal}
        onOpenChange={(open: boolean) => {
          setToastState((old) => {
            return { ...old, open };
          });
        }}
      /> */}
    </>
  );
};

export default Workspace;
