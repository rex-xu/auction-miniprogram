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

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = app.globalData.userInfo;
    const isLogin = !!userInfo;
    
    this.setData({
      userInfo: userInfo || {},
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