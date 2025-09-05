// user.js
const app = getApp();

Page({
  data: {
    userInfo: {},
    isLoggedIn: false,
    myBidsCount: 0,
    myWinsCount: 0,
    favoritesCount: 0
  },

  onShow() {
    // 检查用户登录状态
    this.checkLoginStatus();
  },

  // 处理用户信息，添加预处理字段
  processUserInfo(userInfo) {
    if (!userInfo) {
      return {
        display_avatar: '/assets/images/default-avatar.png',
        display_nickname: '未登录',
        display_id: '-'
      };
    }
    
    return {
      ...userInfo,
      display_avatar: userInfo.avatar_url || '/assets/images/default-avatar.png',
      display_nickname: userInfo.nickname || '未登录',
      display_id: userInfo.id || '-'
    };
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      // 处理用户信息
      const processedUserInfo = this.processUserInfo(userInfo);
      
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo,
        processedUserInfo: processedUserInfo
      });
      // 加载用户数据
      this.loadUserStats();
    } else {
      // 处理未登录状态下的用户信息
      const processedUserInfo = this.processUserInfo(null);
      
      this.setData({
        isLoggedIn: false,
        userInfo: {},
        processedUserInfo: processedUserInfo,
        myBidsCount: 0,
        myWinsCount: 0,
        favoritesCount: 0
      });
    }
  },

  // 加载用户统计数据
  loadUserStats() {
    app.request({
      url: `${app.globalData.baseUrl}/user/stats/`,
      method: 'GET',
      header: {
        'Authorization': `Token ${wx.getStorageSync('token')}`
      },
      success: (res) => {
        this.setData({
          myBidsCount: res.my_bids_count || 0,
          myWinsCount: res.my_wins_count || 0,
          favoritesCount: res.favorites_count || 0
        });
      },
      fail: () => {
        console.log('加载用户统计数据失败');
      },
      complete: () => {
        // 请求完成后的统一处理逻辑可以在这里添加
      }
    });
  },

  // 去登录
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          app.globalData.isLoggedIn = false;
          this.checkLoginStatus();
          wx.showToast({
            title: '已退出登录',
            icon: 'none'
          });
        }
      }
    });
  },

  // 跳转我的出价
  goToMyBids() {
    if (!this.data.isLoggedIn) {
      this.goToLogin();
      return;
    }
    wx.navigateTo({
      url: '/pages/my-bids/my-bids'
    });
  },

  // 跳转我拍的
  goToMyWins() {
    if (!this.data.isLoggedIn) {
      this.goToLogin();
      return;
    }
    wx.navigateTo({
      url: '/pages/my-wins/my-wins'
    });
  },

  // 跳转我的保证金
  goToMyDeposits() {
    if (!this.data.isLoggedIn) {
      this.goToLogin();
      return;
    }
    wx.navigateTo({
      url: '/pages/my-deposits/my-deposits'
    });
  },

  // 跳转交易记录
  goToTransactionRecords() {
    if (!this.data.isLoggedIn) {
      this.goToLogin();
      return;
    }
    wx.navigateTo({
      url: '/pages/transaction-records/transaction-records'
    });
  },

  // 跳转我的收藏
  goToFavorites() {
    if (!this.data.isLoggedIn) {
      this.goToLogin();
      return;
    }
    wx.navigateTo({
      url: '/pages/favorite/favorite'
    });
  },

  // 跳转浏览历史
  goToViewed() {
    if (!this.data.isLoggedIn) {
      this.goToLogin();
      return;
    }
    wx.navigateTo({
      url: '/pages/viewed/viewed'
    });
  },

  // 跳转用户协议
  goToTerms() {
    wx.navigateTo({
      url: '/pages/terms/terms?type=agreement'
    });
  },

  // 跳转隐私政策
  goToPrivacy() {
    wx.navigateTo({
      url: '/pages/terms/terms?type=privacy'
    });
  },

  // 跳转关于我们
  goToAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  // 联系客服
  goToContact() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567'
    });
  }
});