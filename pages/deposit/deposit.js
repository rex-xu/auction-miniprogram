// deposit.js
const app = getApp();

Page({
  data: {
    itemId: null,
    amount: 0,
    auctionItem: {},
    loading: false
  },

  onLoad(options) {
    if (options.itemId) {
      this.setData({
        itemId: options.itemId,
        amount: parseFloat(options.amount || 0)
      });
      this.loadAuctionDetail();
    }
  },

  // 处理拍卖品数据，添加预处理字段
  processAuctionItem(item) {
    return {
      ...item,
      display_title: item.title || '加载中...',
      display_deposit_amount: item.deposit_amount || '0.00'
    };
  },

  // 加载拍卖详情
  loadAuctionDetail() {
    app.request({
      url: `${app.globalData.baseUrl}/auction-items/${this.data.itemId}/`,
      success: (res) => {
        const processedItem = this.processAuctionItem(res);
        this.setData({
          auctionItem: processedItem,
          amount: parseFloat(res.deposit_amount)
        });
      },
      fail: () => {
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
        wx.navigateBack();
      },
      complete: () => {
        // 请求完成后的统一处理逻辑可以在这里添加
      }
    });
  },

  // 缴纳保证金
  payDeposit() {
    if (this.data.amount <= 0) {
      wx.showToast({
        title: '保证金金额错误',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ loading: true });
    
    // 这里简化处理，实际应该调用微信支付API
    app.payDeposit(this.data.itemId, this.data.amount).then(() => {
      wx.showToast({
        title: '缴纳成功',
        icon: 'success'
      });
      
      // 缴纳成功后返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(error => {
      wx.showToast({
        title: error.message || '缴纳失败',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  }
});