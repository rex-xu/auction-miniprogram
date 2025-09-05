// settings.js
const app = getApp();

Page({
  data: {
    cacheSize: '0.0',
    notificationBid: true,
    notificationPrice: true,
    notificationEnd: true
  },

  onLoad() {
    // 从本地存储加载设置
    this.loadSettings();
    // 计算缓存大小
    this.calculateCacheSize();
  },

  // 加载设置
  loadSettings() {
    const notificationBid = wx.getStorageSync('notificationBid') !== undefined ? 
      wx.getStorageSync('notificationBid') : true;
    const notificationPrice = wx.getStorageSync('notificationPrice') !== undefined ? 
      wx.getStorageSync('notificationPrice') : true;
    const notificationEnd = wx.getStorageSync('notificationEnd') !== undefined ? 
      wx.getStorageSync('notificationEnd') : true;
    
    this.setData({
      notificationBid,
      notificationPrice,
      notificationEnd
    });
  },

  // 计算缓存大小
  calculateCacheSize() {
    wx.getStorageInfo({
      success: (res) => {
        const cacheSize = (res.currentSize / 1024 / 1024).toFixed(1);
        this.setData({
          cacheSize: cacheSize
        });
      }
    });
  },

  // 切换竞拍提醒通知
  toggleNotificationBid(e) {
    const checked = e.detail.value;
    this.setData({ notificationBid: checked });
    wx.setStorageSync('notificationBid', checked);
  },

  // 切换价格变动通知
  toggleNotificationPrice(e) {
    const checked = e.detail.value;
    this.setData({ notificationPrice: checked });
    wx.setStorageSync('notificationPrice', checked);
  },

  // 切换竞拍结束通知
  toggleNotificationEnd(e) {
    const checked = e.detail.value;
    this.setData({ notificationEnd: checked });
    wx.setStorageSync('notificationEnd', checked);
  },

  // 跳转到账号管理
  navigateToAccount() {
    wx.navigateTo({
      url: '/pages/account/account'
    });
  },

  // 跳转到隐私设置
  navigateToPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    });
  },

  // 跳转到关于我们
  navigateToAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录状态
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          
          // 返回登录页
          wx.reLaunch({
            url: '/pages/login/login'
          });
        }
      }
    });
  }
});