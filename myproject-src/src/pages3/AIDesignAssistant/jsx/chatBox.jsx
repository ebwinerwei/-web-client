import React, { useEffect, useState } from 'react';
import { Input, Upload, Button, Spin, message, Image } from 'antd';
import { gptTalk, gptTalkHistoryDetail } from '@/services/ant-design-pro/api';
import { useModel } from '@umijs/max';
import COS from '@/components/Cos';
import { useInterval, useDebounceFn } from 'ahooks';
import { startTask, getTaskByTaskId } from '@/services/ant-design-pro/api';
import { t } from '@/utils/lang';
import { replaceAnswers } from './utils';

const word = t(
  '我正在使用一个AI图像生成工具。我想让你充当关键词生成器。我将在我想生成的主题之前添加"/"你会生成各种关键词。例如，如果我输入"/跑车图像"，你将生成关键词，如"Realistic true details photography of Sports car,laction shots, speed motion blur, racing tracks, urban environments, scenic roads, dramatic skies"。',
);

function ChatBox(props) {
  const { currentChat, onClick, refresh, setRefresh, currentHistory } = props;
  const { setShowRechargeModal } = useModel('loginModel');
  const { get_gpt_tickets } = useModel('global');
  const [chatting, setChatting] = useState(false);
  const [value, setValue] = useState('');
  const [chatInfo, setChatInfo] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [uploadImg, setUploadImg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [task_id, set_task_id] = useState('');
  const [interval, setInterval] = useState(undefined);

  useEffect(() => {
    if (currentChat.talkId) {
      getChatDetail();
    }
  }, [currentChat]);

  const getChatDetail = async () => {
    const res = await gptTalkHistoryDetail({
      talkId: currentChat.talkId,
    });
    if (res.error?.errorCode == 0) {
      setChatting(true);
      setChatInfo(res.data || []);
      scrollToBottom();
    } else {
      message.error(res.error?.errorMsg);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      const div = document.querySelector('#chat_box');
      if (div) {
        div.scrollTop = div.scrollHeight;
      }
    }, 50);
  };

  const sendMessage = (question, index, img) => {
    if (thinking) {
      return message.info(t('请稍后...'));
    }
    const q =
      currentChat.key == '7' && chatInfo.length === 0
        ? word + (question || value)
        : question || value;
    setChatInfo((chatInfo) =>
      chatInfo.concat({
        question: q,
        image: img || uploadImg,
      }),
    );
    setThinking(true);
    if (currentChat.key == '1') {
      runTask(question || value);
    } else {
      gptTalkList(q, index, img || uploadImg);
    }
    setChatting(true);
    setValue('');
    setUploadImg('');
    scrollToBottom();
  };

  const runTask = async (question) => {
    message.loading({
      type: 'loading',
      content: t('开始设置，请稍等...'),
      duration: 0,
    });
    const res = await startTask({
      text: question,
      classifyId1: 440,
      classifyWord1: t('文生图'),
    });
    message.destroy();
    if (res.error.errorCode == 0 && res.data?.taskId != null) {
      get_gpt_tickets();
      set_task_id(res.data.taskId);
      setInterval(3000);
    } else {
      if (res.error.errorCode == 1) {
        setShowRechargeModal(true);
        message.error(t('次数不足，请充值'));
        setThinking(false);
        scrollToBottom();
        return;
      }
      if (res.data?.taskId == null) {
        setThinking(false);
        scrollToBottom();
        if (res.error.errorMsg == '未登录') {
          message.error(t('账号已在其他地方登录'));
          const res = await logout();
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          message.error(t('任务发起失败，taskId为null'));
        }
      }
    }
  };

  const clear = useInterval(async () => {
    const res = await getTaskByTaskId({ taskId: task_id });
    if (res.data?.resultImg && res.data?.status == 1 && res.error.errorCode == 0) {
      // 运行完成
      const img_arr = res.data?.resultImg.split(';');
      setChatInfo((chatInfo) =>
        chatInfo.map((item, index) => {
          if (index === chatInfo.length - 1) {
            return {
              ...item,
              image: img_arr.join(';'),
            };
          }
          return item;
        }),
      );
      setRefresh((refresh) => refresh + 1);
      setInterval(undefined);
      setThinking(false);
      scrollToBottom();
    } else if (res.error?.errorCode == 1) {
      setShowRechargeModal(true);
      setThinking(false);
      scrollToBottom();
      message.error(t('次数不足，请充值'));
    }
  }, interval);

  const gptTalkList = async (question, index, uploadImg) => {
    let preInfo = chatInfo[index !== undefined ? index : chatInfo.length - 1];
    if (currentChat.key == '7') {
      preInfo = chatInfo[0];
    }
    if (index === 0) {
      preInfo = null;
    }
    const res = await gptTalk({
      preQuestion: preInfo?.question || '',
      preAnswer: preInfo?.answer || '',
      question,
      image: uploadImg,
      talkId: preInfo?.talkId || currentChat.talkId || '',
      classId: currentChat.key,
    });
    if (res.error?.errorCode == 0) {
      get_gpt_tickets();
      setChatInfo((chatInfo) =>
        chatInfo.map((item) => {
          return {
            ...res.data,
            ...item,
          };
        }),
      );
      setRefresh((refresh) => refresh + 1);
    } else if (res.error?.errorCode == 1) {
      setShowRechargeModal(true);
      message.error(t('次数不足，请充值'));
    } else {
      message.error(res.error?.errorMsg);
    }
    setThinking(false);
    scrollToBottom();
  };

  const customRequest = (option) => {
    const key = `${new Date().getTime()}_${option.file.size}_.${option.file.name.split('.').pop()}`;
    setUploading(true);
    message.loading({
      type: 'loading',
      content: t('图片上传中...'),
      duration: 0,
    });
    COS.uploadFile(
      {
        Bucket: 'blue-user-1304000175' /* 填入您自己的存储桶，必须字段 */,
        Region: 'ap-tokyo' /* 存储桶所在地域，例如ap-beijing，必须字段 */,
        Key: key /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */,
        Body: option.file /* 必须，上传文件对象，可以是input[type="file"]标签选择本地文件后得到的file对象 */,
        // 支持自定义headers 非必须
      },
      (err, data) => {
        message.destroy();
        setUploading(false);
        if (!data.Location) {
          message.error(t('图片上传失败'));
          return;
        }
        setUploadImg('https://' + data.Location);
      },
    );
  };

  console.log('currentChat.key', currentChat.key, [(11, '12')].includes(currentChat.key));
  return (
    <div className="chat_box_contaniner">
      <div className="chat_box" id="chat_box">
        {!chatting ? (
          <>
            {currentChat.desc && (
              <div className="chat_box_header">
                <img className="header_img" src={currentChat.url} />
                <div className="header_det_info">
                  <div className="name">{currentChat.name}</div>
                  <div className="desc" title={currentChat.desc}>
                    {currentChat.desc}
                  </div>
                </div>
              </div>
            )}
            <div className="common_questions">
              {currentChat.questions?.map((item, index) => {
                return (
                  <div
                    className="q_det"
                    key={index}
                    onClick={() => sendMessage(item, undefined, currentChat.qImgs?.[index])}
                  >
                    <span className="det_content">
                      {currentChat.qImgs && (
                        <img className="img_1" src={currentChat.qImgs[index]} />
                      )}
                      {item}
                      <img className="img_2" src="/imgs/ai_design_assistant/icon_gd.png" />
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="chat_messages">
            {chatInfo.map((item, index) => {
              return (
                <div key={item.talkId}>
                  <div className="message sender">
                    <div className="message_body">
                      <div
                        style={{ textAlign: 'justify' }}
                        dangerouslySetInnerHTML={{ __html: item.question }}
                      ></div>
                      {['11', '12'].includes(currentChat.key) && item.image && (
                        <div style={{ padding: 5, textAlign: 'left' }}>
                          <img src={item.image} style={{ maxWidth: 100, borderRadius: 5 }} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="message">
                    {thinking && chatInfo.length - 1 === index ? (
                      <Spin />
                    ) : (
                      <div className="message_body">
                        <div
                          dangerouslySetInnerHTML={{ __html: replaceAnswers(item.answer) }}
                        ></div>
                        {item.image && !!item.image?.split(';')?.length && (
                          <div style={{ display: 'flex' }}>
                            {(item.image?.split(';') || []).map((item) => {
                              return (
                                <div
                                  style={{
                                    width: 100,
                                    height: 100,
                                    margin: 5,
                                    borderRadius: 5,
                                    overflow: 'hidden',
                                    background: '#383838',
                                  }}
                                >
                                  <Image src={item} width={100} />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    {!thinking && (
                      <div
                        className="re_send"
                        onClick={() => {
                          setValue(chatInfo[index].question || '');
                          sendMessage(chatInfo[index].question || '', index);
                        }}
                      >
                        <img src="/imgs/ai_design_assistant/icon_cxsc.png" />
                        {t('重新生成')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {['1'].includes(currentChat.key) && (
        <div className="ts_to_ds" onClick={onClick}>
          <img src="/imgs/ai_design_assistant/icon_tscds.png" />
          <span>{t('提示问大师')}</span>
        </div>
      )}
      <div
        className="send_box_container"
        style={
          uploadImg
            ? {
                borderRadius: 10,
                padding: 5,
                border: '1px solid #383838',
              }
            : {}
        }
      >
        {uploadImg && (
          <div className="preview_img">
            <Image src={uploadImg} />
            <div className="delete_img" onClick={() => setUploadImg('')}>
              <img src="/imgs/ai_design_assistant/icon_sc.png" />
            </div>
          </div>
        )}
        <div className="send_box">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onPressEnter={() => sendMessage()}
            addonBefore={
              ['11', '12'].includes(currentChat.key) ? (
                <Upload customRequest={customRequest} maxCount={1} showUploadList={false}>
                  <Button
                    style={{
                      height: 46,
                      background: '#2A2A2A',
                      borderRadius: 5,
                      color: '#fff',
                      fontSize: 14,
                      border: 'none',
                    }}
                    loading={uploading}
                  >
                    {t('上传图片')}
                  </Button>
                </Upload>
              ) : null
            }
            prefix={<img style={{ marginRight: 5 }} src="/imgs/ai_design_assistant/icon_sr.png" />}
            suffix={
              <img onClick={() => sendMessage()} src="/imgs/ai_design_assistant/icon_fs.png" />
            }
            placeholder={
              [2, 3, 4, 5, 6].includes(Number(currentChat.key))
                ? t('请输入你的问题')
                : Number(currentChat.key) == 7
                ? t('请在你输入的名词前，加上/，例如/客厅，沙发，桌子')
                : Number(currentChat.key) == 1
                ? t('请输入您需要的物件，以逗号隔开')
                : [11, 12].includes(Number(currentChat.key))
                ? t('上传图片后，可以询问关于该图片的任何问题')
                : t('请输入你的问题')
            }
          />
        </div>
      </div>
    </div>
  );
}
export default ChatBox;
