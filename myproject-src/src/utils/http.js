import { assign, isEmpty } from 'lodash';
const API_IP = 'https://pin.znztv.com';
// const API_IP = 'http://139.196.47.231:80';
// const API_IP = 'https://testpin.znztv.com';

export const BrowserType = () => {
  var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
  var isOpera = userAgent.indexOf('Opera') > -1; //判断是否Opera浏览器
  var isIE = userAgent.indexOf('compatible') > -1 && userAgent.indexOf('MSIE') > -1 && !isOpera; //判断是否IE浏览器
  var isEdge = userAgent.indexOf('Edge') > -1; //判断是否IE的Edge浏览器
  var isFF = userAgent.indexOf('Firefox') > -1; //判断是否Firefox浏览器
  var isSafari = userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') == -1; //判断是否Safari浏览器
  var isChrome = userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Safari') > -1; //判断Chrome浏览器

  if (!!window.ActiveXObject || 'ActiveXObject' in window) {
    return 'IE';
  }

  if (isIE) {
    return 'IE';
  }

  if (isEdge) {
    return 'Edge';
  }

  if (isFF) {
    return 'FF';
  }
  if (isOpera) {
    return 'Opera';
  }
  if (isSafari) {
    return 'Safari';
  }
  if (isChrome) {
    return 'Chrome';
  }
};

