// utils/request.js
const app = getApp();

/**
 * 封装的网络请求函数
 * @param {Object} options - 请求选项
 * @param {Boolean} isShowLoading - 是否显示加载提示
 * @returns {Promise}
 */
function request(options, isShowLoading = true) {
  return new Promise((resolve, reject) => {
    // 显示加载提示
    if (isShowLoading) {
      wx.showLoading({
        title: '加载中',
        mask: true
      });
    }
    
    // 获取token
    const token = app.globalData.token;
    const header = options.header || {};
    
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }
    
    // 发送请求
    wx.request({
      ...options,
      header,
      success: (res) => {
        console.log("request success : ", res);
        // 隐藏加载提示
        if (isShowLoading) {
          wx.hideLoading();
        }
        
        // 处理响应
        if (res.statusCode === 200) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // 未授权，跳转到登录页
          app.logout();
          reject(new Error('请先登录'));
        } else {
          // 创建包含响应数据的错误对象，以便上层可以获取具体错误信息
          const error = new Error(res.data.message || '请求失败');
          error.data = res.data;
          error.statusCode = res.statusCode;
          reject(error);
        }
      },
      fail: (err) => {
        console.log("request fail : ", err);
        // 隐藏加载提示
        if (isShowLoading) {
          wx.hideLoading();
        }
        
        // 不在这里显示错误提示，让调用者自己处理
        reject(err);
      }
    });
  });
}

/**
 * GET请求
 * @param {String} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {Boolean} isShowLoading - 是否显示加载提示
 * @returns {Promise}
 */
function get(url, data = {}, isShowLoading = true) {
  return request({
    url,
    method: 'GET',
    data
  }, isShowLoading);
}

/**
 * POST请求
 * @param {String} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {Boolean} isShowLoading - 是否显示加载提示
 * @returns {Promise}
 */
function post(url, data = {}, isShowLoading = true) {
  return request({
    url,
    method: 'POST',
    data
  }, isShowLoading);
}

/**
 * PUT请求
 * @param {String} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {Boolean} isShowLoading - 是否显示加载提示
 * @returns {Promise}
 */
function put(url, data = {}, isShowLoading = true) {
  return request({
    url,
    method: 'PUT',
    data
  }, isShowLoading);
}

/**
 * DELETE请求
 * @param {String} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {Boolean} isShowLoading - 是否显示加载提示
 * @returns {Promise}
 */
function del(url, data = {}, isShowLoading = true) {
  return request({
    url,
    method: 'DELETE',
    data
  }, isShowLoading);
}

module.exports = {
  request,
  get,
  post,
  put,
  del
};