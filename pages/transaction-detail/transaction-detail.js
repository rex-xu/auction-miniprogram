// transaction-detail.js
const app = getApp();

Page({
  data: {
    transaction: null,
    loading: true
  },

  onLoad(options) {
    // 获取交易ID
    this.transactionId = options.id;
    // 加载交易详情
    this.loadTransactionDetail();
  },

  // 处理拍卖品数据，添加预处理字段
  processAuctionItem(item) {
    return {
      ...item,
      display_image_url: item.image_url || '/assets/images/default-item.png'
    };
  },

  // 加载交易详情
  loadTransactionDetail() {
    this.setData({ loading: true });
    
    app.request({
      url: `${app.globalData.baseUrl}/transactions/${this.transactionId}/`,
      method: 'GET',
      success: (res) => {
        // 处理拍卖品数据
        if (res.auction_item) {
          res.auction_item = this.processAuctionItem(res.auction_item);
        }
        
        // 为交易详情预先计算状态信息和格式化日期时间
        const transactionWithFormattedData = {
          ...res,
          status_icon: this.getStatusIcon(res.status),
          status_text: this.getStatusText(res.status),
          status_desc: this.getStatusDesc(res.status),
          formatted_created_at: this.formatDateTime(res.created_at)
        };
        
        // 如果有支付时间和退款时间，也格式化
        if (res.paid_at) {
          transactionWithFormattedData.formatted_paid_at = this.formatDateTime(res.paid_at);
        }
        if (res.refunded_at) {
          transactionWithFormattedData.formatted_refunded_at = this.formatDateTime(res.refunded_at);
        }
        
        this.setData({
          transaction: transactionWithFormattedData,
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

  // 获取状态图标
  getStatusIcon(status) {
    const iconMap = {
      'paid': '✓',
      'unpaid': '!',
      'refunded': '↩'
    };
    return iconMap[status] || '';
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'paid': '交易成功',
      'unpaid': '待支付',
      'refunded': '已退款'
    };
    return statusMap[status] || status;
  },

  // 获取状态描述
  getStatusDesc(status) {
    const descMap = {
      'paid': '您的订单已支付成功，卖家将尽快发货',
      'unpaid': '请在48小时内完成支付，否则订单将自动取消',
      'refunded': '您的订单已退款成功，退款将在1-7个工作日内原路返回'
    };
    return descMap[status] || '';
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

  // 处理支付
  handlePay() {
    // 调用支付接口
    app.request({
      url: `${app.globalData.baseUrl}/transactions/${this.transactionId}/pay/`,
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
            // 重新加载交易详情
            this.loadTransactionDetail();
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
  },

  // 确认收货
  confirmReceive() {
    wx.showModal({
      title: '确认收货',
      content: '确认已收到商品吗？确认后交易将完成。',
      success: (res) => {
        if (res.confirm) {
          app.request({
            url: `${app.globalData.baseUrl}/transactions/${this.transactionId}/confirm_receipt/`,
            method: 'POST',
            success: () => {
              wx.showToast({
                title: '确认收货成功',
                icon: 'success'
              });
              // 重新加载交易详情
              this.loadTransactionDetail();
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

  // 联系卖家
  contactSeller() {
    wx.makePhoneCall({
      phoneNumber: '4001234567', // 示例电话号码
      success: () => {
        console.log('拨打电话成功');
      },
      fail: (err) => {
        console.log('拨打电话失败', err);
      }
    });
  }
});