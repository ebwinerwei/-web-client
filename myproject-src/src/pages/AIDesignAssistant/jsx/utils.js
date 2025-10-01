import React from 'react';
import { t } from '@/utils/lang';

const renderLabel = (words, url, isParent) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: isParent ? 24 : 60 }}>
      <img style={{ marginRight: 12, width: 30, height: 30, borderRadius: '50%' }} src={url} />
      {words}
    </div>
  );
};

export const menuItems = [
  {
    key: '9',
    label: renderLabel(t('文生文'), '/imgs/ai_design_assistant/icon_GPT.png', true),
    children: [
      {
        key: '2',
        name: t('自由问答'),
        url: '/imgs/ai_design_assistant/icon_zywd.png',
        label: renderLabel(t('自由问答'), '/imgs/ai_design_assistant/icon_zywd.png'),
      },
      {
        key: '3',
        name: t('室内大师'),
        desc: t('资深室内全案设计师，20年设计以及施工经验，擅长空间规划和风格'),
        url: '/imgs/ai_design_assistant/icon_snds.webp',
        label: renderLabel(t('室内大师'), '/imgs/ai_design_assistant/icon_snds.webp'),
        questions: [
          t('业主是律师，想装修下自己的住宅，请设计一套室内装修方案，从而能符合他的身份形象？'),
          t('如何利用室内设计，使得卧室看起来更大？'),
          t('中国的小型家装公司如何进行市场营销，从而拿到更多业主的订单？'),
        ],
      },
      {
        key: '4',
        name: t('建筑GO'),
        desc: t('建筑AI，学习了人类历史上所有的知识和文化'),
        url: '/imgs/ai_design_assistant/icon_jzgo.webp',
        label: renderLabel(t('建筑GO'), '/imgs/ai_design_assistant/icon_jzgo.webp'),
        questions: [
          t('请为绿色节能建筑项目为主题，写一套向当地政府拿地方案的汇报'),
          t('请列出一些设计卖点，针对绿色节能建筑，使得可以打动前来入住的商家'),
          t(
            '请为一个办公综合体建筑设计写一段生动的项目描述，建筑位于上海市徐汇区，共分为三个大区：商业、办公与公共区域。建筑原貌为工厂旧址，希望通过建筑翻新吸引更多创业型公司和年轻艺术家入驻。这将是一个绿色建筑，应用节能环保低能耗的技术。',
          ),
        ],
      },
      {
        key: '5',
        name: t('景观学者'),
        desc: t('环游全球的景观人，见识丰富'),
        url: '/imgs/ai_design_assistant/icon_jgxz.jpeg',
        label: renderLabel(t('景观学者'), '/imgs/ai_design_assistant/icon_jgxz.jpeg'),
        questions: [
          t('国内外的景观设计风格，有什么差异化'),
          t('景观设计师，可以转行去干啥'),
          t('有哪些比较好的景观设计的网站'),
        ],
      },
      {
        key: '6',
        name: t('营销大师'),
        desc: t('懂设计的互联网资深营销，获得甲方的一致好评'),
        url: '/imgs/ai_design_assistant/icon_yxds.jpg',
        label: renderLabel(t('营销大师'), '/imgs/ai_design_assistant/icon_yxds.jpg'),
        questions: [
          t('新开的楼盘靠近运河，定位是江景房，请为这个楼盘取一个符合定位的名字'),
          t('作为室内设计师，如何在初次和业主见面时，能尽快取得他的信任，请举个实际的例子加以说明'),
          t(
            '请帮我润色下面一段话，在苏州阳澄湖边上设计一座两万平米的游客中心，风格以参数化的流线型风格为主，形态要具有张力，类似扎哈哈迪德和弗兰克盖里的风格，模拟一艘湖边停靠的游船和桂花花瓣的形态，立面用金属板幕墙',
          ),
        ],
      },
      {
        key: '7',
        name: t('提示词生成器'),
        desc: t('经过上万次调试而成的提示词生成器，文生图必备神器'),
        url: '/imgs/ai_design_assistant/icon_tscscq.jpeg',
        label: renderLabel(t('提示词生成器'), '/imgs/ai_design_assistant/icon_tscscq.jpeg'),
        questions: [t('/新中式别墅'), t('/客厅设计'), t('/商业中心建筑')],
      },
    ],
  },
  {
    key: '8',
    label: renderLabel(t('文生图'), '/imgs/ai_design_assistant/icon_GPT.png', true),
    children: [
      {
        key: '1',
        name: t('自由问答'),
        url: '/imgs/ai_design_assistant/icon_zywd.png',
        label: renderLabel(t('自由问答'), '/imgs/ai_design_assistant/icon_zywd.png'),
        questions: [
          t(
            '充满设计感的民宿建筑设计，别具一格的外观造型，独特的建筑结构与线条设计，创意十足的室内装饰，富有个性的艺术品与装饰品搭配，注重色彩搭配与空间布局，打造独特的居住体验，考虑光线与通风，营造舒适宜人的居住环境，采用环保与可持续的建材与装修方案，融入自然元素与景观设计',
          ),
          t(
            '现代风格，舒适布局，家居装饰，豪华沙发，装饰画，温馨氛围，自然光线，地毯，咖啡桌，绿色植物，灯具设计，简约风格，家庭娱乐中心，开放式空间，艺术品展示，壁炉设计，窗帘选择，地板材料',
          ),
          t(
            '高端商场建筑设计、奢华零售店铺、宏伟入口中庭，配有倾泻的枝形吊灯、设计师精品店展示高级定制服装、米其林星级厨师的美食餐厅、贵宾礼宾服务、豪华室内装饰，大理石地板和金色装饰、宽敞的公共区域，供社交和活动使用、最先进的自动扶梯和电梯',
          ),
        ],
      },
    ],
  },
  {
    key: '10',
    label: renderLabel(t('图片分析'), '/imgs/ai_design_assistant/icon_GPT.png', true),
    children: [
      {
        key: '11',
        name: t('自由问答'),
        url: '/imgs/ai_design_assistant/icon_zywd.png',
        label: renderLabel(t('自由问答'), '/imgs/ai_design_assistant/icon_zywd.png'),
      },
      {
        key: '12',
        name: t('图纸方案师'),
        desc: t('洞察图片中的所有含义，并给出合理的解决方案'),
        url: '/imgs/ai_design_assistant/icon_tzfas.webp',
        label: renderLabel(t('图纸方案师'), '/imgs/ai_design_assistant/icon_tzfas.webp'),
        questions: [
          t('我要把这个客厅改成新中式风格的，应该怎么做'),
          t('分析下这个平面图方案的优势和劣势'),
          t(
            '请描述下这个室内设计的细节和风格，并且以短语或者词语的形式告诉我，使得我通过这些描述，可以在stable diffusion这个软件中，生成类似的图片',
          ),
        ],
        qImgs: [
          'https://blue-user-1304000175.cos.ap-tokyo.myqcloud.com/1715144265625_80151_.jpg',
          'https://blue-user-1304000175.cos.ap-tokyo.myqcloud.com/1715144311369_52525_.jpg',
          'https://blue-user-1304000175.cos.ap-tokyo.myqcloud.com/1715144340095_43133_.jpg',
        ],
      },
    ],
  },
];

export const findItemByKey = (data, key) => {
  return data.reduce((pre, cur) => {
    if (cur.children?.length) {
      pre.push(...findItemByKey(cur.children, key));
    }
    if (cur.key === key) {
      pre.push(cur);
    }
    return pre;
  }, []);
};

export const replaceAnswers = (str) => {
  return str?.replace(/\n/g, '<br/>') || '';
};
