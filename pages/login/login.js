// login.js
const app = getApp();

Page({
  data: {
    loading: false
  },

  // 微信登录
  wechatLogin() {
    this.setData({ loading: true });
    
    // 先调用wx.getUserProfile获取用户信息（必须直接由用户点击触发）
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (userProfileRes) => {
        // 再调用wx.login获取登录code
        wx.login({
          success: (loginRes) => {
            if (loginRes.code) {
              // 调用app中的微信登录方法，传入code和用户信息
              app.wechatLogin(loginRes.code, userProfileRes.userInfo).then(() => {
                wx.showToast({
                  title: '登录成功',
                  icon: 'success'
                });
                
                // 登录成功后返回上一个页面（例如拍卖详情页）
                // 使用setTimeout确保toast提示能显示完整
                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
              }).catch(error => {
                console.error('登录失败:', error);
              }).finally(() => {
                this.setData({ loading: false });
              });
            } else {
              wx.showToast({
                title: '获取登录凭证失败',
                icon: 'none'
              });
              this.setData({ loading: false });
            }
          },
          fail: () => {
            wx.showToast({
              title: '获取登录凭证失败',
              icon: 'none'
            });
            this.setData({ loading: false });
          }
        });
      },
      fail: (err) => {
        // 用户拒绝授权
        if (err.errMsg.indexOf('auth deny') >= 0) {
          wx.showToast({
            title: '需要您授权才能登录',
            icon: 'none'
          });
        } else {
          const errorMsg = err.errMsg || '获取用户信息失败';
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          });
        }
        this.setData({ loading: false });
      }
    });
  },

  // 查看用户协议
  viewAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '这里是用户协议内容...',
      showCancel: false
    });
  },

  // 查看隐私政策
  viewPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '这里是隐私政策内容...',
      showCancel: false
    });
  }
});