// privacy-policy.js
Page({
  data: {
    // 隐私政策页面通常不需要太多动态数据
  },

  onLoad() {
    // 页面加载时可以记录用户查看隐私政策的行为
    this.recordPolicyView();
  },

  // 记录用户查看隐私政策的行为
  recordPolicyView() {
    // 这里可以添加埋点代码，记录用户查看隐私政策的行为
    console.log('用户查看隐私政策');
    
    // 实际项目中可以调用后端API记录这个行为
    // wx.request({
    //   url: `${app.globalData.baseUrl}/analytics/policy-view/`,
    //   method: 'POST',
    //   success: (res) => {
    //     console.log('记录查看行为成功');
    //   }
    // });
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
  }
});