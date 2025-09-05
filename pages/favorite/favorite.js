// favorite.js
const app = getApp();

Page({
  data: {
    activeTab: 'all', // all, auction, article
    favorites: [],
    loading: true,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onShow() {
    // 每次页面显示时重新加载数据
    this.resetData();
    this.loadFavorites();
  },

  // 重置数据
  resetData() {
    this.setData({
      favorites: [],
      page: 1,
      hasMore: true
    });
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
    this.resetData();
    this.loadFavorites();
  },

  // 加载收藏列表
  loadFavorites() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    const params = {
      page: this.data.page,
      page_size: this.data.pageSize
    };
    
    // 根据当前选中的标签设置过滤参数
    if (this.data.activeTab !== 'all') {
      params.type = this.data.activeTab;
    }
    
    app.request({
      url: `${app.globalData.baseUrl}/favorites/`,
      method: 'GET',
      data: params,
      success: (res) => {
        const newFavorites = res.results || [];
        const allFavorites = [...this.data.favorites, ...newFavorites];
        
        this.setData({
          favorites: allFavorites,
          loading: false,
          hasMore: newFavorites.length === this.data.pageSize,
          page: this.data.page + 1
        });
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        // 请求完成后的统一处理逻辑可以在这里添加
      }
    });
  },

  // 加载更多
  loadMore() {
    this.loadFavorites();
  },

  // 查看详情
  viewDetail(e) {
    const { id, type } = e.currentTarget.dataset;
    
    if (type === 'auction') {
      wx.navigateTo({
        url: `/pages/auction-detail/auction-detail?id=${id}`
      });
    } else if (type === 'article') {
      wx.navigateTo({
        url: `/pages/article-detail/article-detail?id=${id}`
      });
    }
  },

  // 取消收藏
  unfavorite(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏吗？',
      success: (res) => {
        if (res.confirm) {
          app.request({
            url: `${app.globalData.baseUrl}/favorites/${id}/`,
            method: 'DELETE',
            success: () => {
              // 从列表中移除该收藏项
              const updatedFavorites = this.data.favorites.filter(item => item.id !== id);
              this.setData({
                favorites: updatedFavorites
              });
              
              wx.showToast({
                title: '取消收藏成功',
                icon: 'success'
              });
            },
            fail: () => {
              wx.showToast({
                title: '操作失败，请重试',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 阻止事件冒泡，避免触发viewDetail
  },

  // 获取拍卖品状态文本
  getStatusText(status) {
    const statusMap = {
      'ongoing': '进行中',
      'ended': '已结束',
      'upcoming': '即将开始'
    };
    return statusMap[status] || status;
  },

  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
});