// account.js
const app = getApp();

Page({
  data: {
    userInfo: {
      nickname: '',
      avatar: '',
      phone: '',
      created_at: ''
    }
  },

  onLoad() {
    // 加载用户信息
    this.loadUserInfo();
  },

  onShow() {
    // 每次显示页面都重新加载用户信息
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    app.request({
      url: `${app.globalData.baseUrl}/users/profile/`,
      method: 'GET',
      success: (res) => {
        this.setData({
          userInfo: res
        });
      },
      fail: () => {
        wx.showToast({
          title: '加载用户信息失败',
          icon: 'none'
        });
      }
    });
  },

  // 格式化日期时间
  formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 跳转到修改密码页面
  navigateToChangePassword() {
    wx.navigateTo({
      url: '/pages/change-password/change-password'
    });
  },

  // 绑定手机号
  bindPhone() {
    if (this.data.userInfo.phone) {
      wx.showModal({
        title: '提示',
        content: '您已绑定手机号，是否更换？',
        success: (res) => {
          if (res.confirm) {
            this.doBindPhone();
          }
        }
      });
    } else {
      this.doBindPhone();
    }
  },

  // 执行绑定手机号操作
  doBindPhone() {
    wx.showLoading({
      title: '获取手机号权限中',
    });
    
    // 这里需要调用微信官方的获取手机号接口
    // 注意：需要用户授权
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '请使用微信官方接口获取手机号',
        icon: 'none'
      });
    }, 1000);
  },

  // 显示注销账号确认
  showDeleteConfirm() {
    wx.showModal({
      title: '注销账号',
      content: '注销后，您的所有数据将被永久删除，且无法恢复。您确定要继续吗？',
      confirmText: '确定注销',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.deleteAccount();
        }
      }
    });
  },

  // 注销账号
  deleteAccount() {
    wx.showLoading({
      title: '处理中',
    });
    
    app.request({
      url: `${app.globalData.baseUrl}/users/delete/`,
      method: 'DELETE',
      success: () => {
        wx.hideLoading();
        wx.showToast({
          title: '账号注销成功',
          icon: 'success'
        });
        
        // 清除登录信息
        app.logout();
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '注销失败，请重试',
          icon: 'none'
        });
      }
    });
  }
});