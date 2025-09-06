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
        // 注意：使用'Token'前缀而不是'Bearer'，以匹配Django REST Framework的TokenAuthentication
        'Authorization': `Token ${token}`
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

  async login(phone, password) {
    try {
      // 使用统一的request方法，自动处理后端统一响应格式
      const data = await this.request({
        url: `${this.globalData.baseUrl}/users/login/`,
        method: 'POST',
        data: {
          phone,
          password,
          auth_type: 'password'
        }
      });
      
      // 由于request方法已经处理了统一响应格式，data应该已经是res.data.data部分
      this.globalData.token = data.token;
      this.globalData.userInfo = data.user;
      wx.setStorageSync('token', data.token);
      wx.setStorageSync('userInfo', data.user);
      return data;
    } catch (error) {
      console.error('登录失败:', error.message);
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
      throw error;
    }
  },

  // 微信登录
  async wechatLogin(code, userInfo) {
    try {
      // 使用统一的request方法，自动处理后端统一响应格式
      const data = await this.request({
        url: `${this.globalData.baseUrl}/users/wechat_login/`,
        method: 'POST',
        data: {
          code: code,
          user_info: userInfo
        }
      });
      
      // 尝试获取token和用户信息
      let token = null;
      let user = null;
      
      // 由于request方法已经处理了统一响应格式，data应该已经是res.data.data部分
      // 但为了兼容性，我们仍然检查多种可能的结构
      if (data && data.token) {
        token = data.token;
        user = data.user;
      } else {
        console.error('>>>>>> 无法从响应中获取token和用户信息:', data);
        wx.showToast({
          title: '登录成功但未返回token',
          icon: 'none'
        });
        throw new Error('登录成功但未返回token');
      }
      
      if (token) {
        console.log('>>>>>> 成功获取token:', token.substring(0, 10) + '...');
        this.globalData.token = token;
        this.globalData.userInfo = user;
        wx.setStorageSync('token', token);
        wx.setStorageSync('userInfo', user);
        return {token, user};
      }
    } catch (error) {
      console.error('>>>>>> 登录失败:', error.message);
      wx.showToast({
        title: error.message || '微信登录失败',
        icon: 'none'
      });
      throw error;
    }
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
      // 注意：Django REST Framework的TokenAuthentication默认使用'Token'前缀而不是'Bearer'
      header['Authorization'] = `Token ${token}`;
    }
    
    return new Promise((resolve, reject) => {
      wx.request({
        ...options,
        header,
        success: (res) => {
          console.log('>>>>>> request响应状态码:', res.statusCode);
          console.log('>>>>>> request响应完整数据:', res.data);
          
          if (res.statusCode === 401) {
            // 未授权，跳转到登录页
            this.logout();
            reject(new Error('请先登录'));
            // 调用回调函数
            if (options.fail) options.fail(new Error('请先登录'));
          } else if (res.statusCode >= 200 && res.statusCode < 300) {
            // 由于后端使用了UnifiedResponseMiddleware，所有API响应都被格式化为{code, message, data}结构
            // 当code为0表示成功，我们直接返回data部分
            const responseData = res.data.data || res.data;
            resolve(responseData);
            // 调用回调函数
            if (options.success) options.success(responseData);
          } else {
            const errorMsg = res.data ? (res.data.message || res.data.error || '请求失败') : '请求失败';
            const error = new Error(errorMsg);
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
      // 注意：由于request方法已经处理了后端统一响应格式，所以这里直接获取到的就是res.data.data部分
      const data = await this.request({
        url: `${this.globalData.baseUrl}/auction-items/${auctionItemId}/check_deposit/`,
        method: 'GET'
      });
      console.log('>>>>>> checkDeposit数据:', data);
      return data.has_paid_deposit || false;
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
  async submitBid(auctionItemId, bidAmount) {
    try {
      // 注意：由于request方法已经处理了后端统一响应格式，这里直接返回处理后的数据
      // 另外，Django视图中的bid方法期望的参数名是'bid_amount'，而不是'price'
      const data = await this.request({
        url: `${this.globalData.baseUrl}/auction-items/${auctionItemId}/bid/`,
        method: 'POST',
        data: {
          bid_amount: bidAmount
        }
      });
      
      console.log('提交竞拍成功:', data);
      return data;
    } catch (error) {
      console.error('竞拍失败:', error);
      // 包装错误信息，使其更友好
      const errorMsg = error.message || '竞拍失败，请稍后重试';
      throw new Error(errorMsg);
    }
  }
});