// my-deposits.js
const app = getApp();

Page({
  data: {
    deposits: [],
    activeTab: 'all', // all, paid, refunded
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    userInfo: null
  },

  onShow() {
    // 每次显示页面都重新加载数据
    this.setData({
      deposits: [],
      page: 1,
      hasMore: true,
      userInfo: app.globalData.userInfo
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
  formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';
    
    // 创建Date对象
    const date = new Date(dateTimeString);
    
    // 检查是否是有效日期
    if (isNaN(date.getTime())) return '';
    
    // 获取年、月、日、小时、分钟
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    // 格式化为：YYYY-MM-DD HH:MM
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  // 加载我的保证金记录
  loadMyDeposits() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    const requestData = {
      page: this.data.page,
      page_size: this.data.pageSize
    };
    
    // 只有在非'all'标签时才添加status参数
    if (this.data.activeTab !== 'all') {
      requestData.status = this.data.activeTab;
    }
    
    app.request({
      url: `${app.globalData.baseUrl}/deposits/`,
      data: requestData,
      success: (res) => {
        let newDeposits = res.results || [];
        
        // 预处理每条记录，添加imageUrl、状态文本和格式化日期
        newDeposits = newDeposits.map(deposit => {
          return {
            ...deposit,
            imageUrl: app.getImageUrl(deposit.auction_item_info),
            status_text: this.getStatusText(deposit.status),
            formatted_created_at: this.formatDateTime(deposit.created_at)
          };
        });
        
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
      },
      complete: () => {
        // 请求完成后的统一处理逻辑可以在这里添加
      }
    });
  },

  // 加载更多
  loadMore() {
    this.loadMyDeposits();
  },
  
  // 跳转到拍卖品详情页
  goToAuctionDetail(e) {
    const auctionId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/auction-detail/auction-detail?id=${auctionId}`
    });
  },

  // 申请退款
  applyRefund(e) {
    const auctionId = e.currentTarget.dataset.id;
    const depositItem = this.data.deposits.find(item => item.auction_item_info.id === auctionId);

    wx.showModal({
      title: '申请退款',
      content: `确定要申请退还拍卖品 "${depositItem.auction_item_info.title}" 的保证金 ${depositItem.amount} 元吗？`,
      success: (res) => {
        if (res.confirm) {
          this.submitRefundRequest(auctionId, depositItem);
        }
      }
    });
  },

  // 提交退款请求
  submitRefundRequest(auctionId, depositItem) {
    wx.showLoading({
      title: '处理中...'
    });

    app.request({
      url: `${app.globalData.baseUrl}/auction-items/${auctionId}/refund_deposit/`,
      method: 'POST',
      success: (res) => {
        // 注意：app.request已经处理了统一响应格式，这里的res可能是直接的data部分
        // 我们需要重新调整成功处理逻辑
        wx.showToast({
          title: '退款申请成功',
          icon: 'success',
          duration: 2000,
          success: () => {
            // 刷新页面数据
            setTimeout(() => {
              this.setData({
                deposits: [],
                page: 1,
                hasMore: true
              });
              this.loadMyDeposits();
            }, 2000);
          }
        });
      },
      fail: (err) => {
        console.error('退款请求失败:', err);
        // 从app.js的request方法返回的Error对象中，错误信息直接在message属性中
        let errorMsg = err.message || '网络请求失败，请重试';
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
});