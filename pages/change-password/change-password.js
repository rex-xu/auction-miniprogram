// change-password.js
const app = getApp();

Page({
  data: {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    loading: false
  },

  // 输入旧密码
  onOldPasswordInput(e) {
    this.setData({ oldPassword: e.detail.value });
  },

  // 输入新密码
  onNewPasswordInput(e) {
    this.setData({ newPassword: e.detail.value });
  },

  // 确认新密码
  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  // 修改密码
  changePassword() {
    const { oldPassword, newPassword, confirmPassword } = this.data;
    
    // 表单验证
    if (!oldPassword) {
      wx.showToast({
        title: '请输入当前密码',
        icon: 'none'
      });
      return;
    }
    
    if (!newPassword) {
      wx.showToast({
        title: '请输入新密码',
        icon: 'none'
      });
      return;
    }
    
    if (!confirmPassword) {
      wx.showToast({
        title: '请确认新密码',
        icon: 'none'
      });
      return;
    }
    
    // 验证密码格式
    if (newPassword.length < 6 || newPassword.length > 20) {
      wx.showToast({
        title: '密码长度应为6-20位',
        icon: 'none'
      });
      return;
    }
    
    // 验证两次输入的密码是否一致
    if (newPassword !== confirmPassword) {
      wx.showToast({
        title: '两次输入的新密码不一致',
        icon: 'none'
      });
      return;
    }
    
    // 验证新密码与旧密码是否相同
    if (oldPassword === newPassword) {
      wx.showToast({
        title: '新密码不能与旧密码相同',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ loading: true });
    
    // 调用修改密码接口
    app.request({
      url: `${app.globalData.baseUrl}/users/change-password/`,
      method: 'POST',
      data: {
        old_password: oldPassword,
        new_password: newPassword
      },
      success: () => {
        wx.showToast({
          title: '密码修改成功',
          icon: 'success'
        });
        
        // 修改成功后返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      },
      fail: (error) => {
        wx.showToast({
          title: error.message || '修改密码失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // 清除输入内容
  clearInput(e) {
    const { type } = e.currentTarget.dataset;
    if (type === 'old') {
      this.setData({ oldPassword: '' });
    } else if (type === 'new') {
      this.setData({ newPassword: '' });
    } else if (type === 'confirm') {
      this.setData({ confirmPassword: '' });
    }
  }
});