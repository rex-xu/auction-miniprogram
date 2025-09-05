// about.js
Page({
  data: {
    version: '1.0.0'
  },

  onLoad() {
    // 页面加载时可以获取应用版本信息
    this.getAppVersion();
  },

  // 获取应用版本信息
  getAppVersion() {
    // 这里可以从全局配置或后端API获取版本信息
    // 为了演示，我们直接使用硬编码的版本号
  },

  // 复制邮箱地址
  copyEmail() {
    wx.setClipboardData({
      data: 'support@example.com',
      success: () => {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'success'
        });
      }
    });
  },

  // 拨打电话
  makePhoneCall() {
    wx.makePhoneCall({
      phoneNumber: '4001234567',
      success: () => {
        console.log('拨打电话成功');
      },
      fail: (err) => {
        console.log('拨打电话失败', err);
      }
    });
  },

  // 查看地图位置
  viewLocation() {
    wx.openLocation({
      latitude: 39.984702, // 示例坐标（北京海淀区）
      longitude: 116.305566,
      name: '拍卖小程序总部',
      address: '北京市海淀区科技园区',
      scale: 18
    });
  }
});