class Http {
  parseParams(data) {
    try {
      var tempArr = [];
      for (var i in data) {
        var key = encodeURIComponent(i);
        var value = encodeURIComponent(data[i]);
        tempArr.push(key + '=' + value);
      }
      var urlParamsStr = tempArr.join('&');
      return urlParamsStr;
    } catch (err) {
      return '';
    }
  }
  // 检查响应状态
  checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      // 响应成功
      return response;
    }
    if (response.status === 301 || response.status === 302) {
      // 重定向
      window.location = response.headers.get('Location');
    }
    if (response.status === 401) {
      return response;
    }
    let error;
    try {
      const error = new Error(response.statusText);
      error.data = response;
    } catch (e) {}
    throw error;
  }
  // 解析返回结果
  async parseResult(response) {
    const contentType = response.headers.get('Content-Type');
    if (contentType != null) {
      if (contentType.indexOf('text') > -1) {
        let data = await response.text();
        return data;
      }
      if (contentType.indexOf('form') > -1) {
        let data = await response.formData();
        return data;
      }
      if (contentType.indexOf('video') > -1) {
        let data = await response.blob();
        return data;
      }
      if (contentType.indexOf('json') > -1) {
        let data = await response.json();
        return data;
      }
    }
    let data = await response.text();
    return data;
  }
  async processResult(response) {
    let _response = this.checkStatus(response);
    _response = await this.parseResult(_response);
    return _response;
  }
  async _request(url = '', init, headers = {}) {
    try {
      let options = assign(
        {
          mode: 'cors', // 允许跨域
          credentials: 'include',
        },
        init,
      );
      options.headers = Object.assign({}, options.headers || {}, headers || {});
      let _url = url.startsWith('http') ? url : `${API_IP}${url}`;
      let response = await fetch(_url, options);

      let _res = {
        url: response.url,
        status: response.status,
        location: response.headers.get('Location'),
      };

      // 登录接口特殊通道
      // if (
      //   _res.url.includes('/cas/v1/tickets') ||
      //   url.includes('/cas/v1/tickets')
      // ) {
      //   // console.log('登陆接口')
      //   if (
      //     response.status == 200 ||
      //     response.status == 201 ||
      //     response.status == 401
      //   ) {
      //     // console.log('登陆接口成功')
      //     response = await this.processResult(response);
      //     return {
      //       data: response,
      //       ..._res,
      //     };
      //   } else {
      //     // console.log('失败')
      //     return {
      //       data: '',
      //       ..._res,
      //     };
      //   }
      // }

      response = await this.processResult(response); // 这里是对结果进行处理。包括判断响应状态和根据response的类型解析结果

      return response;
    } catch (error) {
      throw error;
    }
  }

  // oss样式
  async _request_temp(url = '', init, headers = {}) {
    try {
      let options = assign(
        {
          mode: 'cors', // 允许跨域
          /* credentials: 'include' */
        },
        init,
      );
      options.headers = Object.assign({}, options.headers || {}, headers || {});
      let _url = url.startsWith('http') ? url : `${API_IP}${url}`;
      let response = await fetch(_url, options);

      let _res = {
        url: response.url,
        status: response.status,
        location: response.headers.get('Location'),
      };

      // 登录接口特殊通道
      if (_res.url.includes('/cas/v1/tickets') || url.includes('/cas/v1/tickets')) {
        // console.log('登陆接口')
        if (response.status == 200 || response.status == 201 || response.status == 401) {
          // console.log('登陆接口成功')
          response = await this.processResult(response);
          return {
            data: response,
            ..._res,
          };
        } else {
          // console.log('失败')
          return {
            data: '',
            ..._res,
          };
        }
      }

      response = await this.processResult(response); // 这里是对结果进行处理。包括判断响应状态和根据response的类型解析结果

      return response;
    } catch (error) {
      throw error;
    }
  }

  async get(api, data = {}, headers = {}, config = {}) {
    const query = isEmpty(data) ? '' : this.parseParams(data);
    let _data = await this._request(`${api}?version=1.2&${query}`, {}, headers, {}, config);
    return _data;
  }
  // oss样式
  async get_temp(api, data = {}, headers = {}, config = {}) {
    const query = isEmpty(data) ? '' : this.parseParams(data);
    let _data = await this._request_temp(`${api}?${query}`, {}, headers, {}, config);
    return _data;
  }
  async post(api, data = {}, headers = {}, config = {}) {
    // 通过headers决定要解析的类型
    const _headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      // 'content-type': 'application/json',
      ...headers,
    };
    let _body = null;
    if (
      _headers['Content-Type'] &&
      _headers['Content-Type'].indexOf('application/x-www-form-urlencoded') > -1
    ) {
      try {
        // 如果是客户端请求 使用formdata  解决ie和edge的登录请求问题
        // console.log(window)

        if (BrowserType() == 'IE' || BrowserType() == 'Edge') {
          _body = new FormData();
          if (!api.includes('/cas/v1/tickets')) {
            api = `${api}?${this.parseParams(data)}`;
          }
        } else {
          _body = new URLSearchParams();
        }
      } catch (error) {
        _body = new URLSearchParams();
      }

      for (let k in data) {
        // 遍历一个对象
        if (typeof data[k] === 'object') {
          _body.append(k, JSON.stringify(data[k]));
        } else {
          _body.append(k, data[k]);
        }
      }
    } else {
      _body = JSON.stringify(data);
    }

    let _data = await this._request(
      api,
      {
        method: 'POST',
        headers: _headers,
        body: _body,
      },
      {},
      config,
    );
    return _data;
  }
  async delete(api, data = {}, headers = {}, config = {}) {
    // 通过headers决定要解析的类型
    const _headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      // 'content-type': 'application/json',
      ...headers,
    };
    let _body = null;
    if (
      _headers['Content-Type'] &&
      _headers['Content-Type'].indexOf('application/x-www-form-urlencoded') > -1
    ) {
      _body = new FormData();
      for (let k in data) {
        // 遍历一个对象
        if (typeof data[k] === 'object') {
          _body.append(k, JSON.stringify(data[k]));
        } else {
          _body.append(k, data[k]);
        }
      }
    } else {
      _body = JSON.stringify(data);
    }
    let _data = await this._request(
      api,
      {
        method: 'DELETE',
        headers: _headers,
        body: _body,
      },
      {},
      config,
    );
    return _data;
  }
}

let http = new Http();
export default http;
