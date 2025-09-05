// transaction.js
const app = getApp();

Page({
  data: {
    transactions: [],
    activeTab: 'all', // all, paid, unpaid, refunded
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onShow() {
    // 每次显示页面都重新加载数据
    this.setData({
      transactions: [],
      page: 1,
      hasMore: true
    });
    this.loadTransactions();
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
      transactions: [],
      page: 1,
      hasMore: true
    });
    this.loadTransactions();
  },

  // 加载交易记录
  loadTransactions() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    let status = '';
    switch (this.data.activeTab) {
      case 'paid':
        status = 'paid';
        break;
      case 'unpaid':
        status = 'unpaid';
        break;
      case 'refunded':
        status = 'refunded';
        break;
    }
    
    app.request({
      url: `${app.globalData.baseUrl}/transactions/`,
      data: {
        page: this.data.page,
        page_size: this.data.pageSize,
        status: status
      },
      success: (res) => {
        const newTransactions = res.results || [];
        const hasMore = newTransactions.length === this.data.pageSize;
        
        this.setData({
          transactions: [...this.data.transactions, ...newTransactions],
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
    this.loadTransactions();
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'paid': '已支付',
      'unpaid': '待支付',
      'refunded': '已退款'
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
  },

  // 查看交易详情
  viewTransactionDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/transaction-detail/transaction-detail?id=${id}`
    });
  },

  // 处理支付
  handlePay(e) {
    e.stopPropagation(); // 阻止事件冒泡
    const transactionId = e.currentTarget.dataset.id;
    
    // 调用支付接口
    app.request({
      url: `${app.globalData.baseUrl}/transactions/${transactionId}/pay/`,
      method: 'POST',
      success: (res) => {
        // 调用微信支付接口
        wx.requestPayment({
          timeStamp: res.timeStamp,
          nonceStr: res.nonceStr,
          package: res.package,
          signType: res.signType,
          paySign: res.paySign,
          success: () => {
            wx.showToast({
              title: '支付成功',
              icon: 'success'
            });
            // 重新加载交易记录
            this.loadTransactions();
          },
          fail: () => {
            wx.showToast({
              title: '支付取消',
              icon: 'none'
            });
          }
        });
      },
      fail: () => {
        wx.showToast({
          title: '获取支付信息失败',
          icon: 'none'
        });
      }
    });
  }
});