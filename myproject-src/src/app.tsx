import Footer from '@/components/Footer';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import dayjs from 'dayjs';
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import defaultSettings from '../config/defaultSettings';
import { getVipInfo, userInfo } from './services/ant-design-pro/api';

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';
dayjs.extend(weekday);
dayjs.extend(localeData);
/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  collapse: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      // const res = await test_login({ userId: 'mh' });
      const user_info = await userInfo();
      const vip_info = await getVipInfo();
      console.log('res', user_info);
      return { ...user_info.data, ...vip_info.data };
    } catch (error) {
      console.log('error', error);
      // localStorage.clear();
      // window.pywebview.api.save_localStorage({});
      // history.push(loginPath);
    }
    return undefined;
  };

  const currentUser = await fetchUserInfo();

  return {
    fetchUserInfo,
    currentUser: currentUser,
    settings: defaultSettings,
    collapse: false,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  return {
    logo: '/icon.jpg',
    iconfontUrl: '/iconfont.js',
    disableContentMargin: true,
    waterMarkProps: {
      // content: 'Eva Platform',
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      // 如果没有登录，重定向到 login
      // if (!initialState?.currentUser && location.pathname !== loginPath) {
      //   history.push(loginPath);
      // }
    },
    links: isDev ? [] : [],
    menuHeaderRender: false,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children, props) => {
      // if (initialState?.loading) return <PageLoading />;
      return <>{children}</>;
    },
    ...initialState?.settings,
  };
};

export const request: RequestConfig = {
  timeout: 120000,
  // other axios options you want
  headers: {
    // 'x-token': localStorage.getItem('accessToken') || '',
  },
  withCredentials: true,
  errorConfig: {
    errorHandler() {},
    errorThrower() {},
  },
  requestInterceptors: [],
  responseInterceptors: [],
};
