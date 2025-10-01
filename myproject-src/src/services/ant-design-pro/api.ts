// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';
// const suffix = '/api';
const suffix = '/api/api';
// const suffix = 'http://127.0.0.1:8188';
// const suffix = 'http://43.143.32.187:1234';

/** 登录测试 */
export async function test_login(body: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/test/testlogin', {
    method: 'GET',
    params: body,
    ...(options || {}),
  });
}
/** 根据id删除历史记录 */
export async function delTaskByTaskId(body?: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/ai/delTaskByTaskId', {
    method: 'GET',
    params: body,
    ...(options || {}),
  });
}
/** 创建微信订单 */
export async function createOrder(body?: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/order/createOrder', {
    method: 'GET',
    params: body,
    ...(options || {}),
  });
}
/** 创建支付宝订单 */
export async function createAliPayOrder(body?: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/order/createAliPayOrder', {
    method: 'GET',
    params: body,
    ...(options || {}),
  });
}
/** 检查订单 */
export async function checkOrder(body?: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/order/checkOrder', {
    method: 'GET',
    params: body,
    ...(options || {}),
  });
}
/** 已完成支付 */
export async function completeOrder(body?: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/order/completeOrder', {
    method: 'GET',
    params: body,
    ...(options || {}),
  });
}
/** 获取用户信息 */
export async function userInfo(body?: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/user/userInfo', {
    method: 'GET',
    ...(options || {}),
  });
}
/** 获取VIP信息 */
export async function getVipInfo(body?: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/user/getVipInfo', {
    method: 'GET',
    ...(options || {}),
  });
}
/** 退出登录 */
export async function logout(body?: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/user/logout', {
    method: 'GET',
    ...(options || {}),
  });
}
/** 获取所有频道-空间-视角-风格 */
export async function getAllClassify(body?: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/ai/getAllClassify', {
    method: 'GET',
    ...(options || {}),
  });
}
/** 剩余绘图券 */
export async function totalTicket(body?: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/ai/totalTicket', {
    method: 'GET',
    params: body,
    ...(options || {}),
  });
}
/** 开始任务 */
export async function startTask(body: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/ai/startTask', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}
/** ai选取蒙层 */
export async function clickMask(body: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/ai/clickMask', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}
/** 获取任务列表 */
export async function getTaskList(body?: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/ai/getTaskList', {
    method: 'GET',
    params: body,
    ...(options || {}),
  });
}
/** 获取素材库 */
export async function getAllSuCai(body?: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/ai/getAllSuCai', {
    method: 'GET',
    ...(options || {}),
  });
}
/** 获取任务结果 */
export async function getTaskByTaskId(body?: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/ai/getTaskByTaskId', {
    method: 'GET',
    params: body,
    ...(options || {}),
  });
}
/** 获取二维码 */
export async function getQRCode(body?: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/wx/getQRCode', {
    method: 'GET',
    ...(options || {}),
  });
}
/** 服务号扫码登陆轮询 */
export async function wechatCheakScan(body?: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/wx/cheakScan', {
    method: 'GET',
    params: body,
    ...(options || {}),
  });
}
/** 退出登录 */
export async function s(body: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/user/logout', {
    method: 'GET',
    data: body,
    ...(options || {}),
  });
}
/** 开始聊天 */
export async function gptTalk(body: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/ai/gptTalk', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}
/** gpt会话历史记录 */
export async function gptTalkHistory(body: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/ai/gptTalkHistory', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}
/** gpt会话历史记录详情 */
export async function gptTalkHistoryDetail(body: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/ai/gptTalkHistoryDetail', {
    method: 'GET',
    params: body,
    ...(options || {}),
  });
}
/** 管理后台 */
export async function manageLogin(body: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/user/manage/login', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}
export async function getAccountList(body: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/user/manage/page/account', {
    method: 'GET',
    params: body,
    ...(options || {}),
  });
}
export async function deleteAccountList(body: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + `/user/manage/account/${body.accountId}`, {
    method: 'DELETE',
    params: body,
    ...(options || {}),
  });
}
export async function createAccount(body: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + '/user/manage/account', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}
export async function updateAccount(body: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + `/user/manage/account/${body.accountId}`, {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}
export async function getAccountDetail(body: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + `/user/manage/account/${body.accountId}`, {
    method: 'GET',
    params: body,
    ...(options || {}),
  });
}
export async function emailLogin(body: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + `/login/email`, {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}
export async function accountLogin(body: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + `/login/account`, {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}
export async function sendEmail(body: any, options?: { [key: string]: any }) {
  return request<Record<string, any>>(suffix + `/login/email/send`, {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}
