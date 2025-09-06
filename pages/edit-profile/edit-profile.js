const app = getApp();

Page({
  data: {
    nickname: '',
    bio: '',
    isSaving: false
  },

  onLoad() {
    // 加载用户当前资料
    this.loadUserProfile();
  },

  // 加载用户当前资料
  loadUserProfile() {
    wx.showLoading({
      title: '加载中',
    });
    
    // 首先获取用户信息
    app.request({
      url: `${app.globalData.baseUrl}/users/me/`,
      method: 'GET',
      success: (res) => {
        // 然后获取用户详细资料
        app.request({
          url: `${app.globalData.baseUrl}/user-profiles/`,
          method: 'GET',
          success: (profileRes) => {
            // 查找当前用户的资料
            const userProfile = profileRes.results.find(profile => profile.user === res.id);
            if (userProfile) {
              this.setData({
                nickname: userProfile.nickname || '',
                bio: userProfile.bio || ''
              });
            }
            wx.hideLoading();
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({
              title: '加载资料失败',
              icon: 'none'
            });
          }
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '加载用户信息失败',
          icon: 'none'
        });
      }
    });
  },

  // 处理昵称输入
  onNicknameInput(e) {
    this.setData({
      nickname: e.detail.value
    });
  },

  // 处理个人简介输入
  onBioInput(e) {
    this.setData({
      bio: e.detail.value
    });
  },

  // 保存修改的资料
  saveProfile() {
    const { nickname, bio } = this.data;
    
    // 验证输入
    if (!nickname.trim()) {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      });
      return;
    }
    
    if (nickname.length > 50) {
      wx.showToast({
        title: '昵称不能超过50个字符',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      isSaving: true
    });
    
    // 先获取用户信息以获取用户ID
    app.request({
      url: `${app.globalData.baseUrl}/users/me/`,
      method: 'GET',
      success: (res) => {
        const userId = res.id;
        
        // 获取用户资料ID
        app.request({
          url: `${app.globalData.baseUrl}/user-profiles/`,
          method: 'GET',
          success: (profileRes) => {
            const userProfile = profileRes.results.find(profile => profile.user === userId);
            
            if (userProfile) {
              // 更新现有资料
              app.request({
                url: `${app.globalData.baseUrl}/user-profiles/${userProfile.id}/`,
                method: 'PUT',
                data: {
                  nickname: nickname,
                  bio: bio
                },
                success: () => {
                  // 保存成功后显示提示
                  wx.hideLoading();
                  wx.showToast({
                    title: '保存成功',
                    icon: 'success'
                  });
                  
                  // 刷新当前页面的用户信息
                  this.loadUserProfile();
                  
                  // 返回上一页
                  setTimeout(() => {
                    wx.navigateBack();
                  }, 1500);
                },
                fail: () => {
                  this.setData({
                    isSaving: false
                  });
                  wx.showToast({
                    title: '保存失败，请重试',
                    icon: 'none'
                  });
                }
              });
            } else {
              // 创建新资料（一般不会进入这个分支，因为注册时应该已经创建）
              app.request({
                url: `${app.globalData.baseUrl}/user-profiles/`,
                method: 'POST',
                data: {
                  user: userId,
                  nickname: nickname,
                  bio: bio
                },
                success: () => {
                  // 保存成功后显示提示
                  wx.hideLoading();
                  wx.showToast({
                    title: '保存成功',
                    icon: 'success'
                  });
                  
                  // 刷新当前页面的用户信息
                  this.loadUserProfile();
                  
                  setTimeout(() => {
                    wx.navigateBack();
                  }, 1500);
                },
                fail: () => {
                  this.setData({
                    isSaving: false
                  });
                  wx.showToast({
                    title: '保存失败，请重试',
                    icon: 'none'
                  });
                }
              });
            }
          },
          fail: () => {
            this.setData({
              isSaving: false
            });
            wx.showToast({
              title: '获取资料失败，请重试',
              icon: 'none'
            });
          }
        });
      },
      fail: () => {
        this.setData({
          isSaving: false
        });
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
      }
    });
  }
});