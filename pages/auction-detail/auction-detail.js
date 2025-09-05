// auction-detail.js
const app = getApp();

Page({
  data: {
    auctionItem: {},
    bidHistory: [],
    bidPrice: '',
    quickBidOptions: [],
    hasPaidDeposit: false,
    canBid: true,
    submittingBid: false,
    itemId: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ itemId: options.id });
      this.loadAuctionDetail();
      this.checkDepositStatus();
      this.loadBidHistory();
      
      // 设置定时器，实时更新倒计时
      this.timer = setInterval(() => {
        this.updateCountdown();
      }, 1000);
    }
  },

  onUnload() {
    // 清除定时器
    if (this.timer) {
      clearInterval(this.timer);
    }
  },

  // 加载拍卖详情
  loadAuctionDetail() {
    app.request({
      url: `${app.globalData.baseUrl}/auction-items/${this.data.itemId}/`,
      success: (res) => {
        const now = Date.now();
        const endTime = new Date(res.end_time).getTime();
        res.remaining_time = Math.max(0, endTime - now);
        
        // 生成快速出价选项
        const currentPrice = parseFloat(res.current_price);
        const increment = parseFloat(res.bid_increment);
        const quickBids = [
          currentPrice + increment,
          currentPrice + increment * 2,
          currentPrice + increment * 3
        ].map(price => price.toFixed(2));
        
        this.setData({
          auctionItem: res,
          quickBidOptions: quickBids,
          bidPrice: (currentPrice + increment).toFixed(2)
        });
      },
      fail: () => {
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
        wx.navigateBack();
      }
    });
  },

  // 检查保证金状态
  checkDepositStatus() {
    app.checkDeposit(this.data.itemId).then(hasPaid => {
      this.setData({ hasPaidDeposit: hasPaid });
    });
  },

  // 加载出价历史
  loadBidHistory() {
    app.request({
      url: `${app.globalData.baseUrl}/bids/`,
      data: {
        auction_item: this.data.itemId,
        ordering: '-created_at',
        page_size: 20
      },
      success: (res) => {
        this.setData({ bidHistory: res.results || [] });
      }
    });
  },

  // 更新倒计时
  updateCountdown() {
    if (this.data.auctionItem.status !== 'in_progress' || !this.data.auctionItem.end_time) return;
    
    const now = Date.now();
    const endTime = new Date(this.data.auctionItem.end_time).getTime();
    const remainingTime = Math.max(0, endTime - now);
    
    this.setData({
      'auctionItem.remaining_time': remainingTime
    });
    
    // 如果拍卖结束，重新加载详情
    if (remainingTime === 0) {
      this.loadAuctionDetail();
    }
  },

  // 输入出价金额
  onBidInput(e) {
    const price = e.detail.value;
    this.setData({ bidPrice: price });
    this.validateBidPrice();
  },

  // 快速出价
  onQuickBid(e) {
    const price = e.currentTarget.dataset.price;
    this.setData({ bidPrice: price });
    this.validateBidPrice();
  },

  // 验证出价金额
  validateBidPrice() {
    const bidPrice = parseFloat(this.data.bidPrice);
    const currentPrice = parseFloat(this.data.auctionItem.current_price);
    const minBidPrice = currentPrice + parseFloat(this.data.auctionItem.bid_increment);
    
    const canBid = !isNaN(bidPrice) && bidPrice >= minBidPrice;
    this.setData({ canBid });
  },

  // 提交出价
  submitBid() {
    if (!this.data.hasPaidDeposit) {
      wx.showToast({
        title: '请先缴纳保证金',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.canBid) {
      wx.showToast({
        title: '出价金额过低',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ submittingBid: true });
    
    app.submitBid(this.data.itemId, this.data.bidPrice).then(() => {
      wx.showToast({
        title: '出价成功',
        icon: 'success'
      });
      // 重新加载详情和出价历史
      this.loadAuctionDetail();
      this.loadBidHistory();
    }).catch(error => {
      wx.showToast({
        title: error.message || '出价失败',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ submittingBid: false });
    });
  },

  // 跳转到缴纳保证金页面
  navigateToDeposit() {
    wx.navigateTo({
      url: `/pages/deposit/deposit?itemId=${this.data.itemId}&amount=${this.data.auctionItem.deposit_amount}`
    });
  },

  // 格式化时间
  formatTime(milliseconds, type) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    
    switch (type) {
      case 'hours':
        return hours.toString().padStart(2, '0');
      case 'minutes':
        return minutes.toString().padStart(2, '0');
      case 'seconds':
        return seconds.toString().padStart(2, '0');
      default:
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  },

  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'upcoming': '即将开始',
      'in_progress': '进行中',
      'ended': '已结束'
    };
    return statusMap[status] || status;
  },

  // 获取状态样式
  getStatusClass(status) {
    const classMap = {
      'upcoming': 'tag-upcoming',
      'in_progress': 'tag-active',
      'ended': 'tag-ended'
    };
    return classMap[status] || '';
  }
});