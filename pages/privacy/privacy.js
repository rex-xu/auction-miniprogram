// privacy.js
const app = getApp();

Page({
  data: {
    showNickname: true,
    showAvatar: true,
    showBids: false,
    autoDeleteHistory: true
  },

  onLoad() {
    // 加载隐私设置
    this.loadPrivacySettings();
  },

  // 加载隐私设置
  loadPrivacySettings() {
    const showNickname = wx.getStorageSync('showNickname') !== undefined ? 
      wx.getStorageSync('showNickname') : true;
    const showAvatar = wx.getStorageSync('showAvatar') !== undefined ? 
      wx.getStorageSync('showAvatar') : true;
    const showBids = wx.getStorageSync('showBids') !== undefined ? 
      wx.getStorageSync('showBids') : false;
    const autoDeleteHistory = wx.getStorageSync('autoDeleteHistory') !== undefined ? 
      wx.getStorageSync('autoDeleteHistory') : true;
    
    this.setData({
      showNickname,
      showAvatar,
      showBids,
      autoDeleteHistory
    });
  },

  // 切换显示昵称
  toggleShowNickname(e) {
    const checked = e.detail.value;
    this.setData({ showNickname: checked });
    wx.setStorageSync('showNickname', checked);
    this.updatePrivacySettings('show_nickname', checked);
  },

  // 切换显示头像
  toggleShowAvatar(e) {
    const checked = e.detail.value;
    this.setData({ showAvatar: checked });
    wx.setStorageSync('showAvatar', checked);
    this.updatePrivacySettings('show_avatar', checked);
  },

  // 切换显示竞拍记录
  toggleShowBids(e) {
    const checked = e.detail.value;
    this.setData({ showBids: checked });
    wx.setStorageSync('showBids', checked);
    this.updatePrivacySettings('show_bids', checked);
  },

  // 切换自动删除历史记录
  toggleAutoDeleteHistory(e) {
    const checked = e.detail.value;
    this.setData({ autoDeleteHistory: checked });
    wx.setStorageSync('autoDeleteHistory', checked);
    this.updatePrivacySettings('auto_delete_history', checked);
  },

  // 更新隐私设置到服务器
  updatePrivacySettings(key, value) {
    app.request({
      url: `${app.globalData.baseUrl}/users/privacy-settings/`,
      method: 'PUT',
      data: {
        [key]: value
      },
      success: () => {
        console.log(`更新${key}设置成功`);
      },
      fail: () => {
        console.log(`更新${key}设置失败`);
      }
    });
  },

  // 跳转到隐私政策
  navigateToPrivacyPolicy() {
    wx.navigateTo({
      url: '/pages/privacy-policy/privacy-policy'
    });
  },

  // 跳转到用户协议
  navigateToTerms() {
    wx.navigateTo({
      url: '/pages/terms/terms'
    });
  },

  // 显示清除数据确认
  showClearDataConfirm() {
    wx.showModal({
      title: '清除数据',
      content: '确定要清除所有本地数据吗？这将不会影响服务器上的数据。',
      confirmText: '确定清除',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.clearAllData();
        }
      }
    });
  },

  // 清除所有数据
  clearAllData() {
    wx.showLoading({
      title: '清除中',
    });
    
    try {
      // 清除缓存数据
      wx.clearStorageSync();
      
      // 重新设置默认隐私设置
      this.setData({
        showNickname: true,
        showAvatar: true,
        showBids: false,
        autoDeleteHistory: true
      });
      
      wx.hideLoading();
      wx.showToast({
        title: '数据清除成功',
        icon: 'success'
      });
      
      // 重新加载应用
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/login/login'
        });
      }, 1500);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '清除失败，请重试',
        icon: 'none'
      });
    }
  }
});