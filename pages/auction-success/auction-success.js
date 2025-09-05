// auction-success.js
const app = getApp();

Page({
  data: {
    auctionItem: {},
    remainingAmount: 0,
    itemId: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ itemId: options.id });
      this.loadAuctionDetail();
    }
  },

  // 加载拍卖详情
  loadAuctionDetail() {
    app.request({
      url: `${app.globalData.baseUrl}/auction-items/${this.data.itemId}/`,
      success: (res) => {
        // 计算待支付余额 = 成交价 - 保证金
        const remainingAmount = (parseFloat(res.current_price) - parseFloat(res.deposit_amount)).toFixed(2);
        
        this.setData({
          auctionItem: res,
          remainingAmount: remainingAmount
        });
      },
      fail: () => {
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 前往支付页面
  goToPayment() {
    // 这里简化处理，实际应该跳转到支付页面
    wx.showModal({
      title: '支付确认',
      content: `确认支付剩余金额 ¥${this.data.remainingAmount}？`,
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '支付功能开发中',
            icon: 'none'
          });
          // 实际项目中应该调用支付API
          // wx.navigateTo({ url: `/pages/payment/payment?itemId=${this.data.itemId}&amount=${this.data.remainingAmount}` });
        }
      }
    });
  },

  // 跳转到我的竞拍页面
  navigateToMyBids() {
    wx.switchTab({
      url: '/pages/my-bids/my-bids'
    });
  }
});