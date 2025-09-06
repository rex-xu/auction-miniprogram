// app.js
App({
  globalData: {
    userInfo: null,
    token: '',
    baseUrl: 'http://127.0.0.1:8000/api/v1', // 后端API地址
    socketUrl: 'ws://127.0.0.1:8000/ws/auction',
    host: 'http://127.0.0.1:8000'
  },

  onLaunch() {
    // 初始化登录状态
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
      // 可以在这里验证token是否有效
      this.verifyToken(token);
    }
  },

  verifyToken(token) {
    // 验证token有效性的逻辑
    wx.request({
      url: `${this.globalData.baseUrl}/users/verify/`,
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode !== 200) {
          // token无效，清除存储
          this.logout();
        }
      },
      fail: () => {
        // 请求失败不处理，可能是网络问题
      }
    });
  },

  login(phone, password) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.baseUrl}/users/login/`,
        method: 'POST',
        data: {
          phone,
          password
        },
        success: (res) => {
          if (res.statusCode === 200) {
            this.globalData.token = res.data.token;
            this.globalData.userInfo = res.data.user_info;
            wx.setStorageSync('token', res.data.token);
            wx.setStorageSync('userInfo', res.data.user_info);
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '登录失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  register(phone, password, nickname) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.baseUrl}/users/register/`,
        method: 'POST',
        data: {
          phone,
          password,
          nickname
        },
        success: (res) => {
          if (res.statusCode === 201) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '注册失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  logout() {
    this.globalData.token = '';
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.redirectTo({ url: '/pages/login/login' });
  },

  // 封装请求方法，统一处理token
  request(options) {
    const token = this.globalData.token;
    const header = options.header || {};
    
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }
    
    return new Promise((resolve, reject) => {
      wx.request({
        ...options,
        header,
        success: (res) => {
          if (res.statusCode === 401) {
            // 未授权，跳转到登录页
            this.logout();
            reject(new Error('请先登录'));
            // 调用回调函数
            if (options.fail) options.fail(new Error('请先登录'));
          } else if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
            // 调用回调函数
            if (options.success) options.success(res.data);
          } else {
            const error = new Error(res.data.message || '请求失败');
            reject(error);
            // 调用回调函数
            if (options.fail) options.fail(error);
          }
          // 调用完成回调
          if (options.complete) options.complete();
        },
        fail: (err) => {
          reject(err);
          // 调用回调函数
          if (options.fail) options.fail(err);
          // 调用完成回调
          if (options.complete) options.complete();
        }
      });
    });
  },

  // 检查是否已经缴纳保证金
  async checkDeposit(auctionItemId) {
    try {
      const res = await this.request({
        url: `${this.globalData.baseUrl}/auction-items/${auctionItemId}/check_deposit/`,
        method: 'GET'
      });
      return res.has_paid_deposit;
    } catch (error) {
      console.error('检查保证金失败:', error);
      return false;
    }
  },

  // 缴纳保证金
  async payDeposit(auctionItemId, amount) {
    try {
      const res = await this.request({
        url: `${this.globalData.baseUrl}/auction-items/${auctionItemId}/pay_deposit/`,
        method: 'POST',
        data: {
          amount
        }
      });
      return res;
    } catch (error) {
      console.error('缴纳保证金失败:', error);
      throw error;
    }
  },

  // 提交竞拍
  async submitBid(auctionItemId, price) {
    try {
      const res = await this.request({
        url: `${this.globalData.baseUrl}/bid-records/`,
        method: 'POST',
        data: {
          auction_item: auctionItemId,
          price
        }
      });
      return res;
    } catch (error) {
      console.error('竞拍失败:', error);
      throw error;
    }
  }
});