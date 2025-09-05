// register.js
const app = getApp();

Page({
  data: {
    phone: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    loading: false
  },

  // 输入手机号码
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  // 输入昵称
  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  // 输入密码
  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  // 确认密码
  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  // 注册
  register() {
    const { phone, nickname, password, confirmPassword } = this.data;
    
    // 表单验证
    if (!phone) {
      wx.showToast({
        title: '请输入手机号码',
        icon: 'none'
      });
      return;
    }
    
    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    
    if (!password) {
      wx.showToast({
        title: '请设置密码',
        icon: 'none'
      });
      return;
    }
    
    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次输入的密码不一致',
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
    
    // 验证密码格式
    if (password.length < 6 || password.length > 20) {
      wx.showToast({
        title: '密码长度应为6-20位',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ loading: true });
    
    app.register(phone, password, nickname).then(() => {
      wx.showToast({
        title: '注册成功',
        icon: 'success'
      });
      
      // 注册成功后跳转到登录页面
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }, 1500);
    }).catch(error => {
      wx.showToast({
        title: error.message || '注册失败',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  // 跳转到登录页面
  navigateToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  }
});