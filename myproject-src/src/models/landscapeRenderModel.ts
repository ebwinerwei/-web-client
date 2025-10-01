import { useEffect, useState } from 'react';
import { useModel } from '@umijs/max';

export default () => {
  const { allClassify } = useModel('global');
  const [show_start_tab, set_show_start_tab] = useState(false);
  const [open, setOpen] = useState(false);
  const [cnStrength, set_cnStrength] = useState(0.6);
  const [promptTxt, setPromptTxt] = useState('');
  const [style_img, set_style_img] = useState('');
  const [upload_img, set_upload_img] = useState('');
  const [upload_show_img, set_upload_show_img] = useState('');
  const [task_id, set_task_id] = useState('');
  const [queue_num, set_queue_num] = useState(0);
  const [interval, setInterval] = useState(undefined);
  const [has_start, set_has_start] = useState(false);

  const [classifyId3, set_classifyId3] = useState('');
  const [classifyId2, set_classifyId2] = useState('');
  const [classifyId2_index, set_classifyId2_index] = useState(0);
  const [view, set_view] = useState('');
  const [atmosphere, set_atmosphere] = useState('');
  const [environment, set_environment] = useState('');
  const [ignoreWordAndImage, set_ignoreWordAndImage] = useState(false);
  const [lock, set_lock] = useState(1);

  return {
    show_start_tab,
    set_show_start_tab,
    open,
    setOpen,
    cnStrength,
    set_cnStrength,
    promptTxt,
    setPromptTxt,
    style_img,
    set_style_img,
    upload_img,
    set_upload_img,
    upload_show_img,
    set_upload_show_img,
    task_id,
    set_task_id,
    queue_num,
    set_queue_num,
    interval,
    setInterval,
    has_start,
    set_has_start,
    classifyId3,
    set_classifyId3,
    classifyId2,
    set_classifyId2,
    classifyId2_index,
    set_classifyId2_index,
    view,
    set_view,
    lock,
    set_lock,
    ignoreWordAndImage,
    set_ignoreWordAndImage,
    atmosphere,
    set_atmosphere,
    environment,
    set_environment,
  };
};
