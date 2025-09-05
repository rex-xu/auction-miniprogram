// my-deposits.js
const app = getApp();

Page({
  data: {
    deposits: [],
    activeTab: 'all', // all, paid, refunded
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onShow() {
    // 每次显示页面都重新加载数据
    this.setData({
      deposits: [],
      page: 1,
      hasMore: true
    });
    this.loadMyDeposits();
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
      deposits: [],
      page: 1,
      hasMore: true
    });
    this.loadMyDeposits();
  },

  // 加载我的保证金记录
  loadMyDeposits() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    let status = '';
    switch (this.data.activeTab) {
      case 'paid':
        status = 'paid';
        break;
      case 'refunded':
        status = 'refunded';
        break;
    }
    
    app.request({
      url: `${app.globalData.baseUrl}/user-deposits/`,
      data: {
        page: this.data.page,
        page_size: this.data.pageSize,
        status: status
      },
      success: (res) => {
        const newDeposits = res.results || [];
        const hasMore = newDeposits.length === this.data.pageSize;
        
        this.setData({
          deposits: [...this.data.deposits, ...newDeposits],
          hasMore: hasMore,
          page: this.data.page + 1,
          loading: false
        });
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

  // 加载更多
  loadMore() {
    this.loadMyDeposits();
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'paid': '已缴纳',
      'refunded': '已退还',
      'forfeited': '已扣除'
    };
    return statusMap[status] || status;
  },

  // 格式化日期时间
  formatDateTime(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
});