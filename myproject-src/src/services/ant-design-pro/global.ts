// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 梦幻西游区服信息 */
export async function getMengServers(
    options?: { [key: string]: any },
) {
    return request<API.FakeCaptcha>('https://cbg-my.res.netease.com/js/all_server_list.js', {
        method: 'GET',
        ...(options || {}),
    });
}
