// terms.js
const app = getApp();

Page({
  data: {
    loading: true
  },

  onLoad() {
    // 加载用户协议内容
    this.loadTermsContent();
    // 记录用户查看行为
    this.recordTermsView();
  },

  // 加载用户协议内容
  loadTermsContent() {
    this.setData({ loading: true });
    
    app.request({
      url: `${app.globalData.baseUrl}/terms/`,
      method: 'GET',
      success: (res) => {
        // 这里可以根据返回的数据更新页面内容
        // 目前我们使用静态内容，所以只需要设置loading为false
        this.setData({ loading: false });
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 记录用户查看行为
  recordTermsView() {
    app.request({
      url: `${app.globalData.baseUrl}/terms/view/`,
      method: 'POST',
      success: () => {
        console.log('记录用户查看协议成功');
      },
      fail: () => {
        console.log('记录用户查看协议失败');
      }
    });
  },

  // 联系客服
  contactService() {
    wx.makePhoneCall({
      phoneNumber: '4001234567', // 示例电话号码
      success: () => {
        console.log('拨打电话成功');
      },
      fail: (err) => {
        console.log('拨打电话失败', err);
      }
    });
  },

  // 复制邮箱
  copyEmail() {
    wx.setClipboardData({
      data: 'support@example.com',
      success: () => {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败，请重试',
          icon: 'none'
        });
      }
    });
  }
});