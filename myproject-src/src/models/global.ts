import { useEffect, useState } from 'react';
import { totalTicket, getAllClassify } from '@/services/ant-design-pro/api';
import { useModel } from '@umijs/max';
import { useSize } from 'ahooks';
import { t } from '@/utils/lang';

export default () => {
  const { initialState } = useModel('@@initialState');
  const { setUserInfo } = useModel('loginModel');
  const [count, set_count] = useState(0);
  const [list_tab, set_list_tab] = useState(1);
  const [tickets, set_tickets] = useState(0);
  const [live_tickets, set_live_tickets] = useState(0);
  const [gpt_tickets, set_gpt_tickets] = useState(0);
  const [result_imgs, set_result_imgs] = useState([]);
  const [result_single_img, set_result_single_img] = useState('');
  const [start_img, set_start_img] = useState('');
  const [allClassify, set_allClassify] = useState([]);
  const [active_mine_key, set_active_mine_key] = useState(t('请选择分类'));
  // 使用的功能
  // 0：建筑渲染
  // 1：景观渲染
  // 2：大鸟瞰渲染
  // 3：家装渲染
  // 4：工装渲染
  // 5：风格迁移
  // 6：单体背景填充
  // 7：室内材质保留渲染
  // 8：彩平图
  // 9：清晰度提升
  // 10：物体移除
  // 11：AI 扩图
  // 15：一键抠图
  const [function_page, set_function_page] = useState(0);
  const [check_history_data, set_check_history_data] = useState<any>({});
  const window_size = useSize(document.querySelector('body'));

  useEffect(() => {
    setUserInfo(initialState?.currentUser ?? null);
  }, [initialState]);

  useEffect(() => {
    doGetAllClassify();
  }, []);

  const get_tickets = async () => {
    const res = await totalTicket({ type: 1 });
    set_tickets(res.data);
  };

  const get_live_tickets = async () => {
    const res = await totalTicket({ type: 2 });
    set_live_tickets(res.data);
  };

  const get_gpt_tickets = async () => {
    const res = await totalTicket({ type: 3 });
    set_gpt_tickets(res.data);
  };

  const doGetAllClassify = async () => {
    const res = await getAllClassify();
    // 中式建筑索引
    const cn_index = res.data[0].children.findIndex((t: any) => t.id == 29);
    // 民宿建筑索引
    const ms_index = res.data[0].children.findIndex((t: any) => t.id == 25);
    res.data[0].children[cn_index].children = res.data[0].children[ms_index].children.map(
      (t: any) => {
        return { ...t, cover: t.cover.replace('%E6%B0%91%E5%AE%BF', '中式建筑') };
      },
    );
    set_allClassify(res.data);
  };

  return {
    allClassify,
    list_tab,
    set_list_tab,
    count,
    set_count,
    get_tickets,
    get_live_tickets,
    get_gpt_tickets,
    tickets,
    live_tickets,
    gpt_tickets,
    result_imgs,
    set_result_imgs,
    result_single_img,
    set_result_single_img,
    start_img,
    set_start_img,
    active_mine_key,
    set_active_mine_key,
    function_page,
    set_function_page,
    check_history_data,
    set_check_history_data,
    window_size,
  };
};
