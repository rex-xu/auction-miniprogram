// login.js
const app = getApp();

Page({
  data: {
    phone: '',
    password: '',
    loading: false
  },

  // 输入手机号码
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  // 输入密码
  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  // 登录
  login() {
    const { phone, password } = this.data;
    
    // 表单验证
    if (!phone) {
      wx.showToast({
        title: '请输入手机号码',
        icon: 'none'
      });
      return;
    }
    
    if (!password) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return;
    }
    
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      wx.showToast({
        title: '请输入正确的手机号码',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ loading: true });
    
    app.login(phone, password).then(() => {
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
      
      // 登录成功后跳转回首页或上一个页面
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
      } else {
        wx.switchTab({ url: '/pages/index/index' });
      }
    }).catch(error => {
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  // 跳转到注册页面
  navigateToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  }
});