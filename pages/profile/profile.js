// profile.js
const app = getApp();

Page({
  data: {
    userInfo: {},
    isLogin: false
  },

  onShow() {
    // 每次显示页面都检查登录状态
    this.checkLoginStatus();
  },

  // 处理用户信息，添加预处理字段
  processUserInfo(userInfo) {
    if (!userInfo) {
      return {
        display_avatar: '/assets/images/default-avatar.png',
        display_nickname: '未登录',
        display_phone: ''
      };
    }
    
    return {
      ...userInfo,
      display_avatar: userInfo.avatar || '/assets/images/default-avatar.png',
      display_nickname: userInfo.nickname || '未登录',
      display_phone: userInfo.phone || ''
    };
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = app.globalData.userInfo;
    const isLogin = !!userInfo;
    
    // 处理用户信息
    const processedUserInfo = this.processUserInfo(userInfo);
    
    this.setData({
      userInfo: userInfo || {},
      processedUserInfo: processedUserInfo,
      isLogin: isLogin
    });
  },

  // 跳转到登录页面
  navigateToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 跳转到我的竞拍页面
  navigateToMyBids() {
    wx.switchTab({
      url: '/pages/my-bids/my-bids'
    });
  },

  // 跳转到我的保证金页面
  navigateToDeposits() {
    wx.navigateTo({
      url: '/pages/my-deposits/my-deposits'
    });
  },

  // 跳转到设置页面
  navigateToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
        }
      }
    });
  }
